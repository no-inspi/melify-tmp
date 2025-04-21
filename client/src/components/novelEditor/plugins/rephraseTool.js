import { jellyTriangle } from 'ldrs';

jellyTriangle.register('jt-icon');

// Utility functions outside the class
function getSelectedText() {
  const selection = window.getSelection();
  return selection.toString();
}

function replaceSelectedText(newText) {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  range.deleteContents();
  range.insertNode(document.createTextNode(newText));

  // Clear the selection after replacing the text
  selection.removeAllRanges();
  selection.addRange(range);
}

class RephraseTool {
  static get isInline() {
    return true;
  }

  static get title() {
    return 'Rephrase';
  }

  static get icon() {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 30 30"><g fill="none"><path d="m12.594 23.258l-.012.002l-.071.035l-.02.004l-.014-.004l-.071-.036q-.016-.004-.024.006l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.016-.018m.264-.113l-.014.002l-.184.093l-.01.01l-.003.011l.018.43l.005.012l.008.008l.201.092q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.003-.011l.018-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="M4 4a1 1 0 0 0 0 2h16a1 1 0 1 0 0-2zm13 4a1 1 0 0 1 .946.677l.13.378a3 3 0 0 0 1.869 1.87l.378.129a1 1 0 0 1 0 1.892l-.378.13a3 3 0 0 0-1.87 1.869l-.129.378a1 1 0 0 1-1.892 0l-.13-.378a3 3 0 0 0-1.869-1.87l-.378-.129a1 1 0 0 1 0-1.892l.378-.13a3 3 0 0 0 1.87-1.869l.129-.378A1 1 0 0 1 17 8m0 3.196a5 5 0 0 1-.804.804q.448.355.804.804q.355-.449.804-.804a5 5 0 0 1-.804-.804M3 19a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1m11-1a1 1 0 1 0 0 2h1a1 1 0 1 0 0-2zm-6 1a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1m11-1a1 1 0 1 0 0 2h1a1 1 0 1 0 0-2zM3 12a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1"/></g></svg>'; // Add your custom icon SVG here
  }

  constructor({ api }) {
    this.api = api;
    this.button = null;
  }

  render() {
    this.button = document.createElement('button');
    this.button.innerHTML = RephraseTool.icon;
    this.button.classList.add('ce-inline-tool');
    this.button.type = 'button';

    this.button.addEventListener('click', () => {
      this.rephraseSelectedText();
    });

    return this.button;
  }

  checkState() {
    const selectedText = getSelectedText();
    this.button.disabled = !selectedText.trim().length;
  }

  // eslint-disable-next-line class-methods-use-this
  async rephraseSelectedText() {
    const selectedText = getSelectedText();

    if (selectedText) {
      this.setLoading(true); // Start loading
      const rephrasedText = await RephraseTool.getRephrasedText(selectedText);
      this.setLoading(false); // Stop loading
      replaceSelectedText(rephrasedText);
    }
  }

  setLoading(isLoading) {
    this.loading = isLoading;
    if (this.loading) {
      this.button.innerHTML = ''; // Clear the button content
      const loader = document.createElement('div');
      loader.classList.add('ce-inline-tool-loader');
      loader.innerHTML = '<jt-icon size="10" color="black" />';
      this.button.appendChild(loader);
    } else {
      this.button.innerHTML = RephraseTool.icon; // Restore the icon
    }
  }

  static async getRephrasedText(text) {
    try {
      const response = await fetch(`${process.env.REACT_APP_HOST_API}/api/ai/rephrase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }), // Send the "text" parameter in the body
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json(); // Parse the JSON response

      return data.rephrasedText; // Assuming the response contains a "rephrasedText" field
    } catch (error) {
      console.error('Failed to rephrase text:', error);
      throw error; // Re-throw the error to be handled by the caller
    }
  }
}

export default RephraseTool;
