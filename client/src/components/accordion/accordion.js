import { useState } from 'react';
import PropTypes from 'prop-types';
import * as cheerio from 'cheerio';
import { m, AnimatePresence } from 'framer-motion';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { IconButton } from '@mui/material';

// utils
import { fDateTime } from 'src/utils/format-time';
import { decodeHtmlEntities } from 'src/utils/text_utils';

// import Markdown from 'src/components/markdown';
import { Scrollbar } from 'src/components/scrollbar';
import { Email } from 'src/components/email';

import { format_sender } from 'src/sections/mail/utils/text_formatting';

import { Iconify } from '../iconify';

const Accordion = ({ email, expanded, setExpanded, removeEmail }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isOpen = email === expanded;

  function extractNewContent(html) {
    const $ = cheerio.load(html);

    // Remove blockquote elements from the HTML
    const blockquotes = $('blockquote');

    // Iterate over each blockquote
    blockquotes.each((index, blockquote) => {
      // Get the previous sibling of blockquote
      const prevSibling = $(blockquote).prev();

      // Remove the previous sibling (the div before blockquote)
      prevSibling.remove();

      // Remove the blockquote element
      $(blockquote).remove();
    });

    // Get the remaining HTML content
    return $.html();
  }

  return (
    <Box>
      <m.header
        style={{
          width: '100%',
          padding: '1px',
          cursor: 'pointer',
          backgroundColor: 'transparent',
          background: isHovered ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
          borderRadius: '0',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(1.5px)',
          WebkitBackdropFilter: 'blur(1.5px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
        }}
        onClick={() => setExpanded(isOpen ? false : email)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 1 }}>
          <Stack
            direction="row"
            sx={{ overflow: 'hidden', flexGrow: 1, color: 'text.secondary', fontSize: '14px' }}
          >
            <Box
              sx={{
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                flexShrink: 0.5, // Ensures the sender gets enough space
                marginRight: 1,
              }}
            >
              {format_sender(email.from).split('<')[0]}
            </Box>
            <Box
              sx={{
                ml: 1,
                display: 'flex',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                // flexBasis: '60%',
                flexGrow: 1, // Takes up available space
                minWidth: 0, // Prevents unwanted wrapping
              }}
            >
              <Box
                sx={{
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  flexGrow: 1, // Expands to fill available space
                  flexShrink: 1,
                  minWidth: 0,
                  maxWidth: '60%',
                }}
              >
                {email.subject}
              </Box>
              <Box
                sx={{
                  mx: '2px',
                  flexShrink: 0, // Prevents shrinking of the separator
                  whiteSpace: 'nowrap',
                }}
              >
                —
              </Box>
              <Box
                sx={{
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  flexGrow: 1, // Expands to fill available space
                  flexShrink: 1, // Allows shrinking to fit within the available space
                  minWidth: 0,
                }}
              >
                {decodeHtmlEntities(email.snippet)}
              </Box>
            </Box>
          </Stack>
          <Box sx={{ ml: 2, fontSize: '11px', flexShrink: 0 }}>
            {console.log(email.date)}
            {fDateTime(email.date, 'dd MMM YYYY HH:mm')}
          </Box>
          <Box sx={{ ml: 2, fontSize: '11px', flexShrink: 0 }}>
            <IconButton
              onClick={(event) => {
                event.stopPropagation();
                removeEmail(email._id);
              }}
              sx={{
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'error.mainRgba', // Replace 'colorValue' with your desired color
                },
              }}
            >
              <Iconify icon="mdi:trash-can-outline" color="error.main" />
            </IconButton>
          </Box>
        </Stack>
      </m.header>
      <AnimatePresence initial={false}>
        {isOpen && (
          <m.section
            key="content"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, maxHeight: 1000 },
              collapsed: { opacity: 0, maxHeight: 0 },
            }}
            transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.84] }}
            style={{
              overflow: 'hidden',
              padding: '5px',
              borderLeft: '1px solid rgba(255, 255, 255, 0.3)',
              borderRight: '1px solid rgba(255, 255, 255, 0.3)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            <Scrollbar>
              <Email
                // eslint-disable-next-line react/jsx-boolean-value
                forwarding={true}
                height={100}
                body={email.html !== '' ? extractNewContent(email.html) : email.text}
              />
              {/* <Markdown
                children={email.message}
                message={email.html !== '' ? extractNewContent(email.html) : email.text}
                sx={{
                  px: 2,
                  backgroundColor: 'transparent',
                  '& p': {
                    typography: 'body2',
                  },
                }}
              /> */}
            </Scrollbar>
          </m.section>
        )}
      </AnimatePresence>
    </Box>
  );
};

Accordion.propTypes = {
  email: PropTypes.any,
  expanded: PropTypes.number,
  setExpanded: PropTypes.func,
  removeEmail: PropTypes.func,
};

export default Accordion;
