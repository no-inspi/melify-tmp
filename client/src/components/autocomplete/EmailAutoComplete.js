import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { m, LazyMotion, domAnimation, AnimatePresence } from 'framer-motion';

import { Box, Stack } from '@mui/material';

import CustomizedAutoComplete from 'src/components/autocomplete/autocomplete';

const EmailAutoComplete = ({
  contacts,
  onAutoCompleteChange,
  onAutoCompleteChangeCc,
  onAutoCompleteChangeBcc,
  to,
  cc,
  bcc,
  paddingLeft,
}) => {
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  return (
    <>
      <CustomizedAutoComplete
        paddingLeft={paddingLeft}
        onChange={onAutoCompleteChange}
        placeholder="Enter an email"
        contacts={contacts}
        selectedValues={to}
        label="To "
        endAdornment={
          <Stack direction="row" spacing={0.5} sx={{ typography: 'subtitle2' }}>
            <Box
              sx={{
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' },
                color: showCc ? '#0466c8' : 'inherit',
              }}
              onClick={() => setShowCc((prev) => !prev)}
            >
              Cc
            </Box>
            <Box
              sx={{
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' },
                color: showBcc ? '#0466c8' : 'inherit',
              }}
              onClick={() => setShowBcc((prev) => !prev)}
            >
              Bcc
            </Box>
          </Stack>
        }
      />

      <LazyMotion features={domAnimation}>
        <AnimatePresence>
          {showCc && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <CustomizedAutoComplete
                paddingLeft={paddingLeft}
                selectedValues={cc}
                label="Cc "
                onChange={onAutoCompleteChangeCc}
                placeholder="Enter an email"
                contacts={contacts}
              />
            </m.div>
          )}
        </AnimatePresence>
      </LazyMotion>

      <LazyMotion features={domAnimation}>
        <AnimatePresence>
          {showBcc && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <CustomizedAutoComplete
                paddingLeft={paddingLeft}
                selectedValues={bcc}
                label="Bcc "
                onChange={onAutoCompleteChangeBcc}
                placeholder="Enter an email"
                contacts={contacts}
              />
            </m.div>
          )}
        </AnimatePresence>
      </LazyMotion>
    </>
  );
};

EmailAutoComplete.propTypes = {
  contacts: PropTypes.arrayOf(PropTypes.string).isRequired,
  onAutoCompleteChange: PropTypes.func.isRequired,
  onAutoCompleteChangeCc: PropTypes.func.isRequired,
  onAutoCompleteChangeBcc: PropTypes.func.isRequired,
  to: PropTypes.array,
  cc: PropTypes.array,
  bcc: PropTypes.array,
  paddingLeft: PropTypes.number,
};

export default EmailAutoComplete;
