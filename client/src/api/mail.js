import useSWR from 'swr';
import keyBy from 'lodash/keyBy';
import { useMemo, useEffect } from 'react';

// utils
import {
  fetcher,
  sendMail,
  addDraft,
  endpoints,
  deleteMail,
  updateMail,
  putFetcher,
  archiveMail,
  updateDraft,
  deleteDraft,
  postFetcher,
  getAttachment,
  deleteFetcher,
  sendMailAnswer,
  updateMailRead,
  putFetcherWthUrl,
  sendAnswerChatGpt,
  sendResumeChatGpt,
} from 'src/utils/axios';

import { useSocket } from 'src/auth/socket/SocketProvider'; // Assuming you have a SocketProvider

// ----------------------------------------------------------------------

export function useGetLabels(user) {
  const URL = user ? [endpoints.mail.labels, { params: { email: user.email } }] : null;

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      labels: data?.labels || [],
      labelsLoading: isLoading,
      labelsError: error,
      labelsValidating: isValidating,
      labelsEmpty: !isLoading && !data?.labels.length,
    }),
    [data?.labels, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export function useGetMails(labelId, user, selectedSearch) {
  const URL =
    labelId && user
      ? [
          endpoints.mail.threads,
          {
            params: {
              labelId,
              email: user.email,
              searchWords: selectedSearch,
              searching: selectedSearch !== '',
            },
          },
        ]
      : null;

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);
  const socket = useSocket(); // Get socket instance from context

  const memoizedValue = useMemo(() => {
    const byId = keyBy(data, '_id') || {};
    const allIds = Object.keys(byId) || [];
    return {
      mails: {
        byId,
        allIds,
      },
      mailsLoading: isLoading,
      mailsError: error,
      mailsValidating: isValidating,
      mailsEmpty: !isLoading && !allIds.length,
    };
  }, [data, error, isLoading, isValidating]);

  // UseEffect to listen for socket updates
  useEffect(() => {
    if (socket) {
      // Listen for 'mail_update' event from the backend
      socket.on('mail_update', (updatedMail) => {
        // Use mutate to update the cache
        mutate((currentData) => {
          if (!currentData) return currentData; // Return currentData if it doesn't exist
          // Update the mail whose _id matches the updatedMail._id
          const updatedMails = currentData.map((mail) => {
            if (mail._id === updatedMail._id) {
              // Create a copy of the emails array
              const updatedEmails = [...mail.emails];

              // Update the last email in the list (if it exists)
              const lastEmailIndex = updatedEmails.length - 1;
              if (lastEmailIndex >= 0) {
                updatedEmails[lastEmailIndex] = {
                  ...updatedEmails[lastEmailIndex], // Keep existing email data
                  ...updatedMail, // Merge updated fields
                };
              }

              return {
                ...mail,
                emails: updatedEmails, // Replace the emails array with the updated one
              };
            }

            return mail; // Return unchanged mail objects
          });

          return updatedMails; // Return updated mail list
        }, false); // false means don't re-fetch, just update the cache
      });

      socket.on('thread_update', (updatedMail) => {
        // Use mutate to update the cache
        mutate((currentData) => {
          if (!currentData) return currentData; // Return currentData if it doesn't exist

          // Update the mail whose _id matches the updatedMail._id
          const updatedMails = currentData.map((mail) => {
            if (mail._id === updatedMail._id) {
              // Directly update the root fields of the mail (thread)
              return {
                ...mail, // Keep existing thread data
                ...updatedMail, // Merge updated root fields from updatedMail
              };
            }

            return mail; // Return unchanged mail objects
          });

          return updatedMails; // Return updated mail list
        }, false); // false means don't re-fetch, just update the cache
      });

      socket.on('mail_delete_thread', (deletedMail) => {
        // Use mutate to update the cache
        mutate((currentData) => {
          if (!currentData) return currentData; // Return currentData if it doesn't exist

          // Filter out the mail whose _id matches the deletedMail._id
          const updatedMails = currentData.filter((mail) => mail._id !== deletedMail._id);

          return updatedMails; // Return updated mail list without the deleted mail
        }, false); // false means don't re-fetch, just update the cache
      });

      socket.on('mail_add_thread', (newThreadData) => {
        mutate((currentData) => {
          if (!currentData) return [newThreadData]; // Initialize with newThreadData if currentData is empty

          // Check if the thread with the same _id already exists
          const threadExists = currentData.some((thread) => thread._id === newThreadData._id);

          if (threadExists) {
            // If it exists, add the email to the existing thread
            return currentData.map((thread) =>
              thread._id === newThreadData._id
                ? { ...thread, emails: [...thread.emails, ...newThreadData.emails] }
                : thread
            );
          }

          // If thread does not exist, add newThreadData to the list and then sort by lastInboxEmailDate
          const updatedData = [...currentData, newThreadData];
          // Sort by lastInboxEmailDate in descending order
          updatedData.sort(
            (a, b) => new Date(b.lastInboxEmailDate) - new Date(a.lastInboxEmailDate)
          );

          return updatedData;
        }, false);
      });

      // Cleanup listener on unmount
      return () => {
        socket.off('mail_update');
        socket.off('thread_update');
        socket.off('mail_delete_thread');
        socket.off('mail_add_thread');
      };
    }
    return undefined;
  }, [socket, mutate]);

  return {
    ...memoizedValue,
    mutate,
  };
}

export function useGetMailsImportant(labelId, user, selectedSearch) {
  const URL =
    labelId && user
      ? [
          endpoints.mail.importantthreads,
          {
            params: {
              labelId,
              email: user.email,
              searchWords: selectedSearch,
              searching: selectedSearch !== '',
            },
          },
        ]
      : null;

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);
  const socket = useSocket(); // Get socket instance from context

  const memoizedValue = useMemo(() => {
    const byId = keyBy(data, '_id') || {};
    const allIds = Object.keys(byId) || [];
    return {
      mailsImportant: {
        byId,
        allIds,
      },
      mailsLoadingImportant: isLoading,
      mailsErrorImportant: error,
      mailsValidatingImportant: isValidating,
      mailsEmptyImportant: !isLoading && !allIds.length,
    };
  }, [data, error, isLoading, isValidating]);

  // UseEffect to listen for socket updates
  useEffect(() => {
    if (socket) {
      // Listen for 'mail_update' event from the backend
      socket.on('mail_update_important', (updatedMail) => {
        // Use mutate to update the cache
        mutate((currentData) => {
          if (!currentData) return currentData; // Return currentData if it doesn't exist
          // Update the mail whose _id matches the updatedMail._id
          const updatedMails = currentData.map((mail) => {
            if (mail._id === updatedMail._id) {
              // Create a copy of the emails array
              const updatedEmails = [...mail.emails];

              // Update the last email in the list (if it exists)
              const lastEmailIndex = updatedEmails.length - 1;
              if (lastEmailIndex >= 0) {
                updatedEmails[lastEmailIndex] = {
                  ...updatedEmails[lastEmailIndex], // Keep existing email data
                  ...updatedMail, // Merge updated fields
                };
              }

              return {
                ...mail,
                emails: updatedEmails, // Replace the emails array with the updated one
              };
            }

            return mail; // Return unchanged mail objects
          });

          return updatedMails; // Return updated mail list
        }, false); // false means don't re-fetch, just update the cache
      });

      socket.on('thread_update_important', (updatedMail) => {
        // Use mutate to update the cache
        mutate((currentData) => {
          if (!currentData) return currentData; // Return currentData if it doesn't exist

          // Update the mail whose _id matches the updatedMail._id
          const updatedMails = currentData.map((mail) => {
            if (mail._id === updatedMail._id) {
              // Directly update the root fields of the mail (thread)
              return {
                ...mail, // Keep existing thread data
                ...updatedMail, // Merge updated root fields from updatedMail
              };
            }

            return mail; // Return unchanged mail objects
          });

          return updatedMails; // Return updated mail list
        }, false); // false means don't re-fetch, just update the cache
      });

      socket.on('mail_delete_thread_important', (deletedMail) => {
        // Use mutate to update the cache
        mutate((currentData) => {
          if (!currentData) return currentData; // Return currentData if it doesn't exist

          // Filter out the mail whose _id matches the deletedMail._id
          const updatedMails = currentData.filter((mail) => mail._id !== deletedMail._id);

          return updatedMails; // Return updated mail list without the deleted mail
        }, false); // false means don't re-fetch, just update the cache
      });

      socket.on('mail_add_thread_important', (newThreadData) => {
        mutate((currentData) => {
          if (!currentData) return [newThreadData]; // Initialize with newThreadData if currentData is empty

          // Check if the thread with the same _id already exists
          const threadExists = currentData.some((thread) => thread._id === newThreadData._id);

          if (threadExists) {
            // If it exists, add the email to the existing thread
            return currentData.map((thread) =>
              thread._id === newThreadData._id
                ? { ...thread, emails: [...thread.emails, ...newThreadData.emails] }
                : thread
            );
          }

          // If thread does not exist, add newThreadData to the list and then sort by lastInboxEmailDate
          const updatedData = [...currentData, newThreadData];
          // Sort by lastInboxEmailDate in descending order
          updatedData.sort(
            (a, b) => new Date(b.lastInboxEmailDate) - new Date(a.lastInboxEmailDate)
          );

          return updatedData;
        }, false);
      });

      // Cleanup listener on unmount
      return () => {
        socket.off('mail_update_important');
        socket.off('thread_update_important');
        socket.off('mail_delete_thread_important');
        socket.off('mail_add_thread_important');
      };
    }
    return undefined;
  }, [socket, mutate]);

  return {
    ...memoizedValue,
    mutate,
  };
}

// ----------------------------------------------------------------------

export function useGetMail(mailId) {
  const URL = mailId ? [endpoints.mail.details, { params: { threadId: mailId } }] : null;

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const socket = useSocket(); // Get socket instance from context

  const memoizedValue = useMemo(
    () => ({
      mail: data?.emails,
      mailLoading: isLoading,
      mailError: error,
      mailValidating: isValidating,
    }),
    [data?.emails, error, isLoading, isValidating]
  );

  useEffect(() => {
    if (socket) {
      // Listen for 'mail_update' event from the backend
      socket.on('mail_detail_update', (updatedMail) => {
        // Use mutate to update the cache
        mutate((currentData) => {
          if (!currentData) return currentData; // Return currentData if it doesn't exist

          // Update the mail whose _id matches the updatedMail._id
          const updatedMails = currentData.emails.map((mail) => {
            if (mail.messageId === updatedMail._id) {
              return {
                ...mail, // Keep other fields unchanged
                labelIds: updatedMail.labelIds, // Update the labelIds field
              };
            }

            return mail; // Return unchanged mail objects
          });

          // Return the updated structure including the updated emails
          return {
            ...currentData,
            emails: updatedMails, // Update emails with modified mail
          };
        }, false); // false means don't re-fetch, just update the cache
      });

      // Cleanup listener on unmount
      return () => {
        socket.off('mail_detail_update');
      };
    }
    return undefined;
  }, [socket, mutate]);

  return {
    ...memoizedValue,
    mutate,
  };
}

export function postSendMail({ message, subject, to, user, cc, bcc, attachments, draftId }) {
  const URL =
    message && subject && to && user.email && cc && bcc && attachments && draftId
      ? [endpoints.mail.addmail, { message, subject, to, user, cc, bcc, attachments, draftId }]
      : null;
  let status = '';
  // useSWR(URL, sendMail);
  if (URL != null) {
    status = sendMail(URL);
  } else {
    status = null;
  }

  return status;
}

export function postAddDraft({ message, to, user, mailId }) {
  const URL =
    message && to && user.email && mailId
      ? [endpoints.mail.adddraft, { message, to: 'paul@gmail.com', user, mailId }]
      : null;
  let status = '';

  if (URL != null) {
    console.log('URL', URL);
    status = addDraft(URL);
  } else {
    status = null;
  }

  return status;
}

export async function postSendMailAnswer({
  to,
  cc,
  bcc,
  message,
  _id,
  user,
  threadId,
  email,
  attachments,
}) {
  const URL =
    message && _id && threadId && email && to && cc && bcc && attachments
      ? [
          endpoints.mail.addanswer,
          { message, _id, user, threadId, email, to, cc, bcc, attachments },
        ]
      : null;
  let status = '';
  // useSWR(URL, sendMail);
  if (URL != null) {
    console.log('URL', URL);
    status = await sendMailAnswer(URL);
  } else {
    status = null;
  }

  return status;
}

export function postDeleteMail({ id }) {
  const URL = id ? [endpoints.mail.deletemail, { id }] : null;
  let status = '';
  // useSWR(URL, sendMail);
  if (URL != null) {
    console.log('URL', URL);
    status = deleteMail(URL);
  } else {
    status = null;
  }

  return status;
}

export function postDeleteDraft({ _id }) {
  console.log('enter');
  const URL = _id ? [endpoints.mail.deletedraft, { _id }] : null;
  let status = '';
  // useSWR(URL, sendMail);
  if (URL != null) {
    console.log('URL', URL);
    status = deleteDraft(URL);
  } else {
    status = null;
  }

  return status;
}

export function postUpdateMail({ id, resume, chatgptprop, message, email }) {
  // console.log(message, subject, to)
  // console.log(user)
  const URL =
    id && resume && chatgptprop && message && email
      ? [endpoints.mail.updatemail, { id, resume, chatgptprop, message, email }]
      : null;
  let status = '';
  // useSWR(URL, sendMail);
  if (URL != null) {
    console.log('URL', URL);
    status = updateMail(URL);
  } else {
    status = null;
  }

  return status;
}

export function putUpdateDraft({ _id, message }) {
  const URL = _id && message ? [endpoints.mail.updatedraft, { _id, message }] : null;
  let status = '';
  if (URL != null) {
    status = updateDraft(URL);
  } else {
    status = null;
  }

  return status;
}

export function postUpdateMailRead({ id, readbool }) {
  const URL = id && readbool ? [endpoints.mail.updateasread, { id, readbool }] : null;
  let status = '';

  if (URL != null) {
    status = updateMailRead(URL);
  } else {
    status = null;
  }

  return status;
}

export async function updateLabel({ id, labelToUpdate, add, detail, labelAdded }) {
  console.log(id, labelToUpdate, add);
  const URL =
    id && labelToUpdate && labelAdded
      ? [endpoints.mail.updateLabel, { id, labelToUpdate, add, detail, labelAdded }]
      : null;
  console.log('URL', URL);
  let status = '';

  if (URL != null) {
    status = await putFetcherWthUrl(URL);
  } else {
    status = null;
  }
  console.log('status', status);
  return status;
}

export function putArchiveMail({ _id, archivebool }) {
  const URL = _id && archivebool ? [endpoints.mail.archivemail, { _id, archivebool }] : null;
  let status = '';

  if (URL != null) {
    status = archiveMail(URL);
  } else {
    status = null;
  }

  return status;
}

// chatgpt
export function postGetChatGptAnswer({ mailId }) {
  const URL = mailId ? [endpoints.chatgpt.getanswer, { mailId }] : null;
  let status = '';
  let res;

  if (URL != null) {
    console.log('URL', URL);
    res = sendAnswerChatGpt(URL);
    status = res.status;
  } else {
    status = null;
  }
  console.log('status', status);
  return res;
}

// chatgpt
export function postGetChatGptResume({ mailId }) {
  const URL = mailId ? [endpoints.chatgpt.getresume, { mailId }] : null;
  let status = '';
  let res;

  if (URL != null) {
    res = sendResumeChatGpt(URL);
    status = res.status;
  } else {
    status = null;
  }
  console.log('status', status);
  return res;
}

export function updateCategory({ _id, category }) {
  const URL = _id && category ? `${endpoints.users.updateCategory}` : null;
  // const URL = _id && category ? [endpoints.users.updateCategory, { _id, category }] : null;
  let status = '';
  let res;

  if (URL != null) {
    res = putFetcher(URL, { _id, category });
    status = res.status;
  } else {
    status = null;
  }
  console.log('status', status);
  return res;
}

export function updateThreadCategoryAndStatus({
  threadId,
  category,
  statusInput,
  deletion,
  email,
}) {
  const URL =
    threadId && category && statusInput ? `${endpoints.users.updatecategoryandstatus}` : null;

  let status = '';
  let res;

  if (URL != null) {
    res = putFetcher(URL, {
      threadId,
      category,
      statusInput,
      deletion,
      email,
    });
    status = res.status;
  } else {
    status = null;
  }
  console.log('status', status);
  return res;
}

export async function updateThreadStatus({ threadId, statusInput, email }) {
  const URL = threadId && statusInput ? `${endpoints.users.updatestatus}` : null;

  let status = '';
  let res;

  if (URL != null) {
    res = await putFetcher(URL, { threadId, statusInput, email });
    status = res.status;
  } else {
    status = null;
  }
  console.log('res: ', status);
  return res;
}

// attachments
export async function getAttachmentsDownloads({ mailId, filename }) {
  const URL = mailId ? `${endpoints.mail.singleAttachment}/${mailId}/${filename}` : null;

  if (URL != null) {
    console.log('URL', URL);
    const res = await getAttachment(URL);
    return res;
  }
  return null;
}

// Forward
export async function forward({
  deliveredTo,
  threadId,
  user,
  forwardEmails,
  isSummaryPresent,
  attachments,
  message,
  subject,
  cc,
  bcc,
  draftId,
}) {
  const URL =
    deliveredTo && threadId && forwardEmails && attachments && subject && cc && bcc && draftId
      ? [
          endpoints.mail.forward,
          {
            deliveredTo,
            threadId,
            user,
            forwardEmails,
            isSummaryPresent,
            attachments,
            message,
            subject,
            cc,
            bcc,
            draftId,
          },
        ]
      : null;

  let response = '';

  if (URL != null) {
    response = await postFetcher(URL);
  } else {
    response = null;
  }

  return response;
}

export async function deleteThreadMail({ threadId }) {
  console.log(threadId);

  // Construct the URL to include the threadId as a path parameter
  const URL = threadId ? `${endpoints.mail.deleteThreadMail}/${threadId}` : null;

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
