import PropTypes from 'prop-types';
import { jellyTriangle } from 'ldrs';
import React, { useState } from 'react';

import { Box } from '@mui/material';
import { styled } from '@mui/system';
import Stack from '@mui/material/Stack';
import Backdrop from '@mui/material/Backdrop';
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
    border: 1px solid rgba(130, 125, 237, 0.3);
    width: 100%;
  
    &:hover {
      border-color: rgba(130, 125, 237, 0.7)};
    }
  
    &:focus {
      outline: 0;
      border-color: rgba(130, 125, 237, 0.5)};
    }
  
    // firefox
    &:focus-visible {
      outline: 0;
    }
  `
);

const PromptEditor = ({ open, setOpen, addMoreContext }) => {
  const [prompt, setPrompt] = React.useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  const handleKeyDown = async (event) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent default form submission
      setLoading(true); // Start loading

      try {
        await addMoreContext(prompt);
      } catch (error) {
        console.error('Error submitting AI content:', error);
      } finally {
        console.log('AI content submitted');
        setLoading(false); // Stop loading after the request finishes
        handleClose(); // Close the popover
        setPrompt('');
      }
    }
  };

  return (
    <Backdrop
      sx={() => ({
        color: '#fff',
        zIndex: 1998,
        position: 'absolute',
        // marginTop: '2rem',
        width: '100%',
        height: '100%',
      })}
      open={open}
      onClick={handleClose}
    >
      <Box
        sx={{
          background: '#212B36',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '8px',
          border: '1px solid rgba(130, 125, 237, 0.7)}',
        }}
      >
        <Box
          onClick={(e) => e.stopPropagation()}
          sx={{
            background: (theme) =>
              theme.palette.mode === 'light'
                ? theme.palette.grey[500]
                : theme.palette.melify.linearDarker,
            py: 1,
          }}
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
                <Iconify icon="wi:stars" width={24} color="#827ded" />

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
                  onClick={(e) => e.stopPropagation()}
                  value={prompt}
                  sx={{ width: '100%' }}
                />
              </Stack>
            </Box>
          )}
        </Box>
      </Box>
    </Backdrop>
  );
};

PromptEditor.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  addMoreContext: PropTypes.func,
};

export default PromptEditor;
