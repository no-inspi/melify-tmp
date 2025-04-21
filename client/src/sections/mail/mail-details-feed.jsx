'use client';

import PropTypes from 'prop-types';

// @mui
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import ListItemText from '@mui/material/ListItemText';

// utils

// components
import Markdown from 'src/components/markdown';
import { Scrollbar } from 'src/components/scrollbar';

export function MailDetailsFeed({ feed, mail, side }) {
  return (
    <>
      {side === 'right' ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
          }}
        >
          <Stack
            flexShrink={0}
            direction="row"
            alignItems="center"
            // textAlign="right"
            sx={{
              p: (theme) => theme.spacing(2, 2, 1, 2),
            }}
          >
            <ListItemText
              primary={
                <>
                  {/* {feed.from} */}
                  <Box component="span" sx={{ typography: 'body2', color: 'text.disabled' }}>
                    {` <${feed.from}>`}
                  </Box>
                </>
              }
              secondary={
                <>
                  {`To: `}
                  {/* {`${mail.from.email},`} */}
                  {feed.from === mail.from.email ? null : `${mail.from.email},`}
                  {mail.to.map((person) => (
                    <Link key={person.email} sx={{ color: 'text.secondary' }}>
                      {person.email !== feed.from ? `${person.email}, ` : null}
                    </Link>
                  ))}
                </>
              }
              secondaryTypographyProps={{
                mt: 0.5,
                noWrap: true,
                component: 'span',
                typography: 'caption',
              }}
            />
            <Avatar alt={mail.from.name} src={`${mail.from.avatarUrl}`} sx={{ ml: 2 }}>
              {feed.from.charAt(0).toUpperCase()}
            </Avatar>
          </Stack>
          <Box
            sx={{
              // py: 2,
              overflow: 'hidden',
              flexGrow: 1,
              textAlign: side,
              width: '60%',
              // maxWidth: '60%',
              // minWidth: '10%',
            }}
          >
            <Scrollbar>
              <Markdown
                message={feed.html}
                children={feed.message}
                sx={{
                  px: 2,
                  color: (theme) => (theme.light ? 'black' : 'black'),
                  backgroundColor: 'transparent',
                  '& p': {
                    typography: 'body2',
                  },
                }}
              />
            </Scrollbar>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
          }}
        >
          <Stack
            flexShrink={0}
            direction="row"
            alignItems="center"
            // textAlign="right"
            sx={{
              p: (theme) => theme.spacing(2, 2, 1, 2),
            }}
          >
            <Avatar alt={mail.from.name} src={`${mail.from.avatarUrl}`} sx={{ mr: 2 }}>
              {feed.from.charAt(0).toUpperCase()}
            </Avatar>
            <ListItemText
              primary={
                <>
                  {/* {feed.from} */}
                  <Box component="span" sx={{ typography: 'body2', color: 'text.disabled' }}>
                    {` <${feed.from}>`}
                  </Box>
                </>
              }
              secondary={
                <>
                  {`To: `}
                  {`${mail.from.email},`}
                  {mail.to.map((person) => (
                    <Link key={person.email} sx={{ color: 'text.secondary' }}>
                      {person.email !== feed.from ? `${person.email}, ` : null}
                    </Link>
                  ))}
                </>
              }
              secondaryTypographyProps={{
                mt: 0.5,
                noWrap: true,
                component: 'span',
                typography: 'caption',
              }}
            />
          </Stack>
          <Box
            sx={{
              // py: 2,
              overflow: 'hidden',
              flexGrow: 1,
              // textAlign: side,

              width: '60%',
              // maxWidth: '60%',
              // minWidth: '10%',
            }}
          >
            <Scrollbar>
              <Markdown
                message={feed.html}
                children={feed.message}
                sx={{
                  px: 2,
                  color: (theme) => (theme.light ? 'black' : 'white'),
                  backgroundColor: 'transparent',
                  '& p': {
                    typography: 'body2',
                  },
                }}
              />
            </Scrollbar>
          </Box>
        </Box>
      )}
      {/* </Stack> */}
    </>
  );
}

MailDetailsFeed.propTypes = {
  feed: PropTypes.object,
  mail: PropTypes.object,
  side: PropTypes.string,
};
