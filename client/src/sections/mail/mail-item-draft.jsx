'use client';

import { m } from 'framer-motion';
import PropTypes from 'prop-types';
import { format, isToday, isYesterday, differenceInDays } from 'date-fns';

// @mui
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import { alpha, darken, lighten } from '@mui/material/styles';

import { decodeHtmlEntities } from 'src/utils/text_utils';

import { toast } from 'sonner';

import { deleteDraft } from 'src/api/drafts';

// import Scrollbar from 'src/components/scrollbar';
import { Iconify } from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

// ----------------------------------------------------------------------

export function MailItemDraft({
  mail,
  selected,
  selectedLabelId,
  onClickMail,
  style,
  openDetail,
  tagMapping,
  mails,
}) {
  const hasAttachments = mails.some((mailT) => mailT.attachmentCount > 0);

  // const { enqueueSnackbar } = useSnackbar();

  const adjustedStyle = {
    ...style,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '5px',
    padding: '5px',
    cursor: 'pointer',
    backgroundColor: selected ? 'rgba(22, 22, 32, 1)' : 'rgba(22, 22, 32, 0)', // Use rgba values
  };

  const formatDate = (date) => {
    const parsedDate = new Date(date);
    const today = new Date();

    if (isToday(parsedDate)) {
      return format(parsedDate, 'HH:mm');
    }
    if (isYesterday(parsedDate)) {
      return 'Yesterday';
    }
    if (differenceInDays(today, parsedDate) <= 7) {
      return format(parsedDate, 'EEEE');
    }
    return format(parsedDate, 'd MMM');
  };

  const handleDeleteDraft = async () => {
    if (!mail.draftId) {
      return;
    }
    const response = await deleteDraft({ draftId: mail.draftId });
    console.log(response);
    // enqueueSnackbar('Draft deleted successfully!', { variant: 'success' });
    toast.success('Draft deleted successfully', {
      duration: 2000,
      action: {
        label: 'Undo',
        onClick: () => console.log('Undo'),
      },
    });
  };

  return (
    <Box
      sx={{
        position: 'relative',
        '&:hover .hover-buttons': {
          visibility: 'visible',
          opacity: 1,
        },
      }}
    >
      <m.div
        style={adjustedStyle}
        onClick={onClickMail}
        key={selectedLabelId}
        whileHover={{
          backgroundColor: 'rgba(22, 22, 32, 1)', // Ensure hover state uses rgba format
          cursor: 'pointer',
        }}
      >
        <Grid
          container
          wrap="nowrap"
          spacing={2}
          sx={{
            fontSize: '14px',
            position: 'relative',
          }}
        >
          <Grid item xs={openDetail ? 4 : 3}>
            <Box
              sx={{
                color: mail.labelIds.includes('UNREAD') ? 'text.primary' : 'text.secondary',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                display: 'flex',
                flexDirection: 'row',
                gap: '5px',
              }}
            >
              <Stack direction="row" spacing={0.2} alignItems="center">
                <Box
                  sx={{
                    textTransform: 'capitalize',
                    fontSize: '0.65rem',
                    borderRadius: '5px',
                    padding: '2px 7px',
                    fontWeight: '900',
                    letterSpacing: '0.6px',
                    bgcolor: alpha(tagMapping.draft.bgcolor, 0.3),
                    color: (theme) =>
                      theme.palette.mode === 'light'
                        ? darken(tagMapping.draft.bgcolor, 0.8)
                        : lighten(tagMapping.draft.bgcolor, 0.8),
                  }}
                >
                  Draft
                </Box>
                {hasAttachments && (
                  <Box>
                    <Iconify icon="mdi:paperclip" width={14} sx={{ color: 'text.primary' }} />
                  </Box>
                )}
              </Stack>
            </Box>
          </Grid>
          <Grid item xs={openDetail ? 9 : 10}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-start',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}
            >
              <Box
                sx={{
                  color: mail.labelIds.includes('UNREAD') ? 'text.primary' : 'text.secondary',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  flexGrow: 4,
                  flexShrink: 1,
                  minWidth: 0,
                }}
              >
                {mail.subject}
              </Box>
              <Box
                sx={{
                  color: 'text.secondary',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  marginLeft: openDetail ? '2px' : '5px',
                  marginRight: openDetail ? '2px' : '5px',
                  flexShrink: 0,
                }}
              >
                —
              </Box>
              <Box
                sx={{
                  color: 'text.secondary',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  flexGrow: 0,
                  flexShrink: 4,
                  minWidth: 0,
                }}
              >
                {decodeHtmlEntities(mail.snippet)}
              </Box>
            </Box>
          </Grid>
          <Grid item xs={1}>
            <Box
              sx={{
                marginLeft: '0%',
                fontSize: '11px',
                textAlign: 'right',
              }}
            >
              {mail.date && formatDate(mail.date)}
            </Box>
          </Grid>
        </Grid>
        <Box
          className="hover-buttons"
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            paddingRight: '10px',
            visibility: 'hidden',
            opacity: 0,
            transition: 'opacity 0.3s ease',
            height: '100%',
            backgroundColor: '#161620',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation(); /* your delete action */
                handleDeleteDraft();
              }}
            >
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          </Tooltip>
        </Box>
        {/* <Divider sx={{ borderStyle: 'dashed' }} /> */}
        {/* <AnimatePresence> */}
      </m.div>
    </Box>
  );
}

MailItemDraft.propTypes = {
  mail: PropTypes.object,
  onClickMail: PropTypes.func,
  selected: PropTypes.bool,
  style: PropTypes.object,
  openDetail: PropTypes.bool,
  tagMapping: PropTypes.object,
  mails: PropTypes.array,
};
