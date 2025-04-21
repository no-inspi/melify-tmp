import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
// @mui
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';

// components
import Label from 'src/components/label';

// ----------------------------------------------------------------------

export default function ResultItem({ title, path, groupLabel, onClickItem }) {
  return (
    <ListItemButton
      onClick={onClickItem}
      sx={{
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'transparent',
        borderBottomColor: (theme) => theme.palette.divider,
        '&:hover': {
          borderRadius: 1,
          borderColor: (theme) => theme.palette.common.white,
          background: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[200]
              : theme.palette.melify.linearDarker,
        },
      }}
    >
      <ListItemText
        primaryTypographyProps={{
          typography: 'subtitle2',
          sx: { textTransform: 'capitalize' },
        }}
        secondaryTypographyProps={{ typography: 'caption' }}
        primary={title.map((part, index) => (
          <Box
            key={index}
            component="span"
            sx={{
              color: part.highlight ? 'primary.main' : 'text.primary',
            }}
          >
            {part.text}
          </Box>
        ))}
        secondary={path.map((part, index) => (
          <Box
            key={index}
            component="span"
            sx={{
              color: part.highlight ? 'primary.main' : 'text.secondary',
            }}
          >
            {part.text}
          </Box>
        ))}
      />

      {groupLabel && <Label color="info">{groupLabel}</Label>}
    </ListItemButton>
  );
}

ResultItem.propTypes = {
  groupLabel: PropTypes.string,
  onClickItem: PropTypes.func,
  path: PropTypes.array,
  title: PropTypes.array,
};
