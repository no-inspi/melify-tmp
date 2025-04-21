'use client';

import { m } from 'framer-motion';
import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
// import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
// @mui
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
// import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import ListItemText from '@mui/material/ListItemText';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ListItemButton from '@mui/material/ListItemButton';
import { alpha, darken, lighten } from '@mui/material/styles';

import { useBoolean } from 'src/hooks/use-boolean';

import { fDateTime } from 'src/utils/format-time';
import { truncateString, decodeHtmlEntities } from 'src/utils/text_utils';

import { putArchiveMail, postUpdateMailRead, postGetChatGptResume } from 'src/api/mail';

import Markdown from 'src/components/markdown';
// import Scrollbar from 'src/components/scrollbar';
import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';

import { format_sender } from './utils/text_formatting';
// import getVariant from './get-variant';

const emails = ['username@gmail.com', 'user02@gmail.com'];
// ----------------------------------------------------------------------

export function MailItem({
  mail,
  selected,
  onClickMail,
  sx,
  mutate,
  threadMail,
  tagMapping,
  ...other
}) {
  const dialog = useBoolean();

  // eslint-disable-next-line
  const [selectedValue] = useState(emails[1]);
  // eslint-disable-next-line
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeValue, setResumeValue] = useState('');

  const handleClose = useCallback(() => {
    dialog.onFalse();
  }, [dialog]);

  const handleArchive = () => {
    putArchiveMail({ _id: mail._id, archivebool: true });
    mutate((prevData) => prevData.filter((item) => item._id !== mail._id), false);
  };

  const handleSetAsRead = () => {
    postUpdateMailRead({ id: mail.messageId, readbool: 'false' });

    // Remove "UNREAD" from the labelIds array if it exists
    const updatedLabelIds = mail.labelIds.filter((label) => label !== 'UNREAD');

    const updatedMail = { ...mail, labelIds: updatedLabelIds };

    mutate(
      (prevData) =>
        prevData.map((item) => (item.messageId === mail.messageId ? updatedMail : item)),
      false
    );
  };

  const handleSubmitResume = async () => {
    dialog.onTrue();
    setResumeLoading(true);
    console.log(mail);
    const resp = await postGetChatGptResume({ mailId: mail.messageId });
    console.log(resp);
    if (resumeValue !== resp.data.resume || (resumeValue === '' && resp.data.resume !== '')) {
      setResumeValue(resp.data.resume);
    }

    setResumeLoading(false);
  };

  const tags = (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 4, marginTop: 6, marginBottom: 6 }}>
      {mail.category !== undefined ? (
        <Box
          sx={{
            textTransform: 'capitalize',
            fontSize: '0.65rem',
            borderRadius: '5px',
            padding: '2px 7px',
            fontWeight: '900',
            letterSpacing: '0.6px',
            bgcolor: alpha(tagMapping[mail.category.toLowerCase()].bgcolor, 0.3),
            color: (theme) =>
              theme.palette.mode === 'light'
                ? darken(tagMapping[mail.category.toLowerCase()].bgcolor, 0.8)
                : lighten(tagMapping[mail.category.toLowerCase()].bgcolor, 0.8),
          }}
        >
          {tagMapping[mail.category.toLowerCase()].name}
        </Box>
      ) : (
        <Box
          sx={{
            textTransform: 'capitalize',
            fontSize: '0.65rem',
            bgcolor: tagMapping.other.bgcolor,
            borderRadius: '5px',
            padding: '2px 5px',
            color: tagMapping.other.color,
          }}
        >
          Other
        </Box>
      )}
    </div>
  );

  const nameMsg = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div
        style={{
          fontWeight: '900',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        <span>{format_sender(mail.from).split('<')[0]}</span>{' '}
      </div>
      <div style={{ fontSize: '12px', fontWeight: '700' }}>{truncateString(mail.subject)}</div>
      <div style={{ fontSize: '10px', fontWeight: '200' }}>
        {truncateString(decodeHtmlEntities(mail.snippet))}
      </div>
    </div>
  );

  const renderLoading = (
    <LoadingScreen
      sx={{
        borderRadius: 1.5,
        bgcolor: 'background.default',
      }}
    />
  );

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: '5px',
          height: '100%',
          paddingTop: '5px',
        }}
      >
        <ListItemButton
          onClick={onClickMail}
          sx={{
            minHeight: '50px',
            p: 0.5,
            mb: 0.5,
            borderRadius: 1,
            '&:hover #button_container_update': {
              display: 'block',
            },
            '&:hover #date_item': {
              display: 'none',
            },
            ...(selected && {
              bgcolor: 'action.selected',
            }),
            ...sx,
          }}
          {...other}
        >
          {/* <Avatar alt={mail.from.name} src={`${mail.from.avatarUrl}`} sx={{ mr: 2 }}>
            {mail.from.name.charAt(0).toUpperCase()}
          </Avatar> */}
          <ListItemText
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              maxWidth: '80%', // To make sure it occupies full height of ListItemButton
            }}
            secondary={nameMsg}
            secondaryTypographyProps={{
              // noWrap: true,
              // variant: 'subtitle2',
              variant: mail.labelIds.includes('UNREAD') ? 'subtitle2' : 'body2',
              color: mail.labelIds.includes('UNREAD') ? 'text.primary' : 'text.secondary',
              sx: {
                flex: 1, // This ensures it takes up all available space
                overflow: 'hidden',
                maxHeight: '100px',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                pr: 1,
              },
            }}
            primary={tags}
            primaryTypographyProps={{
              noWrap: true,
              component: 'span',
              variant: mail.isUnread ? 'subtitle2' : 'body2',
              color: mail.isUnread ? 'text.primary' : 'text.secondary',
            }}
          />

          <Stack
            alignItems="flex-end"
            sx={{
              ml: 0,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              width: '20%',
            }}
            id="date_item"
          >
            <Typography
              noWrap
              variant="body2"
              component="span"
              sx={{
                mb: 1.5,
                fontSize: 10,
                color: 'text.disabled',
              }}
            >
              <b>
                {/* {formatDistanceToNowStrict(mail.date, {
                  addSuffix: false,
                })} */}
                {threadMail.lastInboxEmailDate &&
                  formatDistanceToNow(new Date(threadMail.lastInboxEmailDate))}
                {/* {mail.date} */}
              </b>
            </Typography>
          </Stack>
          <Stack
            alignItems="flex-end"
            direction="column"
            justifyContent="flex-end"
            spacing={2}
            sx={{ ml: 0, height: '100%', display: 'none', width: '20%' }}
            id="button_container_update"
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-end',
              }}
            >
              <Tooltip title="Mark as read" placement="left">
                <Button
                  // fullWidth
                  // color="inherit"
                  variant="contained"
                  startIcon={<Iconify icon="ph:envelope-open-light" />}
                  sx={{
                    paddingRight: 0,
                    backgroundColor: 'transparent',
                    minWidth: '15px',
                    color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
                    '&:hover': {
                      background: (theme) => theme.palette.melify.linearLighter,
                      color: 'white',
                    },
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    console.log('enter in set as read');
                    handleSetAsRead();
                    // Any other logic for this button
                  }}
                />
              </Tooltip>
            </div>{' '}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-end',
              }}
            >
              <Tooltip title="Archive" placement="left">
                <Button
                  // fullWidth
                  // color="inherit"
                  variant="contained"
                  startIcon={<Iconify icon="material-symbols:archive" />}
                  sx={{
                    paddingRight: 0,
                    backgroundColor: 'transparent',
                    minWidth: '15px',
                    color: (theme) =>
                      theme.palette.mode === 'light' ? theme.palette.grey[900] : 'white',
                    '&:hover': {
                      background: (theme) => theme.palette.melify.linearLighter,
                      color: 'white',
                    },
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleArchive();
                  }}
                />
              </Tooltip>
            </div>{' '}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-end',
              }}
            >
              <Tooltip title="Delete" placement="left">
                <Button
                  // fullWidth
                  color="inherit"
                  variant="contained"
                  startIcon={<Iconify icon="ph:trash-bold" />}
                  sx={{
                    paddingRight: 0,
                    backgroundColor: 'transparent',
                    minWidth: '15px',
                    color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
                    '&:hover': {
                      background: (theme) => theme.palette.melify.linearLighter,
                      color: 'white',
                    },
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleArchive();
                    // Any other logic for this button
                  }}
                />
              </Tooltip>
            </div>{' '}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-end',
              }}
            >
              <Tooltip title="Summary" placement="left">
                <Button
                  // fullWidth
                  color="inherit"
                  variant="contained"
                  startIcon={<Iconify icon="ooui:text-summary-ltr" />}
                  sx={{
                    paddingRight: 0,
                    backgroundColor: 'transparent',
                    minWidth: '15px',
                    color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
                    '&:hover': {
                      background: (theme) => theme.palette.melify.linearLighter,
                      color: 'white',
                    },
                  }}
                  onClick={handleSubmitResume}
                />
              </Tooltip>
            </div>{' '}
          </Stack>
        </ListItemButton>
        {/* <Box
          sx={{
            alignItems: 'center',
            justifyContent: 'center',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Button
            // fullWidth
            onClick={handleSubmitResume}
            color="inherit"
            variant="contained"
            startIcon={<Iconify icon="ic:baseline-plus" color="white" />}
            sx={{
              paddingRight: 0,
              // backgroundColor: 'melify.main',
              minWidth: '40px',
              background: (theme) => theme.palette.melify.linearLighter,
              '&:hover': {
                // bgcolor: 'melify.dark',
                background: (theme) => theme.palette.melify.linearLight,
                '& .iconify': {
                  color: 'white', // replace with the desired hover color
                },
              },
            }}
          />
        </Box> */}
      </Box>
      <Divider sx={{ borderStyle: 'dashed' }} />
      {/* <AnimatePresence> */}
      {dialog.value && (
        <Dialog
          // {...getVariant('fadeIn')}
          open={dialog.value}
          onClose={() => handleClose(selectedValue)}
          PaperComponent={(props) => (
            <m.div>
              <Paper {...props} />
            </m.div>
          )}
        >
          <DialogTitle
            id="alert-dialog-title"
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              background: (theme) =>
                theme.palette.mode === 'light'
                  ? theme.palette.grey[200]
                  : theme.palette.melify.linearDarker,
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ fontSize: '0.8rem', fontWeight: '100' }}>{mail.from}</Box>
              <Box>{mail.subject}</Box>
            </Box>
            <Box sx={{ fontSize: '0.8rem', fontWeight: '100' }}>{fDateTime(mail.createdAt)}</Box>
          </DialogTitle>
          {resumeLoading ? (
            renderLoading
          ) : (
            <DialogContent
              sx={{
                background: (theme) =>
                  theme.palette.mode === 'light'
                    ? theme.palette.grey[200]
                    : theme.palette.melify.linearDarker,
              }}
            >
              <Markdown
                message={resumeValue}
                children={resumeValue}
                sx={{
                  px: 0,
                  color: (theme) => (theme.light ? 'black' : 'white'),
                  '& p': {
                    typography: 'body2',
                  },
                }}
              />
            </DialogContent>
          )}
          <DialogActions
            sx={{
              background: (theme) =>
                theme.palette.mode === 'light'
                  ? theme.palette.grey[200]
                  : theme.palette.melify.linearDarker,
            }}
          >
            {/* <Button onClick={handleClose}>Close</Button> */}
            <Button
              sx={{
                background: (theme) =>
                  theme.palette.mode === 'light'
                    ? theme.palette.melify.linearLighter
                    : theme.palette.melify.linearLighter,
                color: 'white',
                '&:hover': {
                  background: (theme) =>
                    theme.palette.mode === 'light'
                      ? theme.palette.melify.linearLight
                      : theme.palette.melify.linearLight,
                  '& .iconify': {
                    color: 'white', // replace with the desired hover color
                  },
                },
              }}
              variant="contained"
              onClick={handleClose}
              autoFocus
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
      {/* </AnimatePresence> */}
    </>
  );
}

MailItem.propTypes = {
  mail: PropTypes.object,
  onClickMail: PropTypes.func,
  selected: PropTypes.bool,
  sx: PropTypes.object,
  mutate: PropTypes.func,
  threadMail: PropTypes.object,
  tagMapping: PropTypes.object,
};
