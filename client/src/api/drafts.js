// utils
import { endpoints, putFetcher, postFetcher, deleteFetcher } from 'src/utils/axios';

export async function createDraft({ draftData }) {
  const URL = draftData && [
    endpoints.drafts.createdraft,
    {
      draftData,
    },
  ];

  let response = '';

  if (URL != null) {
    response = await postFetcher(URL);
    console.log(response);
  } else {
    response = null;
  }

  return response.data;
}

export async function updateDraft({ draftId, draftData }) {
  console.log(draftId, draftData);

  // Construct the URL to include the draftId as a path parameter
  const URL = draftId ? `${endpoints.drafts.draft}/${draftId}` : null;

  let response = '';

  if (URL) {
    // Send the PUT request with the draft data
    response = await putFetcher(URL, draftData); // Ensure that the draftData is passed as the body
    console.log(response);
  } else {
    response = null;
  }

  return response;
}

export async function deleteDraft({ draftId }) {
  console.log(draftId);

  // Construct the URL to include the draftId as a path parameter
  const URL = draftId ? `${endpoints.drafts.draft}/${draftId}` : null;

  let response = '';

  if (URL) {
    // Send the PUT request with the draft data
    response = await deleteFetcher(URL); // Ensure that the draftData is passed as the body
    console.log(response);
  } else {
    response = null;
  }

  return response;
}
