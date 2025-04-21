'use client';

import PropTypes from 'prop-types';
import React, { useMemo, useState, createContext } from 'react';

export const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const value = useMemo(() => ({ searchQuery, setSearchQuery }), [searchQuery]);

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};

SearchProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
