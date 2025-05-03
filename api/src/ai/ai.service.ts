import { Injectable, BadRequestException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import * as sanitizeHtml from 'sanitize-html';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const randomColor = require('randomcolor');

import { Email } from '../mails/schemas/emails.schema'; // Adjust the path as necessary
import {
  parseAiResponseCategories,
  hexToRgba,
  axiosAiRequest,
  cleanAiResponse,
} from './helpers/ai.helpers';

@Injectable()
export class AiService {
  constructor(@InjectModel(Email.name) private emailModel: Model<Email>) {}

  async generateEmailResponse(mailId: string): Promise<any> {
    console.log(mailId);

    const maildetail = await this.emailModel.findById(mailId);
    if (!maildetail) {
      throw new BadRequestException('Email not found');
    }

    const prompt = maildetail.text;
    const instructions = `Generate an email response in HTML format. The original email content is provided between the '&&' characters. Please provide the HTML response code between '<div>' and '</div>' characters.

    &&
    ${prompt}
    &&
    
    <div> HTML response starts here </div>`;

    if (!prompt || !instructions) {
      throw new BadRequestException('No prompt provided');
    }

    if (!mailId) {
      throw new BadRequestException('No mailId provided');
    }

    console.log(maildetail.chatgptprop);

    if (maildetail.chatgptprop === '' || maildetail.chatgptprop === undefined) {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          // model: "gpt-4-1106-preview",
          model: 'gpt-3.5-turbo-1106',
          messages: [
            {
              role: 'user',
              content: instructions,
            },
          ],
          temperature: 1,
          max_tokens: 256,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log(response.data);

      maildetail.chatgptprop = sanitizeHtml(
        response.data.choices[0].message.content,
        {
          allowedTags: ['p', 'strong', 'b', 'div', 'br', 'ul', 'li', 'a'],
          allowedAttributes: {
            a: ['href'], // Allow href attribute for 'a' tag
          },
        },
      );

      // Save the updated email
      await maildetail.save();
    }

    return maildetail;
  }

  async generateCategories(userDescription: string): Promise<any> {
    const prompt = userDescription;
    const instructions = `
    Given the following job description, extract and generate a list of high-level categories that correspond to the user's primary tasks and responsibilities. These categories will be used to organize and categorize incoming emails. The categories should reflect the key areas of focus in the user's role, such as project management, client communication, financial analysis, etc.
    User's Job Description:
    ${prompt}
    Instructions:
    - Identify the core responsibilities and tasks mentioned in the job description.
    - Generate a list of 5-10 categories that accurately represent the user's key areas of work.
    - The categories should be broad enough to encompass related tasks but specific enough to be useful for email categorization.
    - Provide the output as an array of strings, with each string representing a category.
    Output Format:
    [
      "Category 1",
      "Category 2",
      "Category 3",
      "Category 4",
      "Category 5"
    ]
    Example Response:
    [
      "Project Management",
      "Client Relations",
      "Financial Analysis",
      "Internal Communication",
      "Product Development"
    ]
    `;
    if (!prompt || !instructions) {
      throw new BadRequestException('No prompt provided');
    }
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        // model: "gpt-4-1106-preview",
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: instructions,
          },
        ],
        temperature: 1,
        max_tokens: 256,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const jsonResponse = response.data.choices[0].message.content;

    let responseAiCategories = await parseAiResponseCategories(jsonResponse);

    responseAiCategories = responseAiCategories.map((category) => {
      const randomColorGenerated = randomColor({
        alpha: 1,
        luminosity: 'random',
      });
      const randomHexColor = hexToRgba(randomColorGenerated);

      return {
        category, // The string itself
        color: {
          r: randomHexColor[0],
          g: randomHexColor[1],
          b: randomHexColor[2],
          a: 1,
        }, // Generate a random color for each category
        hexColor: randomColorGenerated,
      };
    });

    return responseAiCategories;
  }

  async *generateEmailStreaming(prompt: string): AsyncGenerator<string> {
    const instructions = `
    You are an expert email writer. Please write the body of an email based on the following details:
    ${prompt}
    The email should be friendly, concise, and organized into multiple paragraphs. Each paragraph should address a different aspect of the message, ensuring a clear and logical flow.
    Return the content as valid HTML, using <p> for paragraphs and <ul><li> for any lists.
    Do not include the subject line, greeting, or closing signature—just the main content of the email.
  `;

    if (!prompt || !instructions) {
      throw new BadRequestException('No prompt provided');
    }

    const response = await axios({
      method: 'post',
      url: 'https://api.openai.com/v1/chat/completions',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        model: 'gpt-4o-mini',
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
        stream: true, // Enable streaming
      },
      responseType: 'stream',
    });

    const stream = response.data;

    let buffer = ''; // Buffer to store incomplete JSON chunks

    // Listen for data events from the stream and yield the chunks as they come in
    for await (const chunk of stream) {
      const lines = chunk
        .toString()
        .split('\n')
        .filter((line) => line.trim() !== '');

      for (const line of lines) {
        const message = line.replace(/^data: /, '');

        if (message === '[DONE]') return;

        // Accumulate the message in the buffer
        buffer += message;

        try {
          // Try to parse the accumulated buffer as JSON
          const json = JSON.parse(buffer);

          // If successful, reset the buffer
          buffer = '';

          // Check if the JSON contains content to yield
          if (
            json.choices &&
            json.choices[0].delta &&
            json.choices[0].delta.content
          ) {
            yield json.choices[0].delta.content;
          }
        } catch (err) {
          // If parsing fails, it means the JSON is incomplete, so continue accumulating
          console.log('Incomplete JSON chunk, waiting for the next chunk...');
        }
      }
    }
  }

  async generateEmail(prompt: string): Promise<string> {
    const instructions = `
    ROLE:
    You are an expert email copywriter.

    CONTEXT:
    You are assisting a user in writing a professional, concise email. The user provides you with a prompt that includes all necessary information to address their needs. Your task is to craft an email body that aligns with this prompt.

    ACTION:
    Based on the prompt provided below, write an email that is clear, organized, and segmented logically across multiple paragraphs. Each paragraph should address a different aspect of the message, maintaining a smooth flow for the reader.

    GUIDELINES:
    Tone: Use a polite and professional tone by default, adjusting only if specified in the prompt.
    Clarity: Make the content easy for the recipient to understand and follow.
    Conciseness: Focus on quality over length; include only what is essential for effective communication.
    Language: Write in the language of the prompt unless instructed otherwise.
    Accuracy: Ensure correct spelling, grammar, and syntax throughout.
    Link Preservation: If links are mentioned in the prompt, include them as highlighted and clickable within the final HTML structure.

    Formatting:
    - Return the content as valid HTML.
    - Use <p> tags for paragraphs and <ul><li> for lists if needed.
    - Do not include a subject line, greeting, or closing signature—only the email body content.

    Prompt:
    ${prompt}
  `;

    if (!prompt || !instructions) {
      throw new BadRequestException('No prompt provided');
    }

    const response = await axiosAiRequest('gpt-4o-mini', instructions);

    const generatedText = cleanAiResponse(
      response.data.choices[0].message.content.trim(),
    );

    return generatedText;
  }

  async RephraseEmail(text: string): Promise<any> {
    const instructions = `
    You are an expert email writer tasked with rephrasing the following content for an email draft:

    "${text}"

    Please rewrite the text to ensure it is friendly, concise, and well-structured. 

    Important:
    - Do not include the subject line, greeting, or closing signature—focus only on the body content.
    - Avoid using special characters or unnecessary symbols at the beginning of any sentence.
    - Ensure that the language is clear, professional, and appropriate for a typical email communication.
    `;

    if (!text) {
      throw new BadRequestException('No prompt provided');
    }

    const response = await axiosAiRequest('gpt-4o-mini', instructions);

    const rephrasedText = cleanAiResponse(
      response.data.choices[0].message.content.trim(),
    );

    return { rephrasedText };
  }

  async aiRefactorEmail(htmlText: string, actionType: string): Promise<any> {
    let actionPromptType = '';
    let additionalInstructions = '';

    switch (actionType) {
      case 'shorter':
        actionPromptType = `
        ROLE:
        You are an expert email copywriter skilled in editing for conciseness.

        CONTEXT:
        You are assisting a user within an email client by shortening an email they have written. Your goal is to reduce the email's length while preserving the full meaning and intent of the original message.

        ACTION:
        Edit the email content to make it more concise and direct, ensuring clarity and readability.

        GUIDELINES:
        Preserve Meaning: Shorten the email without omitting essential details or altering the intended message.
        Balance Brevity with Clarity: Ensure the email remains fully understandable while being direct and to the point.
        Tone: Maintain a polite, professional tone unless otherwise specified. Match the tone indicated in the user’s original content.
        Language: Use the language in which the email was written.
        Accuracy: Ensure impeccable spelling, grammar, and syntax.
        Link Preservation: Retain any links in the email, ensuring they remain clickable and interactive in the final HTML.
      `;

        additionalInstructions = `
          - Preserve the existing HTML structure and tags without introducing new elements or altering the original formatting.
          - Remove or condense only the text within existing tags to achieve conciseness.
          - Return only the updated HTML content without any additional commentary or explanation.
        `;
        break;

      case 'expand':
        actionPromptType = `
            ROLE:
            You are an expert email copywriter skilled in expanding content without compromising clarity or meaning.
        
            CONTEXT:
            You are assisting a user within the Melify platform by expanding an email they have written. The goal is to make the email longer, focusing on adding meaningful and relevant content that aligns with the user’s original intent.
        
            ACTION:
            Expand the email by rephrasing it in a fuller, more detailed form. Keep the message clear, accurate, and true to the user’s initial purpose. Assume all necessary information is provided—do not add any invented details or assumptions.
        
            GUIDELINES:
            Rephrase Thoughtfully: Use longer, more elaborate phrasing to expand the content without altering its original meaning.
            Avoid Unfounded Information: Do not introduce new information or assumptions. Only expand upon the details provided.
            Complete the Email: Ensure the email feels comprehensive and complete, without implying any missing or additional information from the user.
            Tone: Maintain the specified tone—professional, friendly, or neutral—as indicated by the user.
            Clarity: Keep the expanded message clear and easy to follow.
            Language: Use the original language of the email.
            Accuracy: Make adjustments with impeccable spelling, grammar, and syntax.
            Link Preservation: Ensure any links in the original email remain clickable and interactive in the final HTML version.
          `;

        additionalInstructions = `
            - Preserve the existing HTML structure and tags without introducing or removing HTML elements.
            - Add expanded content within the current tags (<p>, <li>, <ul>, <ol>) to maintain structural integrity.
            - Return only the updated HTML without any additional commentary or explanation.
          `;
        break;

      case 'proofread':
        actionPromptType = `
            ROLE:
            You are a language expert and proofreader.
        
            CONTEXT:
            You are assisting a user within an email client by proofreading an email they have written. Your task is to correct all spelling, grammar, and punctuation errors, ensuring the email is polished, clear, and error-free.
        
            ACTION:
            Review the email content below, making only the necessary corrections to improve spelling, grammar, and punctuation. Retain the original meaning, tone, and structure as much as possible.
        
            GUIDELINES:
            Multi-Language Support: Be capable of proofreading in the language in which the email is written.
            Focus on Accuracy: Make only essential corrections to ensure flawless language use without altering the intended message or style.
            Link Preservation: If links are included, ensure they remain highlighted and clickable in the final version.
          `;

        additionalInstructions = `
            - Preserve the existing HTML structure and tags without introducing or removing any HTML elements.
            - Return only the corrected HTML content without additional commentary or explanation.
          `;
        break;

      case 'neutral':
        actionPromptType = `
            ROLE:
            You are an expert email copywriter skilled in tone adjustment.
        
            CONTEXT:
            You are assisting a user within an email client by adjusting the tone of an email to be more neutral. The user wants the email to be objective, straightforward, and free from overt friendliness or formality.
        
            ACTION:
            Refine the email to create a neutral, direct tone. Maintain the original message, intent, and clarity, ensuring it is clear and easily understandable without emotional or formal undertones.
        
            GUIDELINES:
            Preserve Meaning and Clarity: Modify the tone while keeping the original content and intent intact.
            Neutral Tone: Use straightforward, objective language. Avoid language that could be perceived as overly friendly or formal.
            Language: Match the original language of the email.
            Accuracy: Ensure impeccable spelling, grammar, and syntax.
            Link Preservation: Retain links as highlighted and clickable in the final HTML.
          `;

        additionalInstructions = `
            - Preserve the existing HTML structure and tags without modifying them.
            - Adjust only the text within existing HTML tags to create a neutral tone.
            - Return only the updated HTML without any additional commentary or explanation.
          `;
        break;

      case 'friendly':
        actionPromptType = `
            ROLE:
            You are an expert email copywriter skilled in tone adjustment.
        
            CONTEXT:
            You are assisting a user within an email client by adjusting the tone of an email to make it more friendly. The user wants the email to be warm, approachable, and conversational.
        
            ACTION:
            Refine the email to create a friendly, welcoming tone. Maintain the original message, intent, and clarity, ensuring the email feels engaging and positive.
        
            GUIDELINES:
            Preserve Meaning and Clarity: Adjust the tone without altering the message's meaning or intent.
            Friendly Tone: Use warm, approachable language. Make the email feel inviting and conversational without being too casual or informal.
            Language: Match the original language of the email.
            Accuracy: Make adjustments with impeccable spelling, grammar, and syntax.
            Link Preservation: Keep all links highlighted and clickable in the final version.
          `;

        additionalInstructions = `
            - Preserve the existing HTML structure and tags without adding or removing elements.
            - Modify only the text within the existing HTML to convey a friendlier tone.
            - Return only the updated HTML without any additional commentary or explanation.
          `;
        break;

      case 'professional':
        actionPromptType = `
            ROLE:
            You are an expert email copywriter skilled in tone adjustment.
        
            CONTEXT:
            You are assisting a user within an email client by refining the tone of an email to be more professional. The user wants the email to convey respect, formality, and a polished style.
        
            ACTION:
            Refine the email to create a professional, formal tone. Ensure the email is polite and respectful, aligning with a professional communication style, while preserving the original message and intent.
        
            GUIDELINES:
            Preserve Meaning and Clarity: Adjust only the tone, leaving the original message and content intact.
            Professional Tone: Use formal, respectful language. Ensure the email is polished, avoiding overly casual expressions.
            Language: Use the original language of the email.
            Accuracy: Make adjustments with impeccable spelling, grammar, and syntax.
            Link Preservation: Keep links highlighted and interactive in the final HTML.
          `;

        additionalInstructions = `
            - Maintain the existing HTML structure and tags without adding or removing elements.
            - Modify only the text within the current HTML tags to convey a professional tone.
            - Return only the updated HTML without any additional commentary or explanation.
          `;
        break;

      case 'continuewriting':
        actionPromptType = `
            ROLE:
            You are an expert email copywriter.
        
            CONTEXT:
            You are assisting a user in completing an email they have started within an email client. The user paused before finishing, and your task is to seamlessly continue the email from where they left off, maintaining coherence and alignment with their tone and message.
        
            ACTION:
            Continue writing the email from the stopping point, creating a smooth and logical completion that reflects the user’s intended tone and purpose.
        
            GUIDELINES:
            Tone: Default to a polite, professional tone unless specified otherwise. Match the tone used in the user’s initial content.
            Clarity: Ensure the message is straightforward and easy for the recipient to follow.
            Language: Use the language of the initial content unless otherwise directed.
            Accuracy: Write with impeccable spelling, grammar, and syntax.
            Link Preservation: Retain any links included by the user, ensuring they remain highlighted and clickable in the final HTML.
        
            Add Little but Good: Only add relevant, necessary content that supports the user’s initial message without excessive detail.
            Completion Check: If the email appears complete—indicated by a signature, closing phrase, or clear ending—do not add any additional content, even if “Continue Writing” is selected.
          `;

        additionalInstructions = `
            - Use the existing HTML structure and tags (<p>, <li>, <ul>, <ol>) to add new sections or paragraphs as needed.
            - Ensure that the continuation is seamless, coherent, and logically follows the original content.
            - Return only the updated HTML without additional commentary or explanation.
          `;
        break;
      default:
        throw new BadRequestException('Invalid action type');
    }

    const instructions = `
    ${actionPromptType}

    "${htmlText}"

    Important:
    ${additionalInstructions}
    - Ensure that the output is formatted strictly in HTML without any additional commentary or explanation.
    - Use only the existing tags (<p>, <li>, <ul>, <ol>), and do not introduce new HTML elements unless explicitly required by the action type.
    `;

    if (!htmlText) {
      throw new BadRequestException('No prompt provided');
    }

    const response = await axiosAiRequest('gpt-4o-mini', instructions);

    const refactorText = cleanAiResponse(
      response.data.choices[0].message.content.trim(),
    );

    return { refactorText };
  }

  async addMoreContext(htmlText: string, prompt: string): Promise<any> {
    const instructions = `
    ROLE:
    You are an expert in content editing and email writing.

    CONTEXT:
    You are assisting a user by updating the content of an existing email. The user provides you with additional details in a prompt, which you should seamlessly incorporate into the original HTML content to enhance the email's clarity and relevance.

    ACTION:
    Update the existing HTML content by adding the new information provided in the prompt. Retain the existing structure and integrate the new details only where they enhance or clarify the original content.

    GUIDELINES:
    Tone: Maintain a polite and professional tone consistent with the original content.
    Clarity: Ensure the email remains coherent and easy to follow, integrating new information logically.
    Conciseness: Add only what's necessary from the prompt to improve clarity without extending the length unnecessarily.
    Language: Match the language used in the original content unless otherwise specified.
    Accuracy: Use impeccable spelling, grammar, and syntax.

    Formatting Requirements:
    - Integrate the new content without disrupting the existing HTML structure.
    - Use only <p>, <li>, <ul>, and <ol> tags as needed.
    - If links are present, ensure they remain clickable and interactive.
    - Do not introduce new HTML tags unless necessary.

    Existing HTML Content:
    "${htmlText}"

    Prompt with Additional Context:
    "${prompt}"

    Output only the updated HTML content, with no extra commentary or explanation.
  `;

    if (!htmlText) {
      throw new BadRequestException('No prompt provided');
    }

    const response = await axiosAiRequest('gpt-4o-mini', instructions);

    const refactorText = cleanAiResponse(
      response.data.choices[0].message.content.trim(),
    );

    return { refactorText };
  }
}
