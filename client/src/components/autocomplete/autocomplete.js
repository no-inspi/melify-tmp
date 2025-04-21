import * as React from 'react';
import PropTypes from 'prop-types';

import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { useAutocomplete } from '@mui/base/useAutocomplete';
import { autocompleteClasses } from '@mui/material/Autocomplete';

const Root = styled('div')(
  ({ theme }) => `
  color: ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,.85)'};
  font-size: 14px;
`
);

const InputWrapper = styled('div')(
  ({ theme, paddingLeft }) => `
    width: '100%';
    padding: 0px;
    padding-right: 5px;
    padding-left: ${paddingLeft || 0}px;
    display: flex;
    flex-wrap: wrap;
    align-items: center; /* Ensure items are aligned to the center */
    font-family: Public Sans, sans-serif;

    border-bottom: solid 1px rgba(145, 158, 171, 0.08);

    & input {
        background: transparent;
        color: #FFFFFF;
        height: 48px;
        box-sizing: border-box;
        padding: 0px 5px;
        width: 0;
        min-width: 30px;
        flex-grow: 1;
        border: 0;
        margin: 0;
        outline: 0;

        &::placeholder {
            color: ${theme.palette.mode === 'dark' ? theme.palette.grey[600] : 'rgba(0,0,0,0.42)'};
          }
    }    
`
);

function Tag(props) {
  const { label, onDelete, ...other } = props;
  return (
    <div {...other}>
      <span>{label}</span>
      <CloseIcon onClick={onDelete} />
    </div>
  );
}

Tag.propTypes = {
  label: PropTypes.string.isRequired,
  onDelete: PropTypes.func.isRequired,
};

const StyledTag = styled(Tag)(
  ({ theme }) => `
  display: flex;
  align-items: center;
  height: 'auto';
  margin: 10px 0px 10px 10px;
  line-height: 22px;
  background-color: ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#fafafa'};
  border: 1px solid ${theme.palette.mode === 'dark' ? '#303030' : '#e8e8e8'};
  border-radius: 2px;
  box-sizing: content-box;
  padding: 0 4px 0 10px;
  outline: 0;
  overflow: hidden;
  border-radius: 8px;

  &:focus {
    border-color: ${theme.palette.mode === 'dark' ? '#177ddc' : '#40a9ff'};
    background-color: ${theme.palette.mode === 'dark' ? '#003b57' : '#e6f7ff'};
  }

  & span {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  & svg {
    margin-left: 5px;
    font-size: 14px;
    cursor: pointer;

    transition: color 0.2s;
    
    &:hover {
      color: white;
    }
  }
`
);

const Listbox = styled('ul')(
  () => `
  width: 300px;
  margin: 2px 0 0;
  padding: 0;
  position: absolute;
  list-style: none;
  background: hsl(var(--background));
  overflow: auto;
  max-height: 250px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1500;

  & li {
    padding: 5px 12px;
    display: flex;

    & span {
      flex-grow: 1;
    }

    & svg {
      color: transparent;
    }
  }

  & li[aria-selected='true'] {
    background-color: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
    font-weight: 600;

    & svg {
      color: #1890ff;
    }
  }

  & li.${autocompleteClasses.focused} {
    background-color: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
    cursor: pointer;

    & svg {
      color: currentColor;
    }
  }
`
);

export default function CustomizedAutoComplete({
  onChange,
  placeholder,
  contacts,
  endAdornment,
  label,
  selectedValues,
  paddingLeft,
}) {
  const [inputValue, setInputValue] = React.useState('');

  const {
    getRootProps,
    getInputProps,
    getTagProps,
    getListboxProps,
    getOptionProps,
    groupedOptions,
    value,
    focused,
    setAnchorEl,
  } = useAutocomplete({
    id: 'customized-hook-demo',
    multiple: true,
    options: contacts,
    freeSolo: true, // Allow free-text input
    getOptionLabel: (option) => option,
    onChange: (event, newValue) => {
      onChange(newValue);
    },
    value: selectedValues,
    inputValue,
    onInputChange: (event, newInputValue) => setInputValue(newInputValue),
    filterOptions: (options, state) => {
      // Add custom email to the list if it's not in contacts
      const filtered = options.filter((option) =>
        option.toLowerCase().includes(state.inputValue.toLowerCase())
      );

      if (state.inputValue !== '' && !options.includes(state.inputValue)) {
        filtered.push(state.inputValue);
      }

      return filtered;
    },
  });

  return (
    <Root>
      <div {...getRootProps()}>
        <InputWrapper
          ref={setAnchorEl}
          paddingLeft={paddingLeft}
          className={focused ? 'focused' : ''}
        >
          {label && <div>{label}</div>}
          {value.map((option, index) => {
            const { key, ...tagProps } = getTagProps({ index });
            return <StyledTag key={key} {...tagProps} label={option} />;
          })}
          <input {...getInputProps()} placeholder={placeholder} />
          {endAdornment && <div>{endAdornment}</div>}
        </InputWrapper>
      </div>
      {groupedOptions.length > 0 ? (
        <Listbox {...getListboxProps()}>
          {groupedOptions.map((option, index) => {
            const { key, ...optionProps } = getOptionProps({ option, index });
            return (
              <li key={key} {...optionProps}>
                <span>{option}</span>
              </li>
            );
          })}
        </Listbox>
      ) : null}
    </Root>
  );
}

CustomizedAutoComplete.propTypes = {
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  contacts: PropTypes.arrayOf(PropTypes.string).isRequired,
  endAdornment: PropTypes.node,
  label: PropTypes.string,
  selectedValues: PropTypes.array,
  paddingLeft: PropTypes.number,
};
