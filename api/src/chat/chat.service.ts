import { Injectable, BadRequestException } from '@nestjs/common';
// Remove this: import OpenAI from 'openai';
import { ChatOpenAI } from '@langchain/openai'; // Ensure this path is correct for your LangChain version
import { PromptTemplate } from '@langchain/core/prompts';
import { JSONLoader } from 'langchain/document_loaders/fs/json';
import { formatDocumentsAsString } from 'langchain/util/document';
import { CharacterTextSplitter } from 'langchain/text_splitter';

const TEMPLATE = `Answer the user's questions based only on the following context. If the answer is not in the context, reply politely that you do not have that information available.:
==============================
Context: {context}
==============================
Current conversation: {chat_history}

user: {question}
assistant:`;

interface StateDocument {
  state: string;
  nickname: string;
  admission_date: string;
  capital_city: string;
  website: string;
}

@Injectable()
export class ChatService {
  private loader: JSONLoader;

  constructor() {
    this.loader = new JSONLoader(
      'src/data/context.json',
      [
        '/state',
        '/code',
        '/nickname',
        '/website',
        '/admission_date',
        '/admission_number',
        '/capital_city',
        '/capital_url',
        '/population',
        '/population_rank',
        '/constitution_url',
        '/twitter_url',
      ], // Adapt the path to match your JSON structure
    );
  }

  // Utility function to format a message
  private formatMessage(message: { role: string; content: string }): string {
    return `${message.role}: ${message.content}`;
  }

  private async getContextFromDocuments(): Promise<string> {
    const docs = await this.loader.load();

    const formattedContext = (docs as unknown as StateDocument[])
      .map((doc) => {
        return `${doc.state}, also known as the ${doc.nickname}, was admitted to the Union on ${doc.admission_date}. Its capital city is ${doc.capital_city}. More information can be found on their website: ${doc.website}.`;
      })
      .join('\n\n');

    return formattedContext;
  }

  async *generateChatResponseStreaming(messages: any): AsyncGenerator<string> {
    if (!messages) {
      throw new BadRequestException('No messages provided');
    }

    // Retrieve context from documents (or database)
    const context = await this.getContextFromDocuments();

    // Augment messages with the retrieved context
    const augmentedMessages = [
      {
        role: 'system',
        content: `Here is the relevant context: ${context}`,
      },
      ...messages,
    ];

    console.log('Augmented messages:', augmentedMessages);

    const model = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      streaming: true,
    });

    const responseStream = await model.stream(augmentedMessages);

    let buffer = ''; // Buffer to accumulate chunks

    // Process each chunk of the stream
    for await (const chunk of responseStream) {
      buffer += chunk.toString(); // Accumulate the chunk into the buffer

      // Split the buffer by new lines (in case multiple chunks are concatenated)
      const lines = buffer.split('\n').filter((line) => line.trim() !== '');

      for (const line of lines) {
        const message = line.replace(/^data: /, '');

        if (message === '[DONE]') {
          return; // If the message is done, exit the function
        }

        try {
          // Attempt to parse the accumulated buffer as JSON
          const json = JSON.parse(message);

          // If successful, clear the buffer and yield the response
          buffer = '';

          if (
            json.choices &&
            json.choices[0].delta &&
            json.choices[0].delta.content
          ) {
            yield json.choices[0].delta.content;
          }
        } catch (err) {
          // If parsing fails, keep accumulating chunks
          console.log('Incomplete JSON chunk, waiting for the next chunk...');
        }
      }
    }
  }
}
