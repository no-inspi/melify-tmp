import { Editor } from '@tiptap/react';
import { readStreamableValue } from 'ai/rsc';

export async function getTextEditorSelected(editor: Editor, fullText: string) {
  // Get the selected text range
  const { from, to } = editor.state.selection;

  // Check if there is a selection
  const selectedText =
    from !== to
      ? editor.state.doc.textBetween(from, to, ' ') // Get the selected text
      : null;

  // If no text is selected and the editor is empty, skip the operation
  if (!selectedText && !fullText.trim()) {
    console.warn('No selected text or editor content. Skipping operation.');
    return null;
  }

  // Use selected text if available, otherwise use the entire editor content
  const textToRephrase = selectedText || fullText;

  // Clear the selection if text is selected
  if (selectedText) {
    editor.commands.insertContentAt({ from, to }, ''); // Remove selected text
  }

  return { textToRephrase, selectedText, from, to };
}

export async function handleAi(
  selectedText: string | null,
  from: number,
  response: any,
  editor: Editor
) {
  // Track the current position dynamically
  let currentPosition = selectedText ? from : 0;

  let buffer = ''; // Temporary buffer to ensure chunk alignment

  // Stream the response dynamically
  for await (const chunk of readStreamableValue(response.output)) {
    buffer += chunk;

    // Remove unnecessary quotes from the buffer
    const sanitizedBuffer = buffer.replace(/^"|"$/g, '');

    // Insert the sanitized text into the editor
    editor.commands.insertContentAt(
      { from: currentPosition, to: currentPosition },
      sanitizedBuffer
    );

    // Update position based on sanitized buffer length
    currentPosition += sanitizedBuffer.length;

    // Clear buffer after insertion
    buffer = '';
  }
}

export async function continueWriting(editor: Editor, generateContinuation: (text: string) => any) {
  // Get the entire editor content
  const fullText = editor.getText();

  // Ensure the editor is not empty
  if (!fullText.trim()) {
    console.warn('Editor is empty. Skipping "continue writing" operation.');
    return;
  }

  // Determine the position of the last character
  const lastPosition = fullText.length + 1;

  // Call the API to generate the continuation
  const response = await generateContinuation(fullText);

  // Track the current position dynamically for streaming insertion
  let currentPosition = lastPosition;

  let buffer = ''; // Temporary buffer for chunk alignment

  // Stream the response dynamically
  for await (const chunk of readStreamableValue(response.output)) {
    buffer += chunk;

    // Remove unnecessary quotes from the buffer
    const sanitizedBuffer = buffer.replace(/^"|"$/g, '');

    // Insert the sanitized text into the editor
    editor.commands.insertContentAt(
      { from: currentPosition, to: currentPosition },
      sanitizedBuffer
    );

    // Update the current position for the next chunk
    currentPosition += sanitizedBuffer.length;

    // Clear the buffer after insertion
    buffer = '';
  }
}
