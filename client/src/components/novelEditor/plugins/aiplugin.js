// utils
import { convertHTMLToBlocks } from 'src/components/novelEditor/utils/utils';

class AIPlugin {
  static get toolbox() {
    return {
      title: '(AI) Generate',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 30 30"><path fill="black" d="M5.37 16.18q.975-.045 1.65-.75c.45-.47.68-1.03.68-1.68c0 .65.22 1.21.67 1.68q.675.705 1.65.75q-.975.045-1.65.75a2.34 2.34 0 0 0-.67 1.68c0-.65-.22-1.21-.68-1.68q-.675-.705-1.65-.75m2.33-7.2q1.89-.09 3.21-1.47c.88-.92 1.32-2.01 1.32-3.28c0 1.27.44 2.36 1.32 3.28s1.95 1.4 3.22 1.47c-.83.04-1.59.27-2.29.71c-.69.43-1.24 1.01-1.65 1.73c-.4.72-.6 1.49-.6 2.33c0-1.27-.44-2.37-1.32-3.29c-.88-.93-1.95-1.42-3.21-1.48m3.32 10.77c.95-.04 1.76-.41 2.42-1.1s.99-1.51.99-2.47c0 .96.33 1.78.99 2.47s1.46 1.06 2.41 1.1c-.95.04-1.75.41-2.41 1.1s-.99 1.51-.99 2.47c0-.96-.33-1.78-.99-2.47a3.5 3.5 0 0 0-2.42-1.1m6.81-4.74c.95-.04 1.75-.41 2.41-1.1s.98-1.51.98-2.48c0 .96.33 1.78.99 2.47s1.47 1.06 2.42 1.1c-.95.04-1.76.41-2.42 1.1s-.99 1.51-.99 2.47c0-.96-.33-1.78-.98-2.47c-.66-.68-1.46-1.05-2.41-1.09"/></svg>', // Your SVG icon here
    };
  }

  constructor({ data, api, block, config }) {
    this.data = data || {};
    this.api = api;
    this.block = block;
    this.config = config;
    this.wrapper = null;
  }

  render() {
    this.wrapper = document.createElement('div');

    // Trigger the floating toolbar immediately after rendering
    setTimeout(() => {
      if (this.wrapper && this.config && this.config.showFloatingToolbar) {
        this.config.showFloatingToolbar(this.wrapper, this);
      }
    }, 0);

    return this.wrapper;
  }

  async generateAIContentStreaming(prompt) {
    if (!prompt) {
      console.log('Please enter a prompt');
      return Promise.resolve();
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_HOST_API}/api/ai/generateEmail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processChunk = ({ done, value }) => {
        if (done) {
          return this.finalizeInsertion(buffer);
        }

        const decodedValue = decoder.decode(value, { stream: true });
        buffer += decodedValue;

        const parts = buffer.split(/<\/?(p|ul|ol|li)>/g);

        parts.forEach((part, index) => {
          if (index % 2 === 0) {
            return;
          }

          const content = parts[index + 1]?.trim() || '';
          if (!content) return;

          switch (part) {
            case 'p':
              this.api.blocks.insert('paragraph', { text: content });
              break;
            case 'li':
              this.insertOrExtendList(content);
              break;
            case 'ul':
            case 'ol':
              break;
            default:
              break;
          }
        });

        buffer = '';
        return reader.read().then(processChunk);
      };

      return reader.read().then(processChunk);
    } catch (error) {
      console.error('Error generating AI content:', error);
      return Promise.reject(error);
    }
  }

  async generateAIContent(prompt) {
    if (!prompt) {
      console.log('Please enter a prompt');
      return Promise.resolve();
    }

    try {
      // Make a POST request to the backend to generate HTML content
      const response = await fetch(`${process.env.REACT_APP_HOST_API}/api/ai/generateEmail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      console.log('response', response);

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const result = await response.json();
      const htmlContent = result.html;
      console.log('htmlContent', htmlContent);
      // Convert the HTML content to blocks using the utility function
      const blocks = convertHTMLToBlocks(htmlContent);
      console.log('blocks', blocks);

      blocks.forEach((block) => {
        this.api.blocks.insert(block.type, block.data);
      });
      return null;
    } catch (error) {
      console.error('Error generating AI content:', error);
      return Promise.reject(error);
    }
  }

  insertOrExtendList(content) {
    const currentBlock = this.api.blocks.getCurrentBlockIndex();
    const blockType = this.api.blocks.getBlockByIndex(currentBlock)?.tool;

    if (blockType === 'list') {
      const {items} = this.api.blocks.getBlockByIndex(currentBlock).data;
      items.push({ content, items: [] });
      this.api.blocks.update(currentBlock, { items });
    } else {
      this.api.blocks.insert('list', {
        style: 'unordered',
        items: [{ content, items: [] }],
      });
    }
  }

  finalizeInsertion(buffer) {
    if (buffer.trim()) {
      this.api.blocks.insert('paragraph', { text: buffer.trim() });
    }
    return Promise.resolve();
  }

  save() {
    return { prompt: this.data.prompt };
  }
}

export default AIPlugin;
