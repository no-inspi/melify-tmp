import * as React from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import { styled } from '@mui/material/styles';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';

import { Iconify } from 'src/components/iconify';

const Accordion = styled((props) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(() => ({
  backgroundColor: 'transparent',
  '&.Mui-expanded': {
    backgroundColor: 'transparent', // Ensure expanded state is also transparent
    boxShadow: 'none',
    borderRadius: '0px',
  },
  '&:not(:last-child)': {
    borderBottom: 0,
  },
  '&::before': {
    display: 'none',
  },
}));

const AccordionSummary = styled((props) => (
  <MuiAccordionSummary
    expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} />}
    {...props}
  />
))(() => ({
  backgroundColor: 'transparent',
  flexDirection: 'row',
  minHeight: 0,
  height: '25px',
  padding: '0px 5px 0px 0px',
  marginLeft: '5px',
  marginBottom: '10px',
  '&:hover': {
    backgroundColor: 'hsl(var(--card))', // Hover effect
  },
  '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
    transform: 'rotate(90deg)',
  },
}));

const AccordionDetails = styled(MuiAccordionDetails)(() => ({
  padding: 0,
}));

const AccordionMail = ({ children, emailsLength }) => {
  const [expanded, setExpanded] = React.useState('panel1');

  const handleChange = (panel) => (event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
  };

  return (
    <div>
      <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
        <AccordionSummary aria-controls="panel1d-content" id="panel1d-header">
          <Stack direction="column" sx={{ width: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="flex-start">
              <Checkbox
                color="warning"
                icon={<Iconify icon="material-symbols:label-important-outline" />}
                checkedIcon={<Iconify icon="material-symbols:label-important-rounded" />}
                checked
              />
              <Typography
                variant="caption"
                sx={{
                  letterSpacing: 0.5,
                  color: 'grey.500',
                  fontWeight: 'bold',
                  fontSize: '0.65rem',
                }}
              >
                IMPORTANT
              </Typography>
            </Stack>
            <Divider variant="middle" sx={{ width: 1 }} />
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ width: 1, height: expanded ? `${Math.min(emailsLength, 5) * 50}px` : '0px' }}>
            {children}
          </Box>
        </AccordionDetails>
      </Accordion>
    </div>
  );
};

AccordionMail.propTypes = {
  children: PropTypes.any,
  emailsLength: PropTypes.number,
};

export default AccordionMail;
