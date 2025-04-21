import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

import DownloadButton from './download-button';
//
import { fileThumb, fileFormat } from './utils';

// ----------------------------------------------------------------------

export default function FileThumbnail({ file, tooltip, imageView, onDownload, sx, htmlTitle }) {
  const name = file.filename;

  const format = fileFormat(name);

  const renderContent =
    format === 'image' && imageView ? (
      // <Box
      //   component="img"
      //   src={preview}
      //   sx={{
      //     width: 1,
      //     height: 1,
      //     flexShrink: 0,
      //     objectFit: 'cover',
      //     ...imgSx,
      //   }}
      // />
      <Box
        component="img"
        src={fileThumb(format)}
        sx={{
          width: 32,
          height: 32,
          flexShrink: 0,
          ...sx,
        }}
      />
    ) : (
      <Box
        component="img"
        src={fileThumb(format)}
        sx={{
          width: 32,
          height: 32,
          flexShrink: 0,
          ...sx,
        }}
      />
    );

  if (tooltip) {
    return (
      <Tooltip
        title={htmlTitle || name}
        slotProps={{
          popper: {
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: [0, -10],
                },
              },
            ],
          },
        }}
      >
        <Stack
          flexShrink={0}
          component="span"
          alignItems="center"
          justifyContent="center"
          sx={{
            width: 'fit-content',
            height: 'inherit',
          }}
        >
          {renderContent}
          {onDownload && <DownloadButton onDownload={onDownload} />}
        </Stack>
      </Tooltip>
    );
  }

  return (
    <Stack direction="column" alignItems="center" justifyContent="center" spacing={0.5}>
      <Stack
        flexShrink={0}
        component="span"
        alignItems="center"
        justifyContent="center"
        sx={{
          width: 'fit-content',
          height: 'inherit',
        }}
      >
        {renderContent}
        {onDownload && <DownloadButton onDownload={onDownload} />}
      </Stack>
      <Box
        sx={{
          position: 'relative', // Parent must have relative positioning
          maxWidth: '70px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontSize: '9px',
          color: 'text.disabled',
        }}
      >
        {htmlTitle || name}
      </Box>
    </Stack>
  );
}

FileThumbnail.propTypes = {
  file: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  imageView: PropTypes.bool,
  onDownload: PropTypes.func,
  sx: PropTypes.object,
  tooltip: PropTypes.bool,
  htmlTitle: PropTypes.node,
};
