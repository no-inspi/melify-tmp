import { streamText } from 'ai';
import { mistral } from '@ai-sdk/mistral';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const model = mistral('ministral-8b-latest');

  const result = streamText({
    model: model,
    messages,
  });

  return result.toDataStreamResponse();
}
