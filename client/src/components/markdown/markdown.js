import DOMPurify from 'dompurify';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

import 'src/utils/highlight';

export default function Markdown({ message, sx, ...other }) {
  const theme = useTheme();

  // Clean HTML input to prevent XSS
  const cleanHTML = DOMPurify.sanitize(message);

  return (
    <Box
      sx={{
        padding: '0 10px',
        color:
          theme.palette.mode === 'dark'
            ? `${theme.palette.melify.textRenderEmail} !important`
            : 'black',
        backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
        overflowX: 'auto', // Enables horizontal scrolling for wide content
        width: '100%',
        // Additional styling can be added here for dark mode
        '& p': {
          color:
            theme.palette.mode === 'dark'
              ? `${theme.palette.melify.textRenderEmail} !important`
              : 'black !important', // Ensures <p> tags have #808080 text in dark mode
        },
        '& a': {
          color: theme.palette.mode === 'dark' ? `#52e49c !important` : '#1a0dab !important',
        },
        '& span': {
          color:
            theme.palette.mode === 'dark'
              ? `${theme.palette.melify.textRenderEmail} !important`
              : '#d400ff !important',
        },
        '& code': {
          backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#f5f5f5',
          color:
            theme.palette.mode === 'dark'
              ? `${theme.palette.melify.textRenderEmail} !important`
              : '#d400ff',
          padding: '2px 4px',
          borderRadius: '4px',
        },
        ...sx,
      }}
      dangerouslySetInnerHTML={{ __html: cleanHTML }}
      {...other}
    />
  );
}

Markdown.propTypes = {
  sx: PropTypes.object,
  message: PropTypes.string,
};

// const components = {
//   img: ({ ...props }) => <Image alt={props.alt} ratio="16/9" sx={{ borderRadius: 2 }} {...props} />,
//   a: ({ ...props }) => {
//     const isHttp = props.href.includes('http');
//     return isHttp ? (
//       <Link target="_blank" rel="noopener" {...props} />
//     ) : (
//       <Link component={RouterLink} href={props.href} {...props}>
//         {props.children}
//       </Link>
//     );
//   },
// };
