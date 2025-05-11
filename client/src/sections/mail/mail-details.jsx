'use client';

import { findLast } from 'lodash';
import PropTypes from 'prop-types';
import * as cheerio from 'cheerio';
import { jellyTriangle } from 'ldrs';
import { useRef, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
// @mui
import { alpha, darken, lighten } from '@mui/material/styles';

// hooks
import { useBoolean } from 'src/hooks/use-boolean';

// utils
import { fDateTime } from 'src/utils/format-time';
import { extractEmail, extractResponseEmails } from 'src/utils/text_utils';

// shadcn
// import { useToast } from 'src/s/hooks/use-toast.ts';
import { toast } from 'sonner';

import { Separator } from 'src/s/components/ui/separator.tsx';
import { Button as ButtonShadcn } from 'src/s/components/ui/button.tsx';
import {
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
  Tooltip as TooltipShadcn,
} from 'src/s/components/ui/tooltip.tsx';
import {
  updateLabel,
  deleteThreadMail,
  postSendMailAnswer,
  getAttachmentsDownloads,
  updateThreadCategoryAndStatus,
} from 'src/api/mail';

// components
import { Label } from 'src/components/label';
import Markdown from 'src/components/markdown';
import { Iconify } from 'src/components/iconify';
import { Combobox } from 'src/components/combobox';
import { Scrollbar } from 'src/components/scrollbar';
import { useSnackbar } from 'src/components/snackbar';
import TextMaxLine from 'src/components/text-max-line';
import EmptyContent from 'src/components/empty-content';
import FileThumbnail from 'src/components/file-thumbnail';
import EmailAutoComplete from 'src/components/autocomplete';
import { Editor as EditorTipTap } from 'src/components/editortiptap/';
import { Email } from 'src/components/email';
import CalendarEvent from 'src/components/calendar-event';

// auth
import { useAuthContext } from 'src/auth/hooks';

import { MailDetailsFeed } from './mail-details-feed';
import { format_sender } from './utils/text_formatting';

jellyTriangle.register('jt-icon');

// ----------------------------------------------------------------------

export function MailDetails({
  mail,
  setOpenDetail,
  tagMapping,
  contacts,
  threadCategory,
  threadSummary,
  setForwardEmails,
  jwtToken,
  threadMail,
}) {
  const { user } = useAuthContext();

  const { toGlobalEmails, ccGlobalEmails, bccGlobalEmails } = extractResponseEmails(mail, user);
  const mailDetail = mail !== undefined ? mail[mail.length - 1] : '';
  const showAttachments = useBoolean(false);
  const [to, setTo] = useState(toGlobalEmails || []);
  const [cc, setCc] = useState(ccGlobalEmails || []);
  const [bcc, setBcc] = useState(bccGlobalEmails || []);
  const [answer, setAnswer] = useState(mailDetail?.chatgptprop ? mailDetail.chatgptprop : '');
  const [contentData, setContentData] = useState('');
  const [sendAnswerLoading, setSendAnswerLoading] = useState(false);
  const [generateAiLoading] = useState(false);
  const [showResp, setShowResp] = useState(false);
  const [category, setCategory] = useState(
    threadMail?.userCategory || threadMail?.generatedCategory || mailDetail?.category
  );
  const [mailState, setMailState] = useState(mail !== undefined && mail !== null ? mail : []);
  const [replyMode, setReplyMode] = useState('');
  const [attachments, setAttachments] = useState([]);

  // Calendar Events
  const [calendarEvent, setCalendarEvent] = useState(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(false);
  const [eventError, setEventError] = useState(null);

  const scrollRef = useRef(null);

  useEffect(() => {
    setAnswer(mailDetail?.chatgptprop ? mailDetail.chatgptprop : '');
    setCategory(threadMail?.userCategory || threadMail?.generatedCategory || mailDetail?.category);
    setMailState(mail);

    if (mail.length > 1) {
      scrollToBottom();
    }
  }, [mail, mailDetail, threadMail]);

  // calendar events useEffect
  // Effect to fetch calendar event when mail changes
  useEffect(() => {
    // Function to fetch calendar event data
    const fetchCalendarEvent = async () => {
      // Check if mail array exists and has at least one item
      if (!mail || !Array.isArray(mail) || mail.length === 0) {
        return;
      }

      const firstEmail = mail[0];
      console.log('firstEmail', firstEmail);
      // Check if it's a calendar invitation and has an eventId
      if (firstEmail.isGoogleInvitation && firstEmail.eventId) {
        setIsLoadingEvent(true);
        setEventError(null);
        console.log('Fetching calendar event for eventId:', firstEmail.eventId);
        try {
          // Make API call to your backend endpoint
          const response = await axios.get(
            `http://localhost:8080/api/calendar/${firstEmail.eventId}`
          );

          setCalendarEvent(response.data);
        } catch (error) {
          console.error('Error fetching calendar event:', error);
          setEventError(error.message || 'Failed to load calendar event');
        } finally {
          setIsLoadingEvent(false);
        }
      }
    };

    fetchCalendarEvent();
  }, [mail]);

  const handleChangeContent = (value) => {
    setContentData(value);
    setAnswer(value);
  };

  const handleSubmitAnswer = async () => {
    setSendAnswerLoading(true);

    const cleanedHtml = answer.replace(/<p><br><\/p>/g, '');

    const resp = await postSendMailAnswer({
      to,
      cc,
      bcc,
      message: cleanedHtml,
      _id: mailDetail.messageId,
      user,
      threadId: mailDetail.threadId,
      email: mail,
      attachments,
    });

    const emailToAdd = {
      to: resp.data.emailToReturn.to,
      cc: resp.data.emailToReturn.cc,
      from: resp.data.emailToReturn.from,
      subject: mailDetail.subject,
      message: cleanedHtml,
      html: answer,
      text: answer,
    };

    setSendAnswerLoading(false);
    setMailState((prevMailState) => [...prevMailState, emailToAdd]);
    setAnswer('');
    setAttachments([]);
    setShowResp(false);
    setReplyMode('');

    if (resp.status === 200 || resp.status === 201) {
      // enqueueSnackbar('Answer sent successfully!', { variant: 'success' });
      toast.success('Answer sent successfully', {
        duration: 2000,
        action: {
          label: 'Undo',
          onClick: () => console.log('Undo'),
        },
      });
    } else {
      // enqueueSnackbar('An error occured!', { variant: 'error' });
      toast.error('An error occured', {
        duration: 2000,
        action: {
          label: 'Undo',
          onClick: () => console.log('Undo'),
        },
      });
    }
  };

  function extractNewContent(html) {
    const $ = cheerio.load(html);

    // Remove blockquote elements from the HTML
    const blockquotes = $('blockquote');

    // Iterate over each blockquote
    blockquotes.each((index, blockquote) => {
      // Get the previous sibling of blockquote
      const prevSibling = $(blockquote).prev();

      // Remove the previous sibling (the div before blockquote)
      prevSibling.remove();

      // Remove the blockquote element
      $(blockquote).remove();
    });

    // Get the remaining HTML content
    return $.html();
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    Promise.all(files.map(fileToBase64)).then((encodedFiles) => {
      setAttachments((prevAttachments) => [...prevAttachments, ...encodedFiles]);
    });
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () =>
        resolve({
          filename: file.name,
          content: reader.result.split(',')[1],
          mimeType: file.type,
        });
      reader.onerror = (error) => reject(error);
    });

  const handleChange = async (categoryTmp, statusInput) => {
    handleUpdateCategoryAndStatus(categoryTmp, statusInput);
    setCategory(categoryTmp);
  };

  const handleUpdateCategoryAndStatus = async (eventCategory, statusInput) => {
    const response = await updateThreadCategoryAndStatus({
      threadId: threadMail._id,
      category: eventCategory,
      statusInput,
      deletion: false,
      email: user?.email,
    });

    if (response.userInteractions.length > 0) {
      response.userInteractions.forEach((element) => {
        toast(element.toastMessage, {
          duration: 10000,
          action: {
            label: 'Undo',
            onClick: () => console.log('Undo'),
          },
        });
      });
    }
  };

  const resetState = () => {
    setShowResp(false);
    setReplyMode('');
  };

  const handleReplyAll = useCallback(() => {
    if (!showResp || (showResp && replyMode === 'reply')) {
      setShowResp(true);
      setTo(toGlobalEmails);
      setCc(ccGlobalEmails);
      setBcc(bccGlobalEmails);
      setReplyMode('replyAll');
    } else {
      resetState();
    }
  }, [showResp, toGlobalEmails, ccGlobalEmails, bccGlobalEmails, replyMode]);

  const handleReply = useCallback(() => {
    if (!showResp || (showResp && replyMode === 'replyAll')) {
      const lastFromNotUser = findLast(mail, (m) => m.from !== user.email);
      setShowResp(true);
      setTo(lastFromNotUser ? [extractEmail(lastFromNotUser.from)] : []);
      setCc([]);
      setBcc([]);
      setReplyMode('reply');
    } else {
      resetState();
    }
  }, [showResp, replyMode, mail, user.email]);

  const handleForward = () => {
    setForwardEmails(mailDetail.threadId);
  };

  const handleDownload = async (attachment, mailItem) => {
    const mailId = mailItem._id;
    const { filename } = attachment;
    const resp = await getAttachmentsDownloads({ mailId, filename });

    if (resp && resp.data) {
      const url = window.URL.createObjectURL(resp.data);

      // Create a temporary link element and click it to trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } else {
      console.error('No data received');
    }
  };

  const handleAutoCompleteChange = (newValue) => {
    // This function can handle the changes in the selected values from the autocomplete
    setTo(newValue);
  };

  const handleAutoCompleteChangeCc = (newValue) => {
    // This function can handle the changes in the selected values from the autocomplete
    setCc(newValue);
  };

  const handleAutoCompleteChangeBcc = (newValue) => {
    // This function can handle the changes in the selected values from the autocomplete
    setBcc(newValue);
  };

  const removeAttachmentByIndex = (index) => {
    setAttachments((prevAttachments) => {
      const newAttachments = [...prevAttachments];
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  };

  const handleUpdateLabel = async (labelToUpdate, add, labelAdded) => {
    const response = await updateLabel({
      id: mailDetail.messageId,
      labelToUpdate,
      add,
      detail: true,
      labelAdded,
    });
    if (response.status === 200 || response.status === 201) {
      console.log('lets go');
    }
  };

  const handleDeleteThreadMail = () => {
    deleteThreadMail({ threadId: mailDetail.threadId });
    setOpenDetail(false);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth', // Smooth scroll
        });
      }, 100); // Adjust delay if needed
    }
  };

  const CATEGORIES = Object.keys(tagMapping).filter(
    (key) => !tagMapping[key].disable && key !== 'draft'
  );

  if (!mailDetail) {
    return (
      <EmptyContent
        title="No Conversation Selected"
        description="Select a conversation to read"
        imgUrl="/assets/icons/empty/ic_email_selected.svg"
        sx={{
          borderRadius: 1.5,
          bgcolor: 'background.default',
        }}
      />
    );
  }

  const renderHead = (
    <Stack direction="row" alignItems="center" flexShrink={0} sx={{ height: 56, pl: 0, pr: 1 }}>
      <Stack direction="row" spacing={1} flexGrow={1} sx={{ alignItems: 'center' }}>
        <Box>
          <Tooltip title="Close Details">
            <IconButton onClick={() => setOpenDetail(false)}>
              <Iconify icon="iconoir:fast-arrow-right" />
            </IconButton>
          </Tooltip>
        </Box>
        {category && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            <>
              {CATEGORIES.includes(category.toLowerCase()) ? (
                <Combobox
                  value={category}
                  options={CATEGORIES}
                  handleChange={handleChange}
                  tagMapping={tagMapping}
                  suggestion={threadCategory}
                />
              ) : (
                <Label
                  key={mailDetail._id}
                  sx={{
                    padding: '2px 7px',
                    fontWeight: '900',
                    letterSpacing: '0.6px',
                    // color: tagMapping[msg.toLowerCase()].color
                    bgcolor: alpha(tagMapping[category?.toLowerCase()]?.bgcolor, 0.3),
                    color: (theme) =>
                      theme.palette.mode === 'light'
                        ? darken(tagMapping[category?.toLowerCase()]?.bgcolor, 0.8)
                        : lighten(tagMapping[category?.toLowerCase()]?.bgcolor, 0.8),
                  }}
                >
                  {tagMapping[category.toLowerCase()].name}
                </Label>
              )}
            </>
          </Box>
        )}
      </Stack>

      <Stack direction="row" alignItems="center">
        <Tooltip
          title={mailDetail.labelIds.includes('STARRED') ? 'Unstarred' : 'Starred'}
          slotProps={{
            popper: {
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: [0, -14],
                  },
                },
              ],
            },
          }}
        >
          <Checkbox
            color="warning"
            icon={<Iconify icon="eva:star-outline" />}
            checkedIcon={<Iconify icon="eva:star-fill" />}
            checked={mailDetail.labelIds.includes('STARRED')}
            onClick={() => {
              if (mailDetail.labelIds.includes('STARRED')) {
                const newLabelIds = ['STARRED'];
                handleUpdateLabel(newLabelIds, false, 'STARRED');
              } else {
                const newLabelIds = [...mailDetail.labelIds, 'STARRED'];
                handleUpdateLabel(newLabelIds, true, 'STARRED');
              }
            }}
          />
        </Tooltip>
        <Tooltip
          title="Important"
          slotProps={{
            popper: {
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: [0, -14],
                  },
                },
              ],
            },
          }}
        >
          <Checkbox
            color="warning"
            icon={<Iconify icon="material-symbols:label-important-outline" />}
            checkedIcon={<Iconify icon="material-symbols:label-important-rounded" />}
            checked={mailDetail.labelIds.includes('IMPORTANT')}
            onClick={(e) => {
              e.stopPropagation();
              if (mailDetail.labelIds.includes('IMPORTANT')) {
                const newLabelIds = ['IMPORTANT'];
                handleUpdateLabel(newLabelIds, false, 'IMPORTANT');
              } else {
                const newLabelIds = [...mailDetail.labelIds, 'IMPORTANT'];
                handleUpdateLabel(newLabelIds, true, 'IMPORTANT');
              }
            }}
          />
        </Tooltip>

        <Tooltip title="Delete">
          <IconButton
            onClick={(e) => {
              e.stopPropagation(); /* your delete action */
              handleDeleteThreadMail();
            }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  );

  const renderSubject = (
    <Stack direction="column">
      <Stack spacing={2} direction="row" flexShrink={0} sx={{ pt: 1, pb: 0.5, pl: 1 }}>
        <TextMaxLine variant="subtitle2" sx={{ flexGrow: 1 }}>
          {mailDetail.subject}
        </TextMaxLine>

        <Stack spacing={0.5}>
          <Stack direction="row" alignItems="center" justifyContent="flex-end">
            <Tooltip title="Reply">
              <IconButton size="small">
                <Iconify width={18} icon="solar:reply-bold" onClick={handleReply} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Reply All">
              <IconButton size="small">
                <Iconify
                  width={18}
                  icon="solar:multiple-forward-left-broken"
                  onClick={handleReplyAll}
                />
              </IconButton>
            </Tooltip>
            <Tooltip title="Forward">
              <IconButton size="small" onClick={handleForward}>
                <Iconify width={18} icon="solar:forward-bold" />
              </IconButton>
            </Tooltip>
            <Typography variant="caption" noWrap sx={{ color: 'text.disabled' }}>
              {fDateTime(mailDetail.date)}
            </Typography>
          </Stack>
        </Stack>
      </Stack>
      {threadSummary && (
        <Stack direction="row" alignItems="center" sx={{ mb: 1, ml: 1 }} spacing={0.5}>
          <Box
            sx={{
              color: (theme) =>
                theme.palette.mode === 'light'
                  ? theme.palette.melify.darker
                  : theme.palette.melify.main,
            }}
          >
            <Iconify width={18} icon="wi:stars" />
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {threadSummary}
          </Typography>
        </Stack>
      )}
      {mailDetail.summary && !threadSummary && (
        <Stack direction="row" alignItems="center" sx={{ mb: 1, ml: 1 }} spacing={0.5}>
          <Box
            sx={{
              color: (theme) =>
                theme.palette.mode === 'light'
                  ? theme.palette.melify.darker
                  : theme.palette.melify.main,
            }}
          >
            <Iconify width={18} icon="mdi:magic" />
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {mailDetail.summary}
          </Typography>
        </Stack>
      )}
    </Stack>
  );

  const renderAttachments = (
    <Stack
      spacing={1}
      sx={{
        p: 1,
        borderRadius: 1,
        bgcolor: 'hsl(var(--black-background))',
        mt: 1,
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <ButtonBase
          onClick={showAttachments.onToggle}
          sx={{
            color: 'text.secondary',
            typography: 'caption',
            borderRadius: 0.5,
          }}
        >
          <Iconify icon="eva:attach-2-fill" sx={{ mr: 0.5 }} />
          {mail.reduce((total, mailItem) => total + (mailItem.attachments?.length || 0), 0)}{' '}
          attachments{' '}
          <Iconify
            icon={
              showAttachments.value ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'
            }
            width={16}
            sx={{ ml: 0.5 }}
          />
        </ButtonBase>
      </Stack>

      <Collapse in={showAttachments.value} unmountOnExit timeout="auto">
        <Stack direction="row" flexWrap="wrap" spacing={1}>
          {mail.map((mailItem, mailIndex) =>
            mailItem.attachments?.map((attachment, attachmentIndex) => (
              <Stack
                key={`${mailIndex}-${attachmentIndex}`}
                alignItems="center"
                justifyContent="center"
                sx={{
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  borderRadius: 1,
                  overflow: 'hidden',
                  position: 'relative',
                  backgroundColor: 'hsl(var(--black-background))',
                }}
              >
                <FileThumbnail
                  tooltip
                  imageView
                  file={attachment}
                  onDownload={() => handleDownload(attachment, mailItem)}
                  sx={{ width: 24, height: 24 }}
                />
              </Stack>
            ))
          )}
        </Stack>
      </Collapse>
    </Stack>
  );

  const renderContent = (
    <Box sx={{ py: 2, overflow: 'hidden', flexGrow: 1 }}>
      {mailState?.map((mailD) => {
        const isUserEmail = mailD.to.includes(user.email);
        return (
          <>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignItems: isUserEmail ? 'flex-start' : 'flex-end',
                py: '10px',
              }}
            >
              <Box
                sx={{
                  overflow: 'hidden',
                  flexGrow: 1,
                  textAlign: 'left',
                  width: mailState.length === 1 ? '100%' : '90%',
                  // backgroundColor: 'grey.300',
                  backgroundColor: 'hsl(var(--black-background))',
                  borderRadius: '10px',
                  py: 0,
                }}
              >
                <Box>
                  <Stack
                    flexShrink={0}
                    direction="row"
                    alignItems="center"
                    textAlign="left"
                    sx={{
                      p: (theme) => theme.spacing(2, 2, 1, 2),
                    }}
                  >
                    {/* <Avatar alt={mailD.from.name} src={`${mailD.from.avatarUrl}`} sx={{ mr: 2 }}>
                        {format_sender(mailD.from).charAt(0).toUpperCase()}
                      </Avatar> */}
                    <ListItemText
                      primary={
                        <TextMaxLine
                          component="span"
                          sx={{
                            typography: 'body2',
                            color: 'text.disabled',
                            fontWeight: '700',
                            fontSize: '12px',
                          }}
                        >
                          {`From: ${format_sender(mailD.from)}`}
                        </TextMaxLine>
                      }
                      secondary={
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            color: 'text.disabled',
                          }}
                        >
                          <TextMaxLine sx={{ fontSize: '11px', fontWeight: '600' }}>
                            {`To: `}
                            {/* eslint-disable-next-line no-nested-ternary */}
                            {mailD.to && mailD.to}
                          </TextMaxLine>
                          {mailD.cc && (
                            <TextMaxLine sx={{ fontSize: '10px' }}>
                              {`Cc: `}
                              {mailD.cc && mailD.cc}
                            </TextMaxLine>
                          )}
                          {mailD.bcc && mailD.labelIds.includes('SENT') ? (
                            <TextMaxLine sx={{ fontSize: '10px' }}>
                              {`Bcc: `}
                              {mailD.bcc && mailD.bcc}
                            </TextMaxLine>
                          ) : null}
                        </Box>
                      }
                    />
                    <Box>
                      <Typography
                        variant="caption"
                        noWrap
                        sx={{ color: 'text.disabled', fontSize: '10px' }}
                      >
                        {fDateTime(mailD.date)}
                      </Typography>
                    </Box>
                  </Stack>
                  <Divider />
                  <div>
                    <Email
                      forwarding={false}
                      height={200}
                      body={mailD.html !== '' ? extractNewContent(mailD.html) : mailD.text}
                    />
                  </div>
                </Box>
              </Box>
            </Box>
          </>
        );
      })}
    </Box>
  );

  const renderLoading = <jt-icon color="hsl(var(--background))" size="15" />;

  const renderEditor = (
    <Stack
      spacing={0}
      sx={{
        p: (theme) => theme.spacing(0, 0, 1, 0),
        // height: '25vh',
        // minHeight: '200px',
      }}
    >
      <Box
        sx={{
          borderTop: 'solid 1px rgba(145, 158, 171, 0.08)',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <EmailAutoComplete
            contacts={contacts}
            onAutoCompleteChange={handleAutoCompleteChange}
            onAutoCompleteChangeCc={handleAutoCompleteChangeCc}
            onAutoCompleteChangeBcc={handleAutoCompleteChangeBcc}
            to={to}
            cc={cc}
            bcc={bcc}
          />
        </Box>
        <Tooltip title="Close">
          <IconButton onClick={resetState}>
            <Iconify color="rgba(255, 255, 255, 0.65)" icon="material-symbols:close" />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ py: 1 }}>
        <EditorTipTap
          content={contentData}
          handleChangeContent={handleChangeContent}
          jwtToken={jwtToken}
        />
      </Box>

      <Stack direction="row" alignItems="center" sx={{ marginTop: 1 }}>
        <Stack direction="row" alignItems="center" flexGrow={1}>
          <IconButton component="label" role={undefined}>
            <Iconify icon="eva:attach-2-fill" />
            <input type="file" multiple style={{ display: 'none' }} onChange={handleFileChange} />
          </IconButton>
        </Stack>

        <TooltipProvider delayDuration={0}>
          <TooltipShadcn>
            <TooltipTrigger asChild>
              <ButtonShadcn
                className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--accent))] w-14 rounded"
                variant="ghost"
                size="icon"
                onClick={handleSubmitAnswer}
                disabled={sendAnswerLoading || generateAiLoading}
              >
                {' '}
                {sendAnswerLoading || generateAiLoading ? (
                  renderLoading
                ) : (
                  <Iconify icon="iconamoon:send-fill" />
                )}
              </ButtonShadcn>
            </TooltipTrigger>
            <TooltipContent className="z-[2147483647]">
              <p>Send</p>
            </TooltipContent>
          </TooltipShadcn>
        </TooltipProvider>
      </Stack>
    </Stack>
  );

  const renderCalendarInvitation = (
    <CalendarEvent calendarEvent={calendarEvent} setCalendarEvent={setCalendarEvent} mail={mail} />
  );

  const renderFeed = (
    <>
      {mailDetail.feed?.map((feedEl, index) => (
        <>
          <Divider sx={{ borderStyle: 'dashed' }} />
          <MailDetailsFeed feed={feedEl} mail={mailDetail} side={index % 2 ? 'left' : 'right'} />
        </>
      ))}
    </>
  );

  return (
    <Box
      sx={{
        position: 'absolute',
        background: 'hsl(var(--background))',
        right: 0,
        top: 0,
        width: '50%',
        height: '100%', // Ensure it takes the full height of the parent
        overflow: 'hidden', // Prevent overflow outside the box
        boxShadow: 'rgba(0, 0, 0, 0.5) 0px 8px 24px',
      }}
    >
      <Box
        flexGrow={1}
        sx={{
          width: 1,
          minWidth: 0,
          borderRadius: 0,
          paddingLeft: '15px',
          paddingRight: '15px',
          // bgcolor: 'background.default',
          background: 'hsl(var(--background))',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          borderLeft: (theme) =>
            theme.palette.mode === 'light'
              ? '1px solid rgba(0, 0, 0, 0.1)'
              : '1px solid rgba(255, 255, 255, 0.1)',
          // backgroundColor: 'green',
        }}
      >
        {renderHead}

        <Divider sx={{ borderStyle: 'dashed' }} />

        {renderSubject}

        <Divider sx={{ borderStyle: 'dashed' }} />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '80%',
            flexGrow: 1,
          }}
        >
          {mail.some((mailItem) => mailItem.attachments?.length > 0) && (
            <Stack sx={{ px: 0, position: 'sticky', p: 0 }}>{renderAttachments}</Stack>
          )}
          {mail.some((mailItem) => mailItem.isGoogleInvitation == true) && renderCalendarInvitation}
          <Scrollbar sx={{ flex: 1 }} ref={scrollRef}>
            {renderContent}

            {mailDetail.feed ? renderFeed : null}
          </Scrollbar>

          <Stack
            sx={{
              position: 'relative',
              bgcolor: (theme) => (theme.palette.mode === 'light' ? 'transparent' : 'transparent'),
              display: showResp ? 'block' : 'none',
            }}
          >
            {attachments.length > 0 && (
              <Stack direction="row" alignItems="center" spacing={1}>
                {attachments.map((attachment, index) => (
                  <FileThumbnail
                    tooltip
                    imageView
                    file={attachment}
                    // onDownload={() => handleDownload(attachment)}
                    sx={{ width: 24, height: 24 }}
                    htmlTitle={
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: '2px',
                        }}
                      >
                        <div
                          style={{
                            maxWidth: '150px',
                            fontSize: '9px',
                            color: 'text.disabled',
                          }}
                        >
                          {attachment.filename}
                        </div>
                        <div>
                          <IconButton onClick={() => removeAttachmentByIndex(index)}>
                            <Iconify icon="mdi:garbage-can-outline" />
                          </IconButton>
                        </div>
                      </div>
                    }
                  />
                ))}
              </Stack>
            )}

            {renderEditor}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

MailDetails.propTypes = {
  mail: PropTypes.array,
  setOpenDetail: PropTypes.func,
  tagMapping: PropTypes.object,
  contacts: PropTypes.array,
  threadCategory: PropTypes.string,
  threadSummary: PropTypes.string,
  setForwardEmails: PropTypes.func,
  threadMail: PropTypes.object,
};
