'use client';

import PropTypes from 'prop-types';
import React, { useState } from 'react';
import parse from 'autosuggest-highlight/parse';
import match from 'autosuggest-highlight/match';

// @mui
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Autocomplete, { autocompleteClasses } from '@mui/material/Autocomplete';

// routes

// components
import { Iconify } from 'src/components/iconify';
import { SearchNotFound } from 'src/components/search-not-found';

// ----------------------------------------------------------------------

const StyledInputWrapper = styled('div')(() => ({
  position: 'relative',
  width: '100%',
  overflow: 'hidden',
}));

const StyledInput = styled(TextField)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  '& input': {
    color: theme.palette.common.white,
    fontSize: '12px',
  },
}));

const BackgroundText = styled('div')(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  height: '100%',
  width: '100%',
  fontSize: '12px',
  paddingLeft: '48px',

  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',

  // padding: '14px 0 14px 14px',
  pointerEvents: 'none',
  color: theme.palette.grey[500],
  fontWeight: theme.typography.fontWeightLight,
  zIndex: 0,
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
}));

const defaultCommands = [
  {
    name: `is: - Sent, unread, spam, todo, done`,
    description: `is: - Sent, unread, spam, todo, done`,
    id: 1,
  },
  {
    name: `from: specify the sender`,
    description: `from: specify the sender`,
    id: 1,
  },
  {
    name: `subject: search by subject`,
    description: `subject: search by subject`,
    id: 1,
  },
  {
    name: `to: find a receiver`,
    description: `to: find a receiver`,
    id: 1,
  },
  {
    name: `filename: find by file name`,
    description: `filename: find by file name`,
    id: 1,
  },
  {
    name: 'category: specify the category',
    description: 'category: specify the category',
    id: 1,
  },
];

export default function EmailSearch({
  results,
  onSearch,
  onSelect,
  loading,
  setFilterCriteria,
  suggestionResults,
}) {
  const [inputValue, setInputValue] = useState('');

  const highlightKeywords = ['is:', 'from:', 'subject:', 'to:', 'filename:', 'category:'];

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
    onSearch(event.target.value);
  };

  const handleClick = (event) => {
    if (event) {
      onSelect(event.name);
    } else {
      onSelect(null);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleClick({ name: event.target.value });
    }
  };

  const renderFormattedText = () => {
    const regex = /(is:|sender:|receiver:|\s+)/g;
    const parts = inputValue.split(regex).filter((part) => part !== ''); // Split and remove empty strings
    return (
      <>
        {parts.map((part, index) => (
          <span
            key={index}
            style={{
              background: highlightKeywords.includes(part.trim()) ? 'hsl(var(--card))' : null,
              // fontWeight: highlightKeywords.includes(part.trim()) ? 'bold' : 'normal',
              // color: 'transparent',
              borderRadius: highlightKeywords.includes(part.trim()) ? '2px' : '0px',
              whiteSpace: 'pre', // Ensure whitespace is preserved
            }}
          >
            {part}
          </span>
        ))}
      </>
    );
  };

  return (
    <>
      <Autocomplete
        inputValue={inputValue}
        sx={{
          width: { xs: 1, sm: 500 },
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'default',
            },
          },
          '& .MuiOutlinedInput-root.Mui-focused': {
            background: 'hsl(var(--background))',
            '& fieldset': {
              borderColor: 'text.secondary',
            },
          },
          '& .MuiOutlinedInput-root:hover': {
            background: 'hsl(var(--background))',
            '& fieldset': {
              borderColor: 'text.secondary',
            },
          },
          // // 👇 Select the hover item here
          // '& + .MuiAutocomplete-popper .MuiAutocomplete-option:hover': {
          //   // 👇 Customize the hover bg color here
          //   backgroundColor: 'hotpink',
          // },
          // // 👇 Optional: keep this one to customize the selected item when hovered
          // "& + .MuiAutocomplete-popper .MuiAutocomplete-option[aria-selected='true']:hover": {
          //   backgroundColor: 'hotpink',
          // },
        }}
        size="small"
        loading={loading}
        autoHighlight={false}
        autoSelect={false}
        popupIcon={null}
        options={
          inputValue === ''
            ? [
                ...(Array.isArray(suggestionResults)
                  ? suggestionResults.map((cmd) => ({ ...cmd, group: 'Suggestion Commands' }))
                  : []),
                ...(Array.isArray(results)
                  ? results.map((res) => ({ ...res, group: 'All Commands' }))
                  : []),
              ]
            : Array.isArray(results)
              ? results.map((res) => ({ ...res, group: 'Search Results' }))
              : []
        }
        groupBy={(option) => option.group || ''}
        onChange={(event, newValue) => {
          if (newValue) {
            setInputValue(newValue.name);
            handleClick(newValue);
          } else {
            setInputValue('');
            handleClick(null);
          }
        }}
        onKeyDown={handleKeyDown}
        renderGroup={(params) => (
          <div key={params.key}>
            <div className="text-[#637381] px-0 py-1 text-xs italic">{params.group}</div>
            {params.children}
          </div>
        )}
        getOptionLabel={(option) => option.name}
        filterOptions={(options) => options}
        noOptionsText={<SearchNotFound query={inputValue} sx={{ bgcolor: 'unset' }} />}
        slotProps={{
          popper: {
            placement: 'bottom-start',
            sx: {
              minWidth: 320,
            },
          },
          paper: {
            sx: {
              [` .${autocompleteClasses.option}`]: {
                pl: 0.75,
                // '&:hover, &.Mui-selected, &.Mui-focused': {
                //   background: 'rgba(22, 22, 32, 1)',
                // },
              },
              background: 'hsl(var(--background))',
            },
          },
        }}
        renderInput={(params) => (
          <StyledInputWrapper>
            <BackgroundText>{renderFormattedText()}</BackgroundText>
            <StyledInput
              {...params}
              sx={{ color: 'transparent' }}
              value={inputValue}
              placeholder="Search emails, contacts ..."
              onChange={handleInputChange}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify
                      icon="eva:search-fill"
                      sx={{ ml: 1, color: 'text.disabled', width: 18, height: 18 }}
                    />
                  </InputAdornment>
                ),
                endAdornment: (
                  <>
                    {loading ? <Iconify icon="svg-spinners:8-dots-rotate" sx={{ mr: -3 }} /> : null}
                    {inputValue && inputValue !== '' ? (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          sx={{ mr: -7 }}
                          onClick={() => {
                            setInputValue('');
                            handleInputChange({ target: { value: '' } });
                            handleClick(null);
                            setFilterCriteria('');
                          }}
                        >
                          <Iconify icon="mdi:cross-circle" />
                        </IconButton>
                      </InputAdornment>
                    ) : null}
                  </>
                ),
              }}
            />
          </StyledInputWrapper>
        )}
        renderOption={(props, product) => {
          const matches = match(product.name, inputValue);
          const parts = parse(product.name, matches);

          const handleOptionClick = () => {
            // Check if the product name starts with any of the defaultCommands prefixes
            const foundCommand = defaultCommands.find((command) => command.name === product.name);

            if (foundCommand) {
              // If a command is found, update the inputValue with that command's prefix
              setInputValue(`${foundCommand.name.split(':')[0]}: `);
            } else {
              // Otherwise, update it with the full product name
              setInputValue(product.name);
              handleClick(product);
            }
          };

          return (
            <>
              <Box
                component="li"
                {...props}
                key={product.id}
                onClick={handleOptionClick}
                sx={{
                  textAlign: 'left',
                  backgroundColor: 'transparent', // Set the background color to red
                }}
              >
                <div>
                  {parts.map((part, index) => (
                    <Typography
                      key={index}
                      component="span"
                      color={part.highlight ? 'primary' : 'textPrimary'}
                      sx={{
                        typography: 'body2',
                        fontWeight: part.highlight ? 'fontWeightSemiBold' : 'fontWeightMedium',
                        fontSize: '12px',
                      }}
                    >
                      {part.text}
                    </Typography>
                  ))}
                </div>
              </Box>
              <Divider sx={{ width: '100%', borderStyle: 'dashed' }} />
            </>
          );
        }}
      />
      {/* <button onClick={logVariables} type="button">
        test
      </button> */}
    </>
  );
}

EmailSearch.propTypes = {
  loading: PropTypes.bool,
  onSearch: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  query: PropTypes.string,
  results: PropTypes.array,
  setFilterCriteria: PropTypes.func.isRequired,
  suggestionResults: PropTypes.array,
};
