import * as React from 'react';
import PropTypes from 'prop-types';

import { styled } from '@mui/system';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import { alpha, darken, lighten } from '@mui/material/styles';
// mui
import { selectClasses, Select as BaseSelect } from '@mui/base/Select';
import { optionClasses, Option as BaseOption } from '@mui/base/Option';

export default function UnstyledSelectForm({ value, options, handleChange, tagMapping }) {
  return (
    <form>
      <Select
        value={value.toLowerCase()}
        id="named-select"
        name="demo-select"
        onChange={(_, newValue) => {
          if (newValue) {
            handleChange(newValue.toLowerCase());
          }
        }}
        sx={{
          background: alpha(tagMapping[value.toLowerCase()]?.bgcolor || '#FFFFFF', 0.3),
          color: (theme) =>
            theme.palette.mode === 'light'
              ? darken(tagMapping[value.toLowerCase()].bgcolor, 0.8)
              : lighten(tagMapping[value.toLowerCase()].bgcolor, 0.8),
          // px: 3,
          py: 0.5,
          borderRadius: '5px',
          fontSize: '0.65rem',
          fontWeight: '900',
          letterSpacing: '0.6px',
          cursor: 'pointer',
          borderColor: 'transparent',
          '&:hover': {
            borderColor: 'transparent',
            background: alpha(tagMapping[value.toLowerCase()]?.bgcolor || '#FFFFFF', 0.5),
          },
        }}
      >
        {options.map((option, index) => (
          <Option
            key={index}
            value={option.toLowerCase()}
            onClick={(event) => event.stopPropagation()}
          >
            <Label
              key={option}
              sx={{
                padding: '2px 7px',
                letterSpacing: '0.6px',
                fontWeight: '900',
                borderRadius: '5px',
                // color: tagMapping[msg.toLowerCase()].color
                // bgcolor: alpha(tagMapping[option.toLowerCase()]?.bgcolor || '#FFFFFF', 0.5),
                color: (theme) =>
                  theme.palette.mode === 'light'
                    ? darken(tagMapping[option.toLowerCase()].bgcolor, 0.8)
                    : lighten(tagMapping[option.toLowerCase()].bgcolor, 0.8),
              }}
            >
              {/* {option} */}
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Label>
          </Option>
        ))}
      </Select>
    </form>
  );
}

/* eslint-disable prefer-arrow-callback */
const Select = React.forwardRef(function CustomSelect(props, ref) {
  const slots = {
    root: Button,
    listbox: Listbox,
    popup: Popup,
    ...props.slots,
  };

  return (
    <BaseSelect {...props} ref={ref} slots={slots} onClick={(event) => event.stopPropagation()} />
  );
});
/* eslint-enable prefer-arrow-callback */

const blue = {
  100: '#DAECFF',
  200: '#99CCF3',
  300: '#66B2FF',
  400: '#3399FF',
  500: '#007FFF',
  600: '#0072E5',
  700: '#0066CC',
  900: '#003A75',
};

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

/* eslint-disable prefer-arrow-callback */
const Button = React.forwardRef(function Button(props, ref) {
  const { ...other } = props;
  return (
    <StyledButton type="button" {...other} ref={ref}>
      {other.children}
      <UnfoldMoreIcon />
    </StyledButton>
  );
});
/* eslint-enable prefer-arrow-callback */

UnstyledSelectForm.propTypes = {
  value: PropTypes.string,
  options: PropTypes.object,
  handleChange: PropTypes.func,
  tagMapping: PropTypes.object,
};

Button.propTypes = {
  children: PropTypes.node,
};

Select.propTypes = {
  slots: PropTypes.object,
};

const StyledButton = styled('button', { shouldForwardProp: () => true })(
  ({ theme }) => `
  position: relative;
  font-family: 'Public Sans', sans-serif;
  font-size: 0.875rem;
  box-sizing: border-box;
  width: 'auto';
  padding: 8px 20px 8px 12px;
  border-radius: 8px;
  text-align: left;
  line-height: 1.5;
  background: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
  color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  box-shadow: 0px 2px 6px ${
    theme.palette.mode === 'dark' ? 'rgba(0,0,0, 0.50)' : 'rgba(0,0,0, 0.05)'
  };

  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 120ms;

  &.${selectClasses.focusVisible} {
    outline: 0;
    border-color: ${blue[400]};
    box-shadow: 0 0 0 3px ${theme.palette.mode === 'dark' ? blue[600] : blue[200]};
  }

  & > svg {
    font-size: 1rem;
    position: absolute;
    height: 100%;
    top: 0;
    right: 2px;
  }
  `
);

const Listbox = styled('ul')(
  ({ theme }) => `
  font-family: 'Public Sans', sans-serif;
  font-size: 0.875rem;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  min-width: 'auto';
  border-radius: 12px;
  overflow: auto;
  outline: 0px;
  background: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
  color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  box-shadow: 0px 2px 6px ${
    theme.palette.mode === 'dark' ? 'rgba(0,0,0, 0.50)' : 'rgba(0,0,0, 0.05)'
  };
  `
);

const Option = styled(BaseOption)(
  ({ theme }) => `
  list-style: none;
  padding: 4px 4px 1px 4px;
  border-radius: 8px;
  cursor: default;

  &:last-of-type {
    border-bottom: none;
  }

  &.${optionClasses.selected} {
    background-color: ${theme.palette.mode === 'dark' ? blue[900] : blue[100]};
    color: ${theme.palette.mode === 'dark' ? blue[100] : blue[900]};
  }

  &.${optionClasses.highlighted} {
    background-color: ${theme.palette.mode === 'dark' ? grey[800] : grey[100]};
    color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  }

  &.${optionClasses.highlighted}.${optionClasses.selected} {
    background-color: ${theme.palette.mode === 'dark' ? blue[900] : blue[100]};
    color: ${theme.palette.mode === 'dark' ? blue[100] : blue[900]};
  }

  &:focus-visible {
    outline: 3px solid ${theme.palette.mode === 'dark' ? blue[600] : blue[200]};
  }

  &.${optionClasses.disabled} {
    color: ${theme.palette.mode === 'dark' ? grey[700] : grey[400]};
  }

  &:hover:not(.${optionClasses.disabled}) {
    background-color: ${theme.palette.mode === 'dark' ? grey[800] : grey[100]};
    color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  }
  `
);

const Popup = styled('div')`
  z-index: 1;
`;

const Label = styled('label')(
  ({ theme }) => `
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.85rem;
  display: block;
  margin-bottom: 4px;
  font-weight: 400;
  color: ${theme.palette.mode === 'dark' ? grey[400] : grey[700]};
  `
);
