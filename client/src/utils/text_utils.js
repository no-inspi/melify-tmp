export function truncateString(str, cut = 50) {
  if (str.length > cut) {
    return `${str.substring(0, cut - 3)}...`;
  }
  return str;
}

export function decodeHtmlEntities(text) {
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
}

export function extractEmail(email) {
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;

  const extractedEmail = email.match(emailRegex);
  return extractedEmail ? extractedEmail[0] : '';
}

export function extractEmails(emailObject) {
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;

  /// Extract emails from the 'from' field
  const fromEmails = emailObject.from?.match(emailRegex) || [];

  // Split 'to' field by comma and extract emails
  const toEmails = emailObject.to
    ? emailObject.to.split(',').flatMap((email) => email.match(emailRegex) || [])
    : [];

  // Split 'cc' field by comma and extract emails, if it exists
  const ccEmails = emailObject.cc
    ? emailObject.cc.split(',').flatMap((email) => email.match(emailRegex) || [])
    : [];

  // Split 'bcc' field by comma and extract emails, if it exists
  const bccEmails = emailObject.bcc
    ? emailObject.bcc.split(',').flatMap((email) => email.match(emailRegex) || [])
    : [];

  // Combine and deduplicate emails for 'from' and 'to'
  const primaryEmails = [...new Set([...fromEmails, ...toEmails])];

  const ccEmailsArray = [...new Set([...ccEmails])];

  const bccEmailsArray = [...new Set([...bccEmails])];

  return {
    primaryEmails,
    ccEmailsArray,
    bccEmailsArray,
  };
}

export function extractResponseEmails(emailObject, user) {
  let toGlobalEmails = [];
  let ccGlobalEmails = [];
  let bccGlobalEmails = [];

  if (!emailObject || !user) {
    return {
      toGlobalEmails,
      ccGlobalEmails,
      bccGlobalEmails,
    };
  }

  for (let i = 0; i < emailObject.length; i += 1) {
    const element = emailObject[i];
    const { primaryEmails, ccEmailsArray, bccEmailsArray } = extractEmails(element);
    toGlobalEmails = [...toGlobalEmails, ...primaryEmails];
    ccGlobalEmails = [...ccGlobalEmails, ...ccEmailsArray];
    bccGlobalEmails = [...bccGlobalEmails, ...bccEmailsArray];
  }

  // Remove duplicates
  toGlobalEmails = [...new Set(toGlobalEmails)];
  ccGlobalEmails = [...new Set(ccGlobalEmails)];
  bccGlobalEmails = [...new Set(bccGlobalEmails)];

  // Remove user.email
  toGlobalEmails = toGlobalEmails.filter((email) => email !== user.email);
  ccGlobalEmails = ccGlobalEmails.filter((email) => email !== user.email);
  bccGlobalEmails = bccGlobalEmails.filter((email) => email !== user.email);

  return {
    toGlobalEmails,
    ccGlobalEmails,
    bccGlobalEmails,
  };
}
