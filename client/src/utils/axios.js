import axios from 'axios';

import { CONFIG } from 'src/config-global';

// eslint-disable-next-line import/no-cycle
import { setSession, refreshToken } from 'src/auth/context/gmail/utils';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: CONFIG.site.serverUrl });

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log('Token expired. Attempting to refresh...'); // Log token expiration

      try {
        const newAccessToken = await refreshToken(); // Assume this refreshes and stores the new token
        if (newAccessToken) {
          console.log('Token refreshed successfully:', newAccessToken); // Log the new access token
          setSession(newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  const res = await axiosInstance.get(url, { ...config });

  return res.data;
};

export const postFetcher = async (args) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  console.log(url, config);

  const res = await axiosInstance.post(url, { ...config }, { withCredentials: true });

  return res;
};

export const postFetcherCf = async (args) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  console.log(url, config);

  const res = await axios.post(url, { ...config }, { withCredentials: true });

  return res;
};

export const putFetcher = async (url, config = {}) => {
  try {
    // Ensure the URL is a string and log for debugging
    if (typeof url !== 'string') {
      throw new Error(`Expected URL to be a string but received ${typeof url}: ${url}`);
    }

    // Pass the data in the config object
    const res = await axiosInstance.put(url, config, { withCredentials: true });
    console.log('Response:', res);

    return res.data; // return data if the request is successful
  } catch (error) {
    console.error('Error in putFetcher:', error);
    throw error; // re-throw error for handling outside
  }
};

export const putFetcherWthUrl = async (args) => {
  const [url, config] = Array.isArray(args) ? args : [args];
  const res = await axiosInstance.put(url, { ...config }, { withCredentials: true });
  return res;
};

export const deleteFetcher = async (url, config = {}) => {
  try {
    const res = await axiosInstance.delete(url, { ...config, withCredentials: true });
    return res.data; // return data if the request is successful
  } catch (error) {
    console.error('Error in deleteFetcher:', error);
    throw error; // re-throw error for handling outside
  }
};

export const sendMail = async (args) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  console.log(url, config);

  const res = await axiosInstance.post(url, { ...config }, { withCredentials: true });

  return res;
};

export const addDraft = async (args) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  console.log(url, config);

  const res = await axiosInstance.post(url, { ...config });

  return res.status;
};

export const sendMailAnswer = async (args) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  console.log(url, config);

  const res = await axiosInstance.post(url, { ...config }, { withCredentials: true });

  return res;
};

// ADMIN
export const deleteMail = async (args) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  console.log(url, config);

  const res = await axiosInstance.post(url, { ...config });

  // const res = {status: 200}
  return res.status;
};

export const deleteDraft = async (args) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  console.log(url, config);

  const res = await axiosInstance.post(url, { ...config });

  // const res = {status: 200}
  return res.status;
};

export const updateMail = async (args) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  console.log(url, config);

  const res = await axiosInstance.post(url, { ...config });
  // const res = {status: 200}
  return res.status;
};

export const updateDraft = async (args) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  const res = await axiosInstance.put(url, { ...config });
  // const res = {status: 200}
  return res.status;
};

export const updateMailRead = async (args) => {
  const [url, config] = Array.isArray(args) ? args : [args];
  const res = await axiosInstance.put(url, { ...config }, { withCredentials: true });
  return res.status;
};

export const archiveMail = async (args) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  const res = await axiosInstance.put(url, { ...config });
  // const res = {status: 200}
  return res.status;
};

// chatgpt
export const sendAnswerChatGpt = async (args) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  const res = await axiosInstance.post(url, { ...config });

  return res;
};

export const sendResumeChatGpt = async (args) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  const res = await axiosInstance.post(url, { ...config });

  return res;
};

export const getAttachment = async (args) => {
  const url = args;

  const res = await axiosInstance.get(url, {
    responseType: 'blob',
  });

  return res;
};

export const addCategory = async (args) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  console.log(url, config);

  const res = await axiosInstance.post(url, { ...config }, { withCredentials: true });

  return res;
};

// ----------------------------------------------------------------------

export const endpoints = {
  chat: '/api/chat',
  kanban: '/api/kanban',
  calendar: '/api/calendar',
  auth: {
    me: '/api/auth/me',
    login: '/api/auth/login',
    register: '/api/auth/register',
    googleLogin: '/api/auth/google',
  },
  mail: {
    list: '/api/mail/list',
    threads: 'api/mails/threads',
    importantthreads: 'api/mails/importantthreads',
    details: '/api/mails/details',
    labels: '/api/mails/labels',
    addmail: '/api/mails/addMail',
    addanswer: '/api/mails/addAnswer',
    forward: '/api/mails/forward',
    deletemail: '/api/mail/deleteMail',
    deleteThreadMail: '/api/mails/thread',
    updatemail: '/api/mail/updateMail',
    updateasread: '/api/mails/setAsRead',
    updateLabel: '/api/mails/updateLabel',
    archivemail: '/api/mail/archiveMail',
    adddraft: '/api/drafts/adddraft',
    updatedraft: '/api/drafts/updatedraft',
    deletedraft: '/api/drafts/deleteDraft',
    singleAttachment: '/api/mails/attachment',
  },
  drafts: {
    createdraft: 'api/drafts',
    draft: 'api/drafts',
  },
  search: {
    global: '/api/mails/search_global',
    suggestion: '/api/users/search_suggestion',
  },
  users: {
    addcategory: '/api/users/addCategory',
    generatecategories: '/api/users/generateCategories',
    updatecategories: '/api/users/updateCategories',
    updateCategory: '/api/mails/updatecategory',
    threadUpdateCategory: '/api/mails/threadupdatecategory',
    updatecategoryandstatus: '/api/mails/updatecategoryandstatus',
    updatestatus: '/api/mails/updatestatus',
    addsearch: '/api/users/add_search',
  },
  chatgpt: {
    getanswer: '/api/gpt/answer',
    getresume: '/api/gpt/resume',
    generatecategories: '/api/ai/generateCategories',
  },
  cf: {
    onboarding_categories: `${process.env.REACT_APP_CF_URL}/onboarding_categories`,
    onboarding_pinecone: `${process.env.REACT_APP_CF_URL}/onboarding_pinecone`,
  },
  post: {
    list: '/api/post/list',
    details: '/api/post/details',
    latest: '/api/post/latest',
    search: '/api/post/search',
  },
  product: {
    list: '/api/product/list',
    details: '/api/product/details',
    search: '/api/product/search',
  },
};
