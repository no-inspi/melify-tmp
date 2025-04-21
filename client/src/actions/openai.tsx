'use server';

import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createStreamableValue } from 'ai/rsc';

export async function generateRephrase(selectedText: string, text: string) {
  const instructions = `
    You are an expert email writer tasked with rephrasing the following content for an email draft:

    "${selectedText}"

    Please rewrite the text to ensure it is friendly and professional. 

    Important:
    - Do not include the subject line, greeting, or closing signature—focus only on the body content.
    - Avoid using special characters or unnecessary symbols at the beginning of any sentence.
    - Ensure that the language is clear, professional, and appropriate for a typical email communication.
    - Send the revised text in the same language as the original content.
    `;

  const stream = createStreamableValue('');

  (async () => {
    const { textStream } = streamText({
      model: openai('gpt-4-turbo'),
      prompt: instructions,
    });

    for await (const delta of textStream) {
      stream.update(delta);
    }

    stream.done();
  })();

  return { output: stream.value };
}

export async function generateContinuation(text: string) {
  const instructions = `
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

            The text : 
            "${text}"
      `;

  const stream = createStreamableValue('');

  (async () => {
    const { textStream } = streamText({
      model: openai('gpt-4-turbo'),
      prompt: instructions,
    });

    for await (const delta of textStream) {
      stream.update(delta);
    }

    stream.done();
  })();

  return { output: stream.value };
}

export async function generateRefactor(selectedText: string, text: string, actionType: string) {
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

      //   additionalInstructions = `
      //       - Preserve the existing HTML structure and tags without introducing new elements or altering the original formatting.
      //       - Remove or condense only the text within existing tags to achieve conciseness.
      //       - Return only the updated HTML content without any additional commentary or explanation.
      //     `;
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

      //   additionalInstructions = `
      //         - Preserve the existing HTML structure and tags without introducing or removing HTML elements.
      //         - Add expanded content within the current tags (<p>, <li>, <ul>, <ol>) to maintain structural integrity.
      //         - Return only the updated HTML without any additional commentary or explanation.
      //       `;
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

      //   additionalInstructions = `
      //         - Preserve the existing HTML structure and tags without introducing or removing any HTML elements.
      //         - Return only the corrected HTML content without additional commentary or explanation.
      //       `;
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

    //   additionalInstructions = `
    //         - Preserve the existing HTML structure and tags without modifying them.
    //         - Adjust only the text within existing HTML tags to create a neutral tone.
    //         - Return only the updated HTML without any additional commentary or explanation.
    //       `;
    //   break;

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

      //   additionalInstructions = `
      //         - Preserve the existing HTML structure and tags without adding or removing elements.
      //         - Modify only the text within the existing HTML to convey a friendlier tone.
      //         - Return only the updated HTML without any additional commentary or explanation.
      //       `;
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

      //   additionalInstructions = `
      //         - Maintain the existing HTML structure and tags without adding or removing elements.
      //         - Modify only the text within the current HTML tags to convey a professional tone.
      //         - Return only the updated HTML without any additional commentary or explanation.
      //       `;
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

      //   additionalInstructions = `
      //         - Use the existing HTML structure and tags (<p>, <li>, <ul>, <ol>) to add new sections or paragraphs as needed.
      //         - Ensure that the continuation is seamless, coherent, and logically follows the original content.
      //         - Return only the updated HTML without additional commentary or explanation.
      //       `;
      break;
    default:
      console.warn('Invalid action type.');
  }

  const instructions = `
    ${actionPromptType}

    "${selectedText}"
    `;

  const stream = createStreamableValue('');

  (async () => {
    const { textStream } = streamText({
      model: openai('gpt-4-turbo'),
      prompt: instructions,
    });

    for await (const delta of textStream) {
      stream.update(delta);
    }

    stream.done();
  })();

  return { output: stream.value };
}
