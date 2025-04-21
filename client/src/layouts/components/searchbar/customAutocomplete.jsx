'use client';

import { memo, useContext, useCallback } from 'react';

// @mui

import { useDebounce } from 'src/hooks/use-debounce';

import { SearchContext } from 'src/layouts/dashboard/context/searchProvider';
import { addSearch, useSearchEmails, useSearchSuggestion } from 'src/api/search';
import { EmailFilterContext } from 'src/layouts/dashboard/context/emailProvider';

import { useAuthContext } from 'src/auth/hooks';

import EmailSearch from './email-search';

function AutoCompleteSearchBar() {
  const { searchQuery, setSearchQuery } = useContext(SearchContext);
  const { setFilterCriteria } = useContext(EmailFilterContext);
  const { user } = useAuthContext();

  const handleSearch = useCallback(
    (inputValue) => {
      setSearchQuery(inputValue);
    },
    [setSearchQuery]
  );

  const handleOptionSelect = useCallback(
    (selectedOption) => {
      setFilterCriteria(selectedOption); // Assuming `selectedOption` has an `id` to filter emails
      addSearch({ searchText: selectedOption, userEmail: user?.email });
    },
    // eslint-disable-next-line
    [setFilterCriteria]
  );

  const debouncedQuery = useDebounce(searchQuery);

  const { searchResults, searchLoading } = useSearchEmails(debouncedQuery, user?.email);

  const { suggestionResults } = useSearchSuggestion(user?.email);

  return (
    <div>
      <EmailSearch
        query={debouncedQuery}
        results={searchResults}
        onSearch={handleSearch}
        onSelect={handleOptionSelect}
        hrefItem={() => console.log('entered')}
        loading={searchLoading}
        setFilterCriteria={setFilterCriteria}
        suggestionResults={suggestionResults}
      />
    </div>
  );
}

export default memo(AutoCompleteSearchBar);
