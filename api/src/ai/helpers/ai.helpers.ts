import axios from 'axios';

export async function parseAiResponseCategories(
  response: string,
): Promise<any> {
  const responseSplitted = response.split('[')[1].split(']')[0];
  const responseFormatted = '[' + responseSplitted + ']';

  const categoriesArray = JSON.parse(responseFormatted);
  return categoriesArray;
}

export function hexToRgba(hex: string): [number, number, number] {
  // Remove the hash at the start if it's there
  hex = hex.replace(/^#/, '');

  // Initialize r, g, b values
  let r: number;
  let g: number;
  let b: number;

  if (hex.length === 3) {
    // If 3 characters, expand them to 6
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    // If 6 characters, parse normally
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else {
    throw new Error('Invalid hex color code');
  }

  return [r, g, b];
}

export async function axiosAiRequest(
  aiModel: string,
  instructions: string,
): Promise<any> {
  const response = await axios({
    method: 'post',
    url: 'https://api.openai.com/v1/chat/completions',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    data: {
      model: aiModel,
      messages: [
        {
          role: 'user',
          content: instructions,
        },
      ],
      temperature: 0.7,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0.2,
      presence_penalty: 0,
    },
  });

  return response;
}

export function cleanAiResponse(text: string): string {
  const textCleaned = text.replace(/```html/g, '').replace(/```/g, '');
  return textCleaned;
}
