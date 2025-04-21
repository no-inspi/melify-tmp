'use client';

import Image from 'next/image';
import { useState } from 'react';
import { m } from 'framer-motion';
import PropTypes from 'prop-types';
import { format, isToday, isYesterday, differenceInDays } from 'date-fns';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
// import Grid from '@mui/material/Grid';
// import { useToast } from 'src/s/hooks/use-toast.ts';
import { toast } from 'sonner';

// @mui
import Checkbox from '@mui/material/Checkbox';
// import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';

import { decodeHtmlEntities } from 'src/utils/text_utils';

import {
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
  Tooltip as TooltipShadcn,
} from 'src/s/components/ui/tooltip.tsx';
import {
  updateLabel,
  deleteThreadMail,
  postUpdateMailRead,
  updateThreadStatus,
  updateThreadCategoryAndStatus,
} from 'src/api/mail';

// import Scrollbar from 'src/components/scrollbar';
import { Iconify } from 'src/components/iconify';
import { Combobox } from 'src/components/combobox';
import { useDialog } from 'src/components/game-dialog/gameDialog';

// auth
import { useAuthContext } from 'src/auth/hooks';

import { format_sender } from './utils/text_formatting';
// import getVariant from './get-variant';

// ----------------------------------------------------------------------

export function MailItemV2({
  mail,
  selected,
  selectedLabelId,
  onClickMail,
  threadMail,
  style,
  openDetail,
  tagMapping,
  mails,
}) {
  const { user } = useAuthContext();
  const { showDialog } = useDialog();

  const CATEGORIES = Object.keys(tagMapping).filter(
    (key) => !tagMapping[key].disable && key !== 'draft'
  );

  const hasAttachments = mails.some((mailT) => mailT.attachmentCount > 0);
  // const isStarred = mail.labelIds.includes('STARRED');

  const [generatedCategory, setGeneratedCategory] = useState(
    threadMail.userCategory || threadMail.generatedCategory
  );

  const [anchorEl] = useState(null);
  // const { toast } = useToast();
  const open = Boolean(anchorEl);

  const handleChange = async (categoryTmp, statusInput) => {
    handleUpdateCategoryAndStatus(categoryTmp, statusInput);
    setGeneratedCategory(categoryTmp);
  };

  const handleUpdateCategoryAndStatus = async (eventCategory, statusInput) => {
    console.log('eventCategory', eventCategory, threadMail);
    console.log('entered', selectedLabelId);
    const response = await updateThreadCategoryAndStatus({
      threadId: threadMail._id,
      category: eventCategory,
      statusInput,
      deletion: statusInput !== selectedLabelId,
      email: user.email,
    });
    console.log(response);
    if (response.userInteractions.badgeName !== '') {
      if (response.userInteractions.type === 'level') {
        console.log('entered');
        showDialog(
          response.userInteractions,
          `level${response.userInteractions.levelNumber}orb.gif`
        );
      }
    }

    if (response.newBadgesUnlocked.length > 0) {
      response.newBadgesUnlocked.forEach((element) => {
        const t = toast(
          <div className="flex flex-col justify-start items-start gap-2">
            {/* Content */}
            <div className="flex flex-row items-center">
              <div style={{ width: '50px' }}>
                <Image
                  src={`/logo/${element.iconImage}`} // Update with your actual image name
                  alt="Badge"
                  width={35}
                  height={35}
                  className="rounded-md"
                />
              </div>
              <b>{element.badgeName}</b>
            </div>

            {/* Message and Close Button */}
            <div>{element.toastMessage} </div>
            <button
              type="button"
              className="absolute text-[hsl(var(--primary))] hover:scale-105 top-2 right-2"
              onClick={() => toast.dismiss(t)} // Dismiss the specific toast
            >
              <Iconify icon="basil:cross-outline" />
            </button>
          </div>,
          {
            duration: 10000,
          }
        );
      });
    }
  };

  const adjustedStyle = {
    ...style,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '5px',
    padding: '5px',
    cursor: 'pointer',
    backgroundColor: selected ? 'hsl(var(--hover-list))' : 'rgba(22, 22, 32, 0)', // Use rgba values
  };

  const handleSetAsRead = () => {
    postUpdateMailRead({ id: mail.messageId, readbool: 'false' });
  };

  const handleSetStatus = async (statusInput) => {
    const response = await updateThreadStatus({
      threadId: threadMail._id,
      statusInput,
      email: user.email,
    });

    console.log('response', response);

    if (response.userInteractions.badgeName !== '') {
      if (response.userInteractions.type === 'level') {
        console.log('entered');
        showDialog(
          response.userInteractions,
          `level${response.userInteractions.levelNumber}orb.gif`
        );
      }
    }

    // if (response.userInteractions.length > 0) {
    //   response.userInteractions.forEach((element) => {
    //     if (element.type === 'toast') {
    //       toast(element.toastMessage, {
    //         duration: 10000,
    //         // description: 'Sunday, December 03, 2023 at 9:00 AM',
    //         action: {
    //           label: 'Undo',
    //           onClick: () => console.log('Undo'),
    //         },
    //       });
    //     }
    //   });

    //   if (response.userInteractions.some((element) => element.type === 'level')) {
    //     showDialog(response.userInteractions, 'level1orb.gif');
    //   }
    // }

    if (response.newBadgesUnlocked.length > 0) {
      response.newBadgesUnlocked.forEach((element) => {
        const t = toast(
          <div className="flex flex-col justify-start items-start gap-2">
            {/* Content */}
            <div className="flex flex-row items-center">
              <div style={{ width: '50px' }}>
                <Image
                  src={`/logo/${element.iconImage}`} // Update with your actual image name
                  alt="Badge"
                  width={35}
                  height={35}
                  className="rounded-md"
                />
              </div>
              <b>{element.badgeName}</b>
            </div>

            {/* Message and Close Button */}
            <div>{element.toastMessage} </div>
            <button
              type="button"
              className="absolute text-[hsl(var(--primary))] hover:scale-105 top-2 right-2"
              onClick={() => toast.dismiss(t)} // Dismiss the specific toast
            >
              <Iconify icon="basil:cross-outline" />
            </button>
          </div>,
          {
            duration: 10000,
          }
        );
      });
    }
  };

  const handleDeleteThreadMail = () => {
    deleteThreadMail({ threadId: threadMail._id });
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

  const handleUpdateLabel = async (labelToUpdate, add, labelAdded) => {
    console.log(labelToUpdate, add, mail);
    const response = await updateLabel({
      id: mail.messageId,
      labelToUpdate,
      add,
      detail: false,
      labelAdded,
    });
    console.log(response);
    if (response.status === 200 || response.status === 201) {
      console.log('lets go');
    }
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
        onClick={() => {
          if (!open) {
            onClickMail();
          }
        }}
        key={selectedLabelId}
        whileHover={{
          backgroundColor: 'hsl(var(--card))', // Ensure hover state uses rgba format
          cursor: 'pointer',
          color: 'rgb(255, 255, 255)',
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
                <Combobox
                  value={generatedCategory}
                  options={CATEGORIES}
                  handleChange={handleChange}
                  tagMapping={tagMapping}
                />
                {/* {CATEGORIES.includes(category.toLowerCase()) ? (
                    <UnstyledSelectForm
                      value={category}
                      options={CATEGORIES}
                      handleChange={handleChange}
                      tagMapping={tagMapping}
                    />
                  ) : (
                    <Box
                      sx={{
                        textTransform: 'capitalize',
                        fontSize: '0.70rem',
                        borderRadius: '5px',
                        padding: '2px 7px',
                        fontWeight: '900',
                        letterSpacing: '0.6px',
                        cursor: 'pointer',
                        bgcolor: alpha(
                          tagMapping[threadMail.category.toLowerCase()]?.bgcolor || '#FFFFFF',
                          0.3
                        ),
                        color: (theme) =>
                          theme.palette.mode === 'light'
                            ? darken(
                                tagMapping[threadMail.category.toLowerCase()]?.bgcolor || '#FFFFFF',
                                0.8
                              )
                            : lighten(
                                tagMapping[threadMail.category.toLowerCase()]?.bgcolor || '#FFFFFF',
                                0.8
                              ),
                      }}
                    >
                      {tagMapping[threadMail.category.toLowerCase()]?.name ||
                        threadMail.category.toLowerCase()}
                    </Box>
                  )} */}
                {hasAttachments && (
                  <Box>
                    <Iconify icon="mdi:paperclip" width={14} sx={{ color: 'text.primary' }} />
                  </Box>
                )}
                {/* {isStarred && (
                  <Box>
                    <Iconify icon="eva:star-fill" width={14} sx={{ color: 'warning.dark' }} />
                  </Box>
                )} */}
              </Stack>
              {format_sender(mail.from).split('<')[0]}
            </Box>
          </Grid>
          <Grid item xs={openDetail ? 7 : 8}>
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
              {threadMail.lastInboxEmailDate
                ? formatDate(threadMail.lastInboxEmailDate)
                : formatDate(threadMail.emails[threadMail.emails.length - 1].date)}
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
            backgroundColor: 'hsl(var(--card))',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            zIndex: 1,
          }}
        >
          {!mail.labelIds.includes('SENT') && (
            <TooltipProvider delayDuration={0}>
              {threadMail.statusInput !== 'todo' && (
                <TooltipShadcn>
                  <TooltipTrigger asChild>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation(); /* your edit action */
                        handleSetStatus('todo');
                      }}
                    >
                      <Iconify icon="lucide:list-todo" />
                    </IconButton>
                  </TooltipTrigger>
                  <TooltipContent className="z-[2147483647]" side="top" sideOffset={5}>
                    <p>Set As To-Do</p>
                  </TooltipContent>
                </TooltipShadcn>
              )}
              {threadMail.statusInput !== 'done' && (
                <TooltipShadcn>
                  <TooltipTrigger asChild>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation(); /* your edit action */
                        handleSetStatus('done');
                      }}
                    >
                      <Iconify icon="lucide:check-check" />
                    </IconButton>
                  </TooltipTrigger>
                  <TooltipContent className="z-[2147483647]" side="top" sideOffset={5}>
                    <p>Set As Done</p>
                  </TooltipContent>
                </TooltipShadcn>
              )}
              <TooltipShadcn>
                <TooltipTrigger asChild>
                  <Checkbox
                    color="warning"
                    icon={<Iconify icon="material-symbols:label-important-outline" />}
                    checkedIcon={<Iconify icon="material-symbols:label-important-rounded" />}
                    checked={mail.labelIds.includes('IMPORTANT')}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (mail.labelIds.includes('IMPORTANT')) {
                        const newLabelIds = ['IMPORTANT'];
                        handleUpdateLabel(newLabelIds, false, 'IMPORTANT');
                      } else {
                        const newLabelIds = [...mail.labelIds, 'IMPORTANT'];
                        handleUpdateLabel(newLabelIds, true, 'IMPORTANT');
                      }
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent className="z-[2147483647]" side="top" sideOffset={5}>
                  <p>Important</p>
                </TooltipContent>
              </TooltipShadcn>
              {/* <TooltipShadcn>
                <TooltipTrigger asChild>
                  <Checkbox
                    size="small"
                    color="warning"
                    icon={<Iconify icon="eva:star-outline" />}
                    checkedIcon={<Iconify icon="eva:star-fill" />}
                    checked={mail.labelIds.includes('STARRED')}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (mail.labelIds.includes('STARRED')) {
                        const newLabelIds = ['STARRED'];
                        handleUpdateLabel(newLabelIds, false, 'STARRED');
                      } else {
                        const newLabelIds = [...mail.labelIds, 'STARRED'];
                        handleUpdateLabel(newLabelIds, true, 'STARRED');
                      }
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent className="z-[2147483647]" side="top" sideOffset={5}>
                  <p>{mail.labelIds.includes('STARRED') ? 'Unstarred' : 'Starred'}</p>
                </TooltipContent>
              </TooltipShadcn> */}
              <TooltipShadcn>
                <TooltipTrigger asChild>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation(); /* your edit action */
                      handleSetAsRead();
                    }}
                  >
                    <Iconify icon="fluent:mail-unread-20-regular" />
                  </IconButton>
                </TooltipTrigger>
                <TooltipContent className="z-[2147483647]" side="top" sideOffset={5}>
                  <p>Set As Read</p>
                </TooltipContent>
              </TooltipShadcn>{' '}
            </TooltipProvider>
          )}
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation(); /* your delete action */
              handleDeleteThreadMail();
            }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
          </IconButton>
        </Box>
      </m.div>
    </Box>
  );
}

MailItemV2.propTypes = {
  mail: PropTypes.object,
  onClickMail: PropTypes.func,
  selected: PropTypes.bool,
  selectedLabelId: PropTypes.string,
  threadMail: PropTypes.object,
  style: PropTypes.object,
  openDetail: PropTypes.bool,
  tagMapping: PropTypes.object,
  mails: PropTypes.array,
};
