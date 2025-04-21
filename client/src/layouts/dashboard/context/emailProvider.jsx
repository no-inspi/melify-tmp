'use client';

import PropTypes from 'prop-types';
import React, { useMemo, useState, createContext } from 'react';

export const EmailFilterContext = createContext();

export const EmailFilterProvider = ({ children }) => {
  const [filterCriteria, setFilterCriteria] = useState('');

  const value = useMemo(() => ({ filterCriteria, setFilterCriteria }), [filterCriteria]);

  return <EmailFilterContext.Provider value={value}>{children}</EmailFilterContext.Provider>;
};

EmailFilterProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
