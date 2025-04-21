import PropTypes from 'prop-types';
import { jellyTriangle } from 'ldrs';
import React, { useState } from 'react';

import { styled } from '@mui/system';
import Stack from '@mui/material/Stack';
import { Box, Popover } from '@mui/material';
import { TextareaAutosize as BaseTextareaAutosize } from '@mui/base/TextareaAutosize';

import { Iconify } from 'src/components/iconify';

jellyTriangle.register('jt-icon');

const grey = {
  50: '#F3F6F9',
  100: '#E5EAF2',
  200: '#DAE2ED',
  300: '#C7D0DD',
  400: '#B0B8C4',
  500: '#9DA8B7',
  600: '#6B7A90',
  700: '#434D5B',
  800: '#303740',
  900: '#1C2025',
};

const Textarea = styled(BaseTextareaAutosize)(
  ({ theme }) => `
    box-sizing: border-box;
    font-family: 'Public Sans', sans-serif;
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.5;
    padding: 5px;
    border-radius: 8px;
    color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
    background: transparent;
    border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
  
    &:hover {
      border-color: ${theme.palette.grey[600]};
    }
  
    &:focus {
      outline: 0;
      border-color: ${theme.palette.grey[500]};
    }
  
    // firefox
    &:focus-visible {
      outline: 0;
    }
  `
);

const FloatingToolbar = ({ anchorEl, onClose, onSubmit }) => {
  const [prompt, setPrompt] = React.useState('');
  const [loading, setLoading] = useState(false);

  const handleKeyDown = async (event) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent default form submission
      setLoading(true); // Start loading

      try {
        await onSubmit(prompt); // Ensure this is awaited
        console.log('AI content submitted++');
      } catch (error) {
        console.error('Error submitting AI content:', error);
      } finally {
        console.log('AI content submitted');
        setLoading(false); // Stop loading after the request finishes
        onClose(); // Close the popover
      }
    }
  };

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      sx={{
        marginTop: '2rem',
        '& .MuiPaper-root': {
          background: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[500]
              : theme.palette.melify.linearDarker, // Change this to your desired background color
          //   color: 'white', // Optional: change the text color to contrast the background
        },
      }}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      //   transformOrigin={{
      //     vertical: 'top',
      //     horizontal: 'center',
      //   }}
      zIndex={1999}
    >
      {loading ? (
        <Stack sx={{ py: 2, px: 5, width: '300px' }} direction="row" justifyContent="center">
          <jt-icon color="white" />
        </Stack>
      ) : (
        <Box
          sx={{
            p: 0.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            minWidth: '300px',
            // background: 'red',
          }}
        >
          {/* <TextField
            label="AI Prompt"
            variant="outlined"
            size="small"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            sx={{ width: '100%' }}
            autoFocus
            onKeyDown={handleKeyDown}
          /> */}
          <Stack direction="row" spacing={0.5} sx={{ width: '100%' }}>
            <Iconify icon="wi:stars" width={24} />
            <Textarea
              size="small"
              autoFocus
              minRows={2}
              maxRows={2}
              aria-label="empty textarea"
              id="aiprompt"
              name="aiprompt"
              label="aiprompt"
              placeholder="Your prompt ..."
              onKeyDown={handleKeyDown}
              onChange={(e) => setPrompt(e.target.value)}
              value={prompt}
              sx={{ width: '100%' }}
            />
          </Stack>
        </Box>
      )}
    </Popover>
  );
};

FloatingToolbar.propTypes = {
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
  anchorEl: PropTypes.any,
};

export default FloatingToolbar;
