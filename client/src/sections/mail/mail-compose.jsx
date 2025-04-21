'use client';

import PropTypes from 'prop-types';
import { jellyTriangle } from 'ldrs';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Portal from '@mui/material/Portal';
// @mui
import { alpha } from '@mui/material/styles';
import Backdrop from '@mui/material/Backdrop';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

// hooks
import { useResponsive } from 'src/hooks/use-responsive';

import { extractSingleEmail } from 'src/utils/mail';

import { forward, postSendMail } from 'src/api/mail';
import { createDraft, updateDraft, deleteDraft } from 'src/api/drafts';
// shadcn
import { toast } from 'sonner';

import { Button as ButtonShadcn } from 'src/s/components/ui/button.tsx';
import {
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
  Tooltip as TooltipShadcn,
} from 'src/s/components/ui/tooltip.tsx';

import DeleteDialog from 'src/components/dialog';
// components
import { Iconify } from 'src/components/iconify';
import Accordion from 'src/components/accordion';
import { Scrollbar } from 'src/components/scrollbar';
import { useSnackbar } from 'src/components/snackbar';
import FileThumbnail from 'src/components/file-thumbnail';
import EmailAutoComplete from 'src/components/autocomplete';
import { Editor as EditorTipTap } from 'src/components/editortiptap/';

// auth
import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------
jellyTriangle.register('jt-icon');

const ZINDEX = 1000;

const POSITION = 24;

const getAttachments = (data) => {
  let attachmentsArr = [];

  // Iterate through each object in the array
  data.forEach((item) => {
    // Check if the 'attachments' field exists and is not empty
    if (item.attachments && item.attachments.length > 0) {
      attachmentsArr = attachmentsArr.concat(item.attachments); // Add all attachments
    }
  });

  return attachmentsArr;
};

export function MailCompose({
  onCloseCompose,
  contacts,
  forwardEmails = [],
  removeEmail,
  reinitForwardEmail,
  threadSummary,
  draftEmail,
  draftId,
  setDraftId,
  jwtToken,
}) {
  const smUp = useResponsive('up', 'sm');

  const [openDialog, setOpenDialog] = useState(false);

  const [message, setMessage] = useState(draftEmail ? draftEmail.html : '');

  const [contentData, setContentData] = useState(draftEmail ? draftEmail.html : null);

  const [subject, setSubject] = useState('initialSubject');
  const [to, setTo] = useState([]);
  const [cc, setCc] = useState([]);
  const [bcc, setBcc] = useState([]);
  const [sendMailLoading, setSendMailLoading] = useState(false);

  const [attachments, setAttachments] = useState([]);
  // forward
  const [expanded, setExpanded] = useState(false);
  const [forwardExpanded, setForwardExpanded] = useState(false);
  const [isSummaryPresent, setIsSummaryPresent] = useState(true);

  const [timeoutId, setTimeoutId] = useState(null);

  const [minimized, setMinimized] = useState(false);
  const [fullScreen] = useState(false);

  const toggleMinimize = () => setMinimized(!minimized);

  const { user } = useAuthContext();

  const { enqueueSnackbar } = useSnackbar();

  // Custom delay function to ensure only the last call is executed
  const delayFunction = (callback, delay) => {
    if (timeoutId) {
      clearTimeout(timeoutId); // Clear any existing timeout
    }

    const newTimeoutId = setTimeout(() => {
      callback(); // Execute the callback after the delay
    }, delay);

    setTimeoutId(newTimeoutId); // Save the new timeout ID
  };

  useEffect(() => {
    let initialSubject = '';

    if (draftEmail && draftEmail.subject) {
      initialSubject = draftEmail.subject;
      setContentData(draftEmail.html);
      setMessage(draftEmail.html);
      setTo(extractSingleEmail(draftEmail.to));

      setAttachments(draftEmail.attachments || []); // Set attachments from draft
    } else if (forwardEmails.length > 0) {
      initialSubject = `Fwd: ${forwardEmails[0].subject}`;

      setAttachments(getAttachments(forwardEmails)); // Set attachments from forward emails
    }
    setSubject(initialSubject);
  }, [draftEmail, forwardEmails]);

  const handleChangeContent = (value) => {
    setContentData(value);
    setMessage(value);
  };

  // Normal function to save draft
  const saveDraft = async () => {
    try {
      console.log('entered in saveDraft');
      const draftContent = {
        message: message || '',
        subject,
        to,
        cc,
        bcc,
        attachments,
      };
      console.log('draftId: ', draftId);
      if (draftId) {
        console.log('entered in updateDraft');
        // Update existing draft
        const response = await updateDraft({ draftId, draftData: draftContent });
        console.log(response);
        // enqueueSnackbar('Draft Saved', { variant: 'info' });
        toast.success('Draft Saved', {
          duration: 2000,
          action: {
            label: 'Undo',
            onClick: () => console.log('Undo'),
          },
        });
      } else {
        console.log('entered in create draft');
        // Create a new draft
        const response = await createDraft({ draftData: draftContent });
        console.log(response);
        setDraftId(response.id); // Save the draft ID for future updates
      }
    } catch (error) {
      toast.error('Failed to save draft', {
        duration: 2000,
        action: {
          label: 'Undo',
          onClick: () => console.log('Undo'),
        },
      });
    }
  };

  // Trigger the draft-saving functionality with the delay
  useEffect(() => {
    if (!user || !to.length || !subject) return;

    const draftContent = {
      message,
      subject,
      to,
      cc,
      bcc,
      attachments,
    };

    delayFunction(() => saveDraft(draftContent), 1000); // Call the delayed function

    // Cleanup timeout when component unmounts or dependencies change
    // eslint-disable-next-line
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    // eslint-disable-next-line
  }, [message, subject, to, cc, bcc, attachments, draftId, user, enqueueSnackbar]);

  const handleChangeSubject = useCallback((value) => {
    setSubject(value.target.value);
  }, []);

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

  const handleCloseDeleteDialog = () => {
    setOpenDialog(false);
  };

  const removeAttachmentByIndex = (index) => {
    setAttachments((prevAttachments) => {
      const newAttachments = [...prevAttachments];
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  };

  const handleSubmitMail = async () => {
    if (subject === '' || to.length === 0) {
      // enqueueSnackbar('Some field are missing', { variant: 'warning' });
      toast.warning('Some field are missing', {
        duration: 2000,
        action: {
          label: 'Undo',
          onClick: () => console.log('Undo'),
        },
      });
      return;
    }

    setSendMailLoading(true);

    // const cleanedHtml = message.replace(/<p><br><\/p>/g, '');

    const resp = await postSendMail({
      message: message || '',
      subject,
      to,
      user,
      cc,
      bcc,
      attachments,
      draftId,
    });

    setSendMailLoading(false);

    onCloseCompose();

    if (resp?.data.message === 'Email sent successfully') {
      // enqueueSnackbar('Mail sent successfully!', { variant: 'success' });
      toast.success('Mail sent successfully', {
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

  const handleForward = async () => {
    console.log(subject, to, message);
    if (subject === '' || to.length === 0) {
      // enqueueSnackbar('Some field are missing', { variant: 'warning' });
      toast.warning('Some field are missing', {
        duration: 2000,
        action: {
          label: 'Undo',
          onClick: () => console.log('Undo'),
        },
      });
      return;
    }

    setSendMailLoading(true);

    console.log('subject', subject);

    const response = await forward({
      deliveredTo: to,
      threadId: forwardEmails[0].threadId,
      forwardEmails,
      user,
      isSummaryPresent,
      attachments,
      message: message || '',
      subject,
      cc,
      bcc,
      draftId,
    });
    console.log('response', response);

    setSendMailLoading(false);

    if (response?.data.message === 'Email sent successfully') {
      // enqueueSnackbar('Mail sent successfully!', { variant: 'success' });
      toast.success('Mail sent successfully', {
        duration: 2000,
        action: {
          label: 'Undo',
          onClick: () => console.log('Undo'),
        },
      });
      onCloseCompose();
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

  const showDialog = async () => {
    if (draftId) {
      console.log('entered in delete');
      setOpenDialog(true);
    } else {
      onCloseCompose();
    }
  };
  const handleDeleteDraft = async () => {
    const response = await deleteDraft({ draftId });
    console.log(response);
    // enqueueSnackbar('Draft deleted successfully!', { variant: 'success' });
    toast.success('Draft deleted successfully', {
      duration: 2000,
      action: {
        label: 'Undo',
        onClick: () => console.log('Undo'),
      },
    });
    onCloseCompose();
  };

  const renderLoading = <jt-icon color="hsl(var(--background))" size="15" />;

  let titleVariant = 'h6';
  let titleContent = 'Compose';

  if (minimized && subject) {
    titleVariant = 'h9';
    titleContent = subject;
  }

  return (
    <Portal>
      {(fullScreen.value || !smUp) && <Backdrop open sx={{ zIndex: ZINDEX }} />}

      <Paper
        sx={{
          left: 0,
          bottom: 0,
          borderRadius: 2,
          display: 'flex',
          position: 'fixed',
          zIndex: ZINDEX + 1,
          m: `${POSITION}px`,
          overflow: 'hidden',
          flexDirection: minimized ? 'row' : 'column',
          width: minimized ? '300px' : '50vw',
          height: minimized ? 60 : 'auto',
          maxHeight: '90vh',
          boxShadow: (theme) => theme.customShadows.dropdown,
          // background: 'black',
          ...(fullScreen.value && {
            m: 0,
            right: POSITION / 2,
            bottom: POSITION / 2,
            width: `calc(100% - ${POSITION}px )`,
            height: `calc(100% - ${POSITION}px - 70px )`,
          }),
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          sx={{
            background: 'hsl(var(--black-background))',
            p: (theme) => theme.spacing(1.5, 1, 1.5, 2),
            width: 1,
          }}
        >
          <Typography
            variant={titleVariant}
            sx={{
              flexGrow: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            noWrap
          >
            {titleContent}
          </Typography>

          <IconButton onClick={toggleMinimize}>
            <Iconify icon={minimized ? 'eva:expand-fill' : 'eva:collapse-fill'} />
          </IconButton>

          {/* <IconButton onClick={fullScreen.onToggle}>
            <Iconify icon={fullScreen ? 'eva:collapse-fill' : 'eva:expand-fill'} />
            </IconButton> */}
          <IconButton onClick={showDialog}>
            <Iconify icon="mdi:trash-outline" />
          </IconButton>
          <IconButton onClick={onCloseCompose}>
            <Iconify icon="mingcute:close-line" />
          </IconButton>
        </Stack>
        {!minimized && (
          <>
            <Box
              sx={{
                background: 'hsl(var(--black-background))',
                // px: 2,
              }}
            >
              <EmailAutoComplete
                contacts={contacts}
                onAutoCompleteChange={handleAutoCompleteChange}
                onAutoCompleteChangeCc={handleAutoCompleteChangeCc}
                onAutoCompleteChangeBcc={handleAutoCompleteChangeBcc}
                to={to}
                cc={cc}
                bcc={bcc}
                paddingLeft={16}
              />
            </Box>
            <InputBase
              onChange={handleChangeSubject}
              value={subject}
              placeholder="Subject"
              sx={{
                px: 2,
                height: 48,
                borderBottom: (theme) => `solid 1px ${alpha(theme.palette.grey[500], 0.08)}`,
                background: 'hsl(var(--black-background))',
              }}
            />
            {attachments.length > 0 && (
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                  px: 2,
                  height: 48,
                  borderBottom: (theme) => `solid 1px ${alpha(theme.palette.grey[500], 0.08)}`,
                  background: 'hsl(var(--black-background))',
                }}
              >
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

            <Stack
              spacing={2}
              flexGrow={1}
              sx={{
                p: 2,
                background: 'hsl(var(--black-background))',
              }}
            >
              {/* <Editor
                height={forwardEmails.length !== 0 ? 100 : 300}
                onChange={handleEditorChange}
                data={editorData}
              /> */}
              <EditorTipTap
                content={contentData}
                handleChangeContent={handleChangeContent}
                jwtToken={jwtToken}
              />
              {draftEmail.length === 0 && forwardEmails.length !== 0 && (
                <Box
                  sx={{
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    p: 1,
                    borderRadius: 1,
                    // height: forwardExpanded && 400,
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ paddingBottom: 1, height: 40 }}
                  >
                    <Box sx={{ fontWeight: 800 }}>Forward Conversation</Box>
                    <Stack direction="row">
                      <IconButton
                        sx={{ borderRadius: 1 }}
                        onClick={() => setForwardExpanded(!forwardExpanded)}
                      >
                        {' '}
                        {forwardExpanded ? (
                          <Iconify icon="ion:chevron-collapse-outline" />
                        ) : (
                          <Iconify icon="ion:chevron-expand-outline" />
                        )}
                      </IconButton>
                      <IconButton onClick={reinitForwardEmail} sx={{ borderRadius: 1 }}>
                        <Iconify icon="mdi:remove" />
                      </IconButton>
                    </Stack>
                  </Stack>
                  {isSummaryPresent && (
                    <Box
                      sx={{
                        background: (theme) => theme.palette.melify.linearForward,
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #827ded',
                        // mx: 10,
                        mb: 1,
                      }}
                    >
                      <Stack direction="column" spacing={0.5}>
                        <Stack
                          sx={{ fontSize: '13px' }}
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Box>AI Forward Summary</Box>
                          <Box>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => setIsSummaryPresent(false)}
                              sx={{
                                color: 'error.main',
                                '&:hover': {
                                  borderColor: 'error.mainRgba',
                                },
                              }}
                            >
                              Remove
                            </Button>
                          </Box>
                        </Stack>
                        <Stack sx={{ fontSize: '11px', ml: 1 }} direction="row" alignItems="center">
                          <Iconify icon="wi:stars" color="melify.main" />
                          {threadSummary}
                        </Stack>
                      </Stack>
                    </Box>
                  )}
                  <Box
                    sx={{
                      // eslint-disable-next-line no-nested-ternary
                      height: forwardExpanded
                        ? 200
                        : // eslint-disable-next-line no-nested-ternary
                          expanded._id
                          ? 200
                          : forwardEmails.length * 50 < 200
                            ? `${forwardEmails.length * 50}px`
                            : 200,
                      // maxHeight: 200,
                      width: '100%',
                    }}
                  >
                    <Scrollbar>
                      {forwardEmails.map((email) => (
                        <Accordion
                          email={email}
                          expanded={expanded}
                          setExpanded={setExpanded}
                          removeEmail={removeEmail}
                        />
                      ))}
                    </Scrollbar>
                  </Box>
                </Box>
              )}

              {/* <Editor
            simple
            id="compose-mail"
            value={message}
            onChange={handleChangeMessage}
            placeholder="Type a mail ..."
            sx={{
              '.ql-editor': { height: '200px' },
              '& .ql-editor': {},
              ...(fullScreen.value && {
                height: 1,
                '& .quill': {
                  height: 1,
                },
                '& .ql-editor': {
                  maxHeight: 'unset',
                },
                '.ql-editor': {
                  height: 1,
                },
              }),
            }}
          /> */}

              <Stack direction="row" alignItems="center">
                <Stack direction="row" alignItems="center" flexGrow={1}>
                  <IconButton component="label" role={undefined}>
                    <Iconify icon="eva:attach-2-fill" />
                    <input
                      type="file"
                      multiple
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                  </IconButton>

                  {/* <IconButton>
                <Iconify icon="eva:attach-2-fill" />
              </IconButton> */}
                </Stack>
                <TooltipProvider delayDuration={0}>
                  <TooltipShadcn>
                    <TooltipTrigger asChild>
                      <ButtonShadcn
                        className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--accent))] w-14 rounded"
                        variant="ghost"
                        size="icon"
                        onClick={forwardEmails.length > 0 ? handleForward : handleSubmitMail}
                        disabled={sendMailLoading}
                      >
                        {' '}
                        {sendMailLoading ? renderLoading : <Iconify icon="iconamoon:send-fill" />}
                      </ButtonShadcn>
                    </TooltipTrigger>
                    <TooltipContent className="z-[2147483647]">
                      <p>Send</p>
                    </TooltipContent>
                  </TooltipShadcn>
                </TooltipProvider>
                {/* <Button
                  disabled={sendMailLoading}
                  variant="contained"
                  sx={{
                    color: 'white',
                    background: 'hsl(var(--black-background))',
                    '&:hover': {
                      background: 'hsl(var(--black-background))',
                      '& .iconify': {
                        color: 'white',
                      },
                    },
                  }}
                  endIcon={!sendMailLoading && <Iconify icon="iconamoon:send-fill" />}
                  onClick={forwardEmails.length > 0 ? handleForward : handleSubmitMail}
                >
                  {sendMailLoading ? renderLoading : 'Send'}
                </Button> */}
              </Stack>
            </Stack>
          </>
        )}
      </Paper>
      <DeleteDialog
        open={openDialog}
        handleClose={handleCloseDeleteDialog}
        handleAction={handleDeleteDraft}
      />
    </Portal>
  );
}

MailCompose.propTypes = {
  onCloseCompose: PropTypes.string,
  contacts: PropTypes.array,
  forwardEmails: PropTypes.array,
  removeEmail: PropTypes.func,
  reinitForwardEmail: PropTypes.func,
  threadSummary: PropTypes.object,
  draftEmail: PropTypes.object,
  draftId: PropTypes.string,
  setDraftId: PropTypes.func,
};
