import PropTypes from 'prop-types';

import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
// @mui
import { alpha } from '@mui/material/styles';

// ----------------------------------------------------------------------

export default function ComponentBlock({ sx, children, ...other }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 1.5,
        borderStyle: 'dashed',
        bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
      }}
    >
      {/* {title && <CardHeader title={title} />} */}

      <Stack
        spacing={3}
        direction="row"
        alignItems="center"
        justifyContent="center"
        flexWrap="wrap"
        sx={{
          p: 0,
          minHeight: 0,
          ...sx,
        }}
        {...other}
      >
        {children}
      </Stack>
    </Paper>
  );
}

ComponentBlock.propTypes = {
  children: PropTypes.node,
  sx: PropTypes.object,
  title: PropTypes.string,
};
