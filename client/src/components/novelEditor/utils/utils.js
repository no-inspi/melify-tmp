export function convertToHTML(blocks) {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'header': {
          return `<h${block.data.level}>${block.data.text}</h${block.data.level}>`;
        }
        case 'paragraph': {
          return `<p>${block.data.text}</p>`;
        }
        case 'list': {
          const listTag = block.data.style === 'ordered' ? 'ol' : 'ul';
          const items = block.data.items.map((item) => `<li>${item.content}</li>`).join('');
          return `<${listTag}>${items}</${listTag}>`;
        }
        // Add more cases for other block types as needed
        default:
          return '';
      }
    })
    .join(''); // Join all the generated HTML strings together
}

export function convertHTMLToBlocks(html) {
  const blocks = [];
  const parser = new DOMParser();

  // The exact string to omit
  const stringToOmit = 'Sent with <a href="https://melify.fr" target="_blank">Melify</a>';
  if (html) {
    // Remove the exact string from the HTML
    const cleanedHtml = html.replace(stringToOmit, '');

    // Parse the cleaned HTML string into a DOM structure
    const doc = parser.parseFromString(cleanedHtml, 'text/html');

    const processNode = (node) => {
      if (node.nodeType === 3) {
        // TEXT_NODE
        const text = node.textContent.trim();
        if (text) {
          blocks.push({
            id: generateBlockId(),
            type: 'paragraph',
            data: {
              text,
            },
          });
        }
      }

      if (node.nodeName === 'P' || node.nodeName === 'DIV') {
        const paragraphs = Array.from(node.childNodes)
          .map((childNode) => childNode.textContent.trim())
          .filter(Boolean);

        paragraphs.forEach((paragraph) => {
          blocks.push({
            id: generateBlockId(),
            type: 'paragraph',
            data: {
              text: paragraph,
            },
          });
        });
      }

      if (node.nodeName === 'A') {
        blocks.push({
          id: generateBlockId(),
          type: 'paragraph',
          data: {
            text: `<a href="${node.href}" target="${node.target}">${node.textContent}</a>`,
          },
        });
      }
    };

    // Iterate over each child node of the body
    doc.body.childNodes.forEach((node) => {
      processNode(node);
    });

    console.log('blocks', blocks);

    return blocks;
  }
  return [];
}

// Utility function to generate a unique ID for each block
function generateBlockId() {
  return Math.random().toString(36).substring(2, 15);
}
