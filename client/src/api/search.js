import useSWR from 'swr';
// import keyBy from 'lodash/keyBy';
import { useMemo } from 'react';

// utils
import { fetcher, endpoints, postFetcher } from 'src/utils/axios';

export function useSearchEmails(query, email) {
  const URL = email && [endpoints.search.global, { params: { query, email } }];

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher, {
    keepPreviousData: true,
  });

  const memoizedValue = useMemo(
    () => ({
      searchResults: data?.results || [],
      searchLoading: isLoading,
      searchError: error,
      searchValidating: isValidating,
      searchEmpty: !isLoading && !data?.results.length,
    }),
    [data?.results, error, isLoading, isValidating]
  );

  return memoizedValue;
}

export function useSearchSuggestion(userEmail) {
  const URL = userEmail && [endpoints.search.suggestion, { params: { userEmail } }];

  console.log('URL', URL);

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher, {
    keepPreviousData: true,
  });

  console.log('data', data);

  const memoizedValue = useMemo(
    () => ({
      suggestionResults: data || [],
      suggestionLoading: isLoading,
      suggestionError: error,
      suggestionValidating: isValidating,
      suggestionEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

export function addSearch({ searchText, userEmail }) {
  const URL =
    searchText && userEmail ? [endpoints.users.addsearch, { searchText, userEmail }] : null;
  let status = '';
  // useSWR(URL, sendMail);
  if (URL != null) {
    status = postFetcher(URL);
  } else {
    status = null;
  }

  return status;
}
