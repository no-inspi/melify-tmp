import { EmailQuery, Attachment } from '../interface/mail.interface';
import { searchKeys } from 'src/utils/constants';

import { promises as fs } from 'fs'; // Use fs.promises for reading the file
import * as path from 'path'; // For constructing the path to the image
import * as cheerio from 'cheerio'; // For parsing the HTML content

export async function createMessage(
  from: string,
  to: string[],
  subject: string,
  messageText: string,
  threadId: string | null = null,
  email: any = null,
  cc: string[] = [],
  bcc: string[] = [],
  attachments: Attachment[] = [],
  sentfrommelify: boolean = true,
  additionnalContent: string = '',
  paulSignature: boolean = false, // Control whether to include Paul's signature
): Promise<{ raw: string }> {
  if (threadId) {
    subject = subject.startsWith('Re:') ? subject : `Re: ${subject}`;
  }
  subject = `=?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const toAddresses = to.join(', ');
  const ccAddresses = cc.length ? cc.join(', ') : '';
  const bccAddresses = bcc.length ? bcc.join(', ') : '';

  const boundary = '__boundary__';
  const messageBoundary = '__message_boundary__';

  let messageParts: string[];

  const contentType = `multipart/mixed; boundary="${boundary}"`;

  if (!threadId) {
    // New email
    messageParts = [
      `From: ${from}`,
      `To: ${toAddresses}`,
      ccAddresses ? `Cc: ${ccAddresses}` : '',
      bccAddresses ? `Bcc: ${bccAddresses}` : '',
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: ${contentType}`,
    ];
  } else {
    // Replying to an existing thread
    const messageIdHeader = email.payload.headers.find(
      (header) => header.name.toLowerCase() === 'message-id',
    );
    messageParts = [
      `From: ${from}`,
      `To: ${toAddresses}`,
      ccAddresses ? `Cc: ${ccAddresses}` : '',
      bccAddresses ? `Bcc: ${bccAddresses}` : '',
      `Subject: ${subject}`,
      `In-Reply-To: ${messageIdHeader.value}`,
      `References: ${messageIdHeader.value}`,
      'MIME-Version: 1.0',
      `Content-Type: ${contentType}`,
    ];
  }

  const message = messageParts.filter((part) => part);

  if (additionnalContent !== '') {
    messageText = additionnalContent + messageText;
  }

  // Append "sent from Melify" text
  if (sentfrommelify) {
    messageText += `
      <br><br>Sent with <a href="https://melify.fr" target="_blank">Melify</a>
    `;
  }

  // Check if Paul’s signature should be added
  let signatureImagePart = '';
  if (paulSignature) {
    const signatureImagePath = path.join(
      process.cwd(),
      'assets',
      'paul_signature.jpg',
    );
    const signatureImageContent = await fs.readFile(
      signatureImagePath,
      'base64',
    );

    // Add the signature image if the flag is true
    messageText += `<br><img src="cid:signatureImage" alt="Signature Image" style="height:100px;" />`;

    signatureImagePart = `
--${messageBoundary}
Content-Type: image/jpg; name="paul_signature.jpg"
Content-Transfer-Encoding: base64
Content-Disposition: inline; filename="paul_signature.jpg"
Content-ID: <signatureImage>

${signatureImageContent}
`;
  }

  // Add the HTML part of the message
  const htmlPart = `
--${messageBoundary}
Content-Type: text/html; charset="UTF-8"

${messageText}
`;

  // Start constructing the main message body
  let messageBody = `
--${boundary}
Content-Type: multipart/related; boundary="${messageBoundary}"

${htmlPart}
${signatureImagePart}
--${messageBoundary}--
`;

  // Add attachments if any
  if (attachments.length > 0) {
    attachments.forEach((attachment) => {
      const attachmentPart = `
--${boundary}
Content-Type: ${attachment.mimeType}; name="${attachment.filename}"
Content-Transfer-Encoding: base64
Content-Disposition: attachment; filename="${attachment.filename}"

${attachment.content}
`;
      messageBody += attachmentPart;
    });
  }

  // End the message boundary
  messageBody += `
--${boundary}--
`;

  // Join the parts together
  message.push(messageBody);

  const messageFinal = message.join('\n');

  const encodedMessage = Buffer.from(messageFinal)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return { raw: encodedMessage };
}

export async function sendEmail(
  gmail: any,
  emailContent: any,
  threadId: string | null = null,
) {
  try {
    const emailToSend: any = {
      userId: 'me',
      resource: {
        ...emailContent,
      },
    };

    if (threadId) {
      emailToSend.resource.threadId = threadId;
    }

    const sentEmail = await gmail.users.messages.send(emailToSend);
    console.log(`Email sent: ${sentEmail.data.id}`);
    console.log('email sent: ' + sentEmail.data);
    return sentEmail.data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

// Placeholder methods for parseSearchString and getMongooseQueryFromObject
export function parseSearchString(searchString: string): any {
  let query: EmailQuery = {};
  if (searchString) {
    searchKeys.forEach((key) => {
      const index = searchString.indexOf(key);
      if (index !== -1) {
        // Find the start of the value
        const start = index + key.length;

        // Find the end of the value by looking for the next key or end of string
        let end = searchString.length;
        searchKeys.forEach((otherKey) => {
          const otherIndex = searchString.indexOf(otherKey, start);
          if (otherIndex !== -1 && otherIndex < end) {
            end = otherIndex;
          }
        });

        // Extract the value without trimming spaces
        const value = searchString.substring(start, end).trimEnd();

        // Assign the value to the correct key in the query object
        query[key.replace(':', '')] = value;
      }
    });

    // Reorder the query object based on the key positions in the searchString
    const orderedQuery: any = {};

    // Extract the keys and their positions
    const keysWithPositions = Object.keys(query)
      .map((key) => ({ key, position: searchString.indexOf(`${key}:`) }))
      .sort((a, b) => a.position - b.position);

    // Build the ordered query object
    keysWithPositions.forEach(({ key }) => {
      orderedQuery[key] = query[key];
    });

    query = orderedQuery;
  }

  if (Object.keys(query).length === 0) {
    query.text = searchString;
  }

  return query;
}

export async function getMongooseQueryFromObject(
  folder: string,
  user: string,
  objectParsed: EmailQuery,
  searching: boolean | string = false,
): Promise<any> {
  const emailRegex = new RegExp(`.*${user}.*`, 'i'); // 'i' for case-insensitivity
  // const categoryRegex = new RegExp(folder, 'i');
  let query: any = { deliveredTo: { $regex: emailRegex } };
  const queryThread: any = { statusInput: '' };
  query['labelIds'] = { $in: ['INBOX'] };

  if (searching && searching !== 'false') {
    Object.keys(objectParsed).map((key) => {
      switch (key) {
        case 'is':
          if (
            objectParsed[key]?.trim() === 'todo' ||
            objectParsed[key]?.trim() === 'done'
          ) {
            queryThread['statusInput'] = objectParsed[key]?.trim();
          } else {
            query['labelIds'] = {
              $in: [objectParsed[key]?.toUpperCase().trim()],
              $nin: ['TRASH'],
            };
            if (
              objectParsed[key]?.toUpperCase().trim() === 'SENT' ||
              objectParsed[key]?.toUpperCase().trim() === 'DRAFT'
            ) {
              query['from'] = { $regex: emailRegex };
              if (objectParsed[key]?.toUpperCase().trim() === 'DRAFT') {
                query['draftId'] = { $exists: true };
              }
              delete query['deliveredTo'];
            }
          }
          break;
        case 'from':
          const fromRegex = new RegExp(`.*${objectParsed.from.trim()}.*`, 'i'); // 'i' for case-insensitivity
          query['from'] = { $regex: fromRegex };
          break;
        case 'subject':
          const subjectRegex = new RegExp(
            `.*${objectParsed.subject.trim()}.*`,
            'i',
          ); // 'i' for case-insensitivity
          query['subject'] = { $regex: subjectRegex };
          break;
        case 'filename':
          const filenameRegex = new RegExp(
            `.*${objectParsed.filename.trim()}.*`,
            'i',
          ); // 'i' for case-insensitivity
          query['attachments.filename'] = { $regex: filenameRegex };
          break;
        case 'to':
          const toRegex = new RegExp(`.*${objectParsed.to.trim()}.*`, 'i'); // 'i' for case-insensitivity
          delete query['deliveredTo'];
          query['$or'] = [
            { from: { $regex: emailRegex } },
            { deliveredTo: { $regex: emailRegex } },
          ];
          query['to'] = { $regex: toRegex };
          break;
        case 'category':
          const categoryRegex = new RegExp(
            `.*${objectParsed.category.trim()}.*`,
            'i',
          ); // 'i' for case-insensitivity
          query['category'] = { $regex: categoryRegex };
          break;
        case 'text':
          if (objectParsed.text === undefined) {
            query = getQueryFromFolder(folder, user, '');
          } else {
            const textRegex = new RegExp(`.*${objectParsed.text}.*`, 'i'); // 'i' for case-insensitivity
            query['$or'] = [
              { subject: { $regex: textRegex } },
              { text: { $regex: textRegex } },
              { from: { $regex: textRegex } },
              { to: { $regex: textRegex } },
              { summary: { $regex: textRegex } },
            ];
          }

          break;
        default:
          break;
      }
    });
  } else {
    query = await getQueryFromFolder(folder, user, '');
  }
  return { query, queryThread };
}

export async function getQueryFromFolder(
  folder: string,
  user: string,
  searchWords: string,
): Promise<EmailQuery> {
  const baseQuery: EmailQuery = {};

  // Create a regex that matches the email whether or not it's enclosed in characters
  const emailRegex = new RegExp(`.*${user}.*`, 'i'); // 'i' for case-insensitivity

  // Determine folder-based conditions
  switch (folder) {
    case 'all':
      baseQuery['labelIds'] = { $in: ['INBOX'], $nin: ['TRASH'] };
      baseQuery['deliveredTo'] = { $regex: emailRegex };
      break;
    case 'sent':
      if (user) {
        baseQuery['labelIds'] = { $in: ['SENT'], $nin: ['TRASH'] };
        baseQuery['from'] = { $regex: emailRegex };
      }
      break;
    case 'draft':
      if (user) {
        baseQuery['labelIds'] = { $in: ['DRAFT'], $nin: ['TRASH'] };
        baseQuery['draftId'] = { $exists: true };
        baseQuery['from'] = { $regex: emailRegex };
      }
      break;
    case 'trash':
      if (user) {
        baseQuery['labelIds'] = { $in: ['TRASH'] };
        baseQuery['deliveredTo'] = { $regex: emailRegex };
      }
      break;
    case 'spam':
      if (user) {
        baseQuery['labelIds'] = { $in: ['SPAM'] };
        baseQuery['deliveredTo'] = { $regex: emailRegex };
      }
      break;
    case 'todo':
    case 'done':
      if (user) {
        baseQuery['labelIds'] = { $in: ['INBOX'] };
        baseQuery['deliveredTo'] = { $regex: emailRegex };
      }
      break;
    default:
      baseQuery['labelIds'] = { $in: ['INBOX'] };
      baseQuery['deliveredTo'] = { $regex: emailRegex };
      const categoryRegex = new RegExp(folder, 'i');
      baseQuery['category'] = { $regex: categoryRegex };
      break;
  }

  // Add searchWords condition if provided
  if (searchWords && searchWords !== '') {
    const searchRegex = new RegExp(searchWords, 'i'); // 'i' for case-insensitive
    baseQuery['$or'] = [
      { subject: { $regex: searchRegex } },
      { text: { $regex: searchRegex } },
      { from: { $regex: searchRegex } },
    ];
  }
  if (folder !== 'trash') {
    baseQuery['labelIds']['$nin'] = ['TRASH'];
  }
  return baseQuery;
}

export function extractEmails(emails: string[]): string[] {
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
  return emails
    .map((email) => {
      const match = email.match(emailRegex);
      return match ? match[0] : '';
    })
    .filter((email) => email);
}

export function extractSingleEmail(email: string): string[] {
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
  const matches = email.match(emailRegex);
  return matches ? matches : [];
}

export function extractEmailToString(str: string): string {
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
  const match = str.match(emailRegex);
  return match ? match[0].toLowerCase() : '';
}

export function getLastNonMatchingFromEmail(
  emails: any[],
  fromEmail: string,
): string {
  console.log('test: ', emails, fromEmail);
  // Filter out emails that are from 'fromEmail'
  const filteredEmails = emails.filter((email) => {
    const emailAddress = extractEmailToString(email.from);
    return emailAddress !== fromEmail;
  });

  console.log('filtered email', filteredEmails);

  // Get the last email from the filtered list
  if (filteredEmails.length > 0) {
    return extractEmailToString(filteredEmails[filteredEmails.length - 1].from);
  }

  return null; // Return null if no matching email is found
}

/**
 * Extracts new content by removing blockquote elements and their previous siblings.
 * @param html - The input HTML string.
 * @returns The cleaned HTML string.
 */
export function extractNewContent(html: string): string {
  const $ = cheerio.load(html);

  // Select all blockquote elements
  const blockquotes = $('blockquote');

  // Iterate over each blockquote to remove it and its previous sibling
  blockquotes.each((_, blockquote) => {
    // Get the previous sibling of blockquote
    const prevSibling = $(blockquote).prev();

    // Remove the previous sibling and the blockquote element
    prevSibling.remove();
    $(blockquote).remove();
  });

  // Return the remaining HTML content
  return $.html();
}
