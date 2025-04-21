// utils
import { endpoints, postFetcher, postFetcherCf } from 'src/utils/axios';

// export async function postGenerateCategories({ userDescription }) {
//   const URL = userDescription
//     ? [
//         endpoints.chatgpt.generatecategories,
//         {
//           userDescription,
//         },
//       ]
//     : null;
//   let response = '';

//   if (URL != null) {
//     response = await postFetcher(URL);
//     console.log(response);
//   } else {
//     response = null;
//   }

//   return response;
// }

export async function postRetrievePineconeEmails({ userEmail }) {
  const URL = userEmail
    ? [
        endpoints.cf.onboarding_pinecone,
        {
          // userEmail,
          user_email: userEmail,
        },
      ]
    : null;
  let response = '';

  console.log('URL', URL);

  if (URL != null) {
    response = await postFetcherCf(URL);
    console.log(response);
  } else {
    response = null;
  }

  return response;
}

export async function postGenerateCategories({ userDescription, userEmail, email_usage_type }) {
  const URL =
    userDescription && userEmail
      ? [
          endpoints.cf.onboarding_categories,
          {
            // userDescription,
            user_email: userEmail,
            job_title: userDescription,
            email_usage_type,
          },
        ]
      : null;
  let response = '';

  console.log('URL', URL);

  if (URL != null) {
    response = await postFetcherCf(URL);
    console.log(response);
  } else {
    response = null;
  }

  return response;
}

export async function postGenerateCategoriesForUser({ userEmail, categories, userDescription }) {
  console.log(userEmail, categories, userDescription);
  const URL =
    userEmail && categories
      ? [
          endpoints.users.generatecategories,
          {
            userEmail,
            categories,
            userDescription,
          },
        ]
      : null;
  let response = '';
  console.log('URL', URL);

  if (URL != null) {
    response = await postFetcher(URL);
    console.log(response);
  } else {
    response = null;
  }

  return response;
}
