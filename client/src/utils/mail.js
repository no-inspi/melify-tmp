export function extractSingleEmail(email) {
  if (email) {
    console.log(email);
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g; // Add the global flag
    const matches = email.match(emailRegex);
    console.log(matches);
    return matches;
  }
  return [];
}
