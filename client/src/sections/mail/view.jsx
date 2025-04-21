'use client';

import axios from 'axios';

import { debounce } from 'lodash';
import { useState, useEffect, useContext, useCallback } from 'react';
import { m, LazyMotion, domAnimation, AnimatePresence } from 'framer-motion';

import Box from '@mui/material/Box';
// @mui
import Stack from '@mui/material/Stack';
import { Skeleton } from '@mui/material';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

// routes
import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
// hooks
import useTagMapping from 'src/hooks/use-tag-mapping';
import { useResponsive } from 'src/hooks/use-responsive';
import useContactsSearch from 'src/hooks/use-contacts-search';

import { EmailFilterContext } from 'src/layouts/dashboard/context/emailProvider';
// shadcn
import {
  ResizablePanel,
  ResizableHandle,
  ResizablePanelGroup,
} from 'src/s/components/ui/resizable.tsx';
// api
import {
  useGetMail,
  useGetMails,
  useGetLabels,
  postUpdateMailRead,
  useGetMailsImportant,
} from 'src/api/mail';

import { Iconify } from 'src/components/iconify';
// components
import AccordionMail from 'src/components/accordion_mail';
import { useSettingsContext } from 'src/components/settings';
import { LoadingScreen } from 'src/components/loading-screen';

import { useAuthContext } from 'src/auth/hooks';

//
import { MailNav } from './mail-nav';
import { MailList } from './mail-list';
import { MailHeader } from './mail-header';
import { MailCompose } from './mail-compose';
import { MailDetails } from './mail-details';
import { MailListDraft } from './mail-draft';

// ----------------------------------------------------------------------

const LABEL_INDEX = 'all';

const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const texts = [
  'To-Do List cleared. Is it productivity or pure joy? You decide.',
  "Congrats! You've cleared your To-Do List. Does this make you a productivity ninja? Probably.",
  'Who knew managing emails could be this satisfying? Apparently, you did.',
];

const randomText = texts[Math.floor(Math.random() * texts.length)];

export function MailView() {
  const [selectedSearch, setSelectedSearch] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [openDetail, setOpenDetail] = useState(false);
  const [forwardEmails, setForwardEmails] = useState([]);
  const [jwtToken, setJwtToken] = useState(null);

  // drafts
  const [draftEmail, setDraftEmail] = useState([]);
  const [draftId, setDraftId] = useState(null); // To track the draft ID

  const router = useRouter();

  const searchParams = useSearchParams();

  const selectedLabelId = searchParams.get('label') || LABEL_INDEX;

  const selectedMailId = searchParams.get('id') || '';

  const upMd = useResponsive('up', 'md');

  const settings = useSettingsContext();

  const { user } = useAuthContext();

  const { filterCriteria, setFilterCriteria } = useContext(EmailFilterContext);

  const { tagMapping, loading } = useTagMapping(user?.email);

  const { contacts, loadingContacts } = useContactsSearch(user?.email);

  const openNav = useBoolean();

  const openMail = useBoolean();

  const openCompose = useBoolean();

  const { labels, labelsLoading } = useGetLabels(user);

  const { mails, mailsLoading, mailsError, mailsEmpty, mutate } = useGetMails(
    selectedLabelId,
    user,
    filterCriteria
  );

  const { mailsImportant, mailsLoadingImportant, mutateImportant } = useGetMailsImportant(
    selectedLabelId,
    user,
    filterCriteria
  );

  const { mail, mailLoading, mailError, mutate: mutateMail } = useGetMail(selectedMailId);

  const handleToggleCompose = useCallback(() => {
    setDraftEmail([]);
    setDraftId(null);
    setForwardEmails([]);
    if (openNav.value) {
      openNav.onFalse();
    }
    openCompose.onToggle();
  }, [openCompose, openNav]);

  const handleClickLabel = useCallback(
    (labelId) => {
      if (!upMd) {
        openNav.onFalse();
      }
      if (labelId) {
        const href =
          labelId !== LABEL_INDEX
            ? `${paths.dashboard.mail}?label=${labelId}`
            : paths.dashboard.mail;
        setFilterCriteria('');
        router.push(href);
      }
      setOpenDetail(false);
    },
    [openNav, router, upMd, setFilterCriteria]
  );

  const handleClickMail = useCallback(
    (mailId) => {
      postUpdateMailRead({ id: mailId, readbool: 'false' });
      // Use mutate to update the specific mail's read status
      mutate(
        (prevData) =>
          prevData.map((mailtmp) =>
            mailtmp._id === mailId
              ? { ...mailtmp, isUnread: false } // Assuming you want to set this mailtmp as read
              : mailtmp
          ),
        false
      );

      setOpenDetail(true);

      if (!upMd) {
        openMail.onFalse();
      }
      const href =
        selectedLabelId !== LABEL_INDEX
          ? `${paths.dashboard.mail}?id=${mailId}&label=${selectedLabelId}`
          : `${paths.dashboard.mail}?id=${mailId}`;

      router.push(href);
    },
    [openMail, router, selectedLabelId, upMd, mutate]
  );

  const handleClickDraft = useCallback(
    (mailId, draftIdTmp) => {
      setDraftEmail(mails.byId[mailId].emails[0]);
      setDraftId(draftIdTmp);
      openCompose.onToggle();
      // postUpdateMailRead({ id: mailId, readbool: 'false' });
    },
    [mails, openCompose]
  );

  // Debounce function defined outside of the component's render method
  const debouncedSetSelectedSearch = debounce((search) => {
    setSelectedSearch(search);
  }, 200); // 500ms delay

  const fetchJwtToken = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/tiptap/token`); // Replace with your NestJS endpoint
      return response.data.token;
    } catch (e) {
      console.error('Error fetching JWT token:', e);
      return null;
    }
  };

  useEffect(() => {
    const initializeEditor = async () => {
      const token = await fetchJwtToken(); // Fetch JWT token
      setJwtToken(token);
    };
    if (process.env.NEXT_PUBLIC_USE_TIPTAP === 'true') {
      initializeEditor();
    }
  }, []);

  const handleSearchChange = (e) => {
    setInputValue(e.target.value);
    debouncedSetSelectedSearch(e.target.value);
  };

  const cleanSearch = () => {
    setSelectedSearch('');
    setInputValue('');
  };

  useEffect(() => {
    if (mailsError || mailError) {
      const href = `${paths.dashboard.mail}?label=all`;
      router.push(href);
    }
  }, [mailError, mailsError, router]);

  // useEffect(() => {
  //   if (!selectedMailId && firstMailId) {
  //     handleClickMail(firstMailId);
  //   }
  // }, [firstMailId, handleClickMail, selectedMailId]);

  useEffect(() => {
    if (openCompose.value) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [openCompose.value]);

  const handleSetForwardEmails = () => {
    setForwardEmails(mail);
    setDraftEmail([]);
    setDraftId(null);
    if (!openCompose.value) {
      openCompose.onToggle();
    }
  };

  const removeEmail = (emailId) => {
    setForwardEmails((prevEmails) => prevEmails.filter((email) => email._id !== emailId));
  };

  const reinitForwardEmail = () => {
    setForwardEmails([]);
  };

  // useEventListener('keydown', handleKeyDown);

  const renderLoading = (
    <LoadingScreen
      sx={{
        borderRadius: 1.5,
        background: 'transparent',
      }}
    />
  );

  const renderSkeleton = (
    <Box sx={{ width: 1, px: 1, pt: 1 }}>
      {Array.from({ length: 50 }).map((_, index) => (
        <Stack
          key={index}
          sx={{
            width: 1,
          }}
          direction="row"
          alignItems="center"
          spacing={1}
        >
          <Skeleton
            variant="text"
            animation="wave"
            sx={{ borderRadius: 1, fontSize: '1.8rem' }}
            // height={25}
            width="8%"
          />
          <Skeleton
            variant="text"
            animation="wave"
            sx={{ borderRadius: 1, fontSize: '1.2rem' }}
            // height={25}
            width="20%"
          />
          <Skeleton
            variant="text"
            animation="wave"
            sx={{ borderRadius: 1, fontSize: '1.2rem' }}
            // height={25}
            width="67%"
          />
          <Skeleton
            variant="text"
            animation="wave"
            sx={{ borderRadius: 1, fontSize: '1.2rem' }}
            // height={25}
            width="5%"
          />
        </Stack>
      ))}
    </Box>
  );

  const renderMailNav = (
    <MailNav
      loading={labelsLoading}
      openNav={openNav.value}
      onCloseNav={openNav.onFalse}
      //
      labels={labels}
      selectedLabelId={selectedLabelId}
      handleClickLabel={handleClickLabel}
      //
      onToggleCompose={handleToggleCompose}
    />
  );

  const renderMailList =
    selectedLabelId === 'draft' ? (
      <MailListDraft
        mails={mails}
        mutate={mutate}
        loading={mailsLoading}
        //
        openMail={openMail.value}
        onCloseMail={openMail.onFalse}
        onClickMail={handleClickDraft}
        //
        selectedLabelId={selectedLabelId}
        selectedMailId={selectedMailId}
        handleSearchChange={handleSearchChange}
        selectedSearch={selectedSearch}
        cleanSearch={cleanSearch}
        inputValue={inputValue}
        openDetail={openDetail}
        tagMapping={tagMapping}
      />
    ) : (
      <Stack direction="column" sx={{ height: 1, width: 1, mt: 0 }}>
        {settings.showImportant && (
          <>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ marginLeft: '12px' }}>
              <Iconify icon="fluent:mail-24-filled" sx={{ color: 'grey.500' }} width={22} />{' '}
              <Typography
                variant="caption"
                sx={{
                  letterSpacing: 0.5,
                  color: 'grey.500',
                  fontWeight: 'bold',
                  fontSize: '0.65rem',
                }}
              >
                {filterCriteria === '' ? 'LAST EMAILS' : 'SEARCH RESULTS'}
              </Typography>
            </Stack>
            <Divider variant="middle" sx={{ width: 0.985, mt: 1 }} />
          </>
        )}
        <MailList
          mails={mails}
          mutate={mutate}
          loading={mailsLoading}
          //
          openMail={openMail.value}
          onCloseMail={openMail.onFalse}
          onClickMail={handleClickMail}
          //
          selectedLabelId={selectedLabelId}
          selectedMailId={selectedMailId}
          handleSearchChange={handleSearchChange}
          selectedSearch={selectedSearch}
          cleanSearch={cleanSearch}
          inputValue={inputValue}
          openDetail={openDetail}
          tagMapping={tagMapping}
        />
      </Stack>
    );

  const renderMailListImportant = filterCriteria === '' && (
    <AccordionMail emailsLength={mailsImportant.allIds.length}>
      <MailList
        mails={mailsImportant}
        mutate={mutateImportant}
        loading={mailsLoadingImportant}
        //
        openMail={openMail.value}
        onCloseMail={openMail.onFalse}
        onClickMail={handleClickMail}
        //
        selectedLabelId={selectedLabelId}
        selectedMailId={selectedMailId}
        handleSearchChange={handleSearchChange}
        selectedSearch={selectedSearch}
        cleanSearch={cleanSearch}
        inputValue={inputValue}
        openDetail={openDetail}
        tagMapping={tagMapping}
      />
    </AccordionMail>
  );

  const renderMailDetails = (
    <>
      {mail && (
        <MailDetails
          mail={mail}
          mutateMail={mutateMail}
          setOpenDetail={setOpenDetail}
          renderLabel={(id) =>
            labels.filter((label) => label.id.toLowerCase() === id.toLowerCase())[0]
          }
          tagMapping={tagMapping}
          contacts={contacts}
          threadCategory={
            mail && mail.length > 0 && mails.byId[mail[0].threadId]
              ? mails.byId[mail[0].threadId].category || 'Other'
              : 'Other'
          }
          threadSummary={
            mail && mail.length > 0 && mails.byId[mail[0].threadId]
              ? mails.byId[mail[0].threadId].summary || 'No summary'
              : 'No summary'
          }
          setForwardEmails={handleSetForwardEmails}
          jwtToken={jwtToken}
          threadMail={mails.byId[selectedMailId]}
        />
      )}
    </>
  );

  const renderNoEmails = (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        width: '100%',
        backgroundColor: selectedLabelId === 'todo' ? 'black' : 'transparent',
        // backgroundImage: "url('/assets/background/background-todo.gif')", // Update with your GIF filename
        // backgroundSize: 'cover',
        // backgroundPosition: 'center',
        // backgroundRepeat: 'no-repeat',
      }}
    >
      {selectedLabelId === 'todo' ? (
        // <MouseTracker>
        <div className="flex flex-col items-center justify-center h-full">
          {/* <MinionsGif /> */}
          <Box
            sx={{
              height: 300,
              width: 300,
              backgroundImage: "url('/assets/background/background-todo.gif')", // Update with your GIF filename
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              borderRadius: 20,
              marginBottom: 10,
            }}
          />
          <Typography variant="h6" sx={{ fontStyle: 'italic' }}>
            {randomText}
          </Typography>
          {/* <div>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                cursor: 'pointer',
                flexDirection: 'row',
                alignItems: 'center',
                display: 'flex',
                gap: 1,
              }}
            >
              <div>
                See your <span className="underline text-[hsl(var(--primary))]">stats</span> on your
                dashboard!
              </div>{' '}
              <Iconify icon="mage:dashboard-bar" className="text-[hsl(var(--primary))]" />
            </Typography>
          </div> */}
        </div>
      ) : (
        // </MouseTracker>
        <Typography variant="h6">No emails found</Typography>
      )}
    </Box>
  );

  if (loading || loadingContacts) {
    return <> {renderLoading}</>;
  }

  // const handleClickButtonTest = () => {
  //   const t = toast(
  //     <div className="flex flex-col justify-start items-start gap-2">
  //       {/* Content */}
  //       <div className="flex flex-row items-center">
  //         <div style={{ width: '50px' }}>
  //           <Image
  //             src={`/logo/${'taskCompletion100.png'}`} // Update with your actual image name
  //             alt="Badge"
  //             width={35}
  //             height={35}
  //             className="rounded-md"
  //           />
  //         </div>
  //         <b>Task Trailblazer</b>!
  //       </div>

  //       {/* Message and Close Button */}
  //       <div>First task done. Is this the start of your productivity era? </div>
  //       <button
  //         type="button"
  //         className="absolute text-[hsl(var(--primary))] hover:scale-105 top-2 right-2"
  //         onClick={() => toast.dismiss(t)} // Dismiss the specific toast
  //       >
  //         <Iconify icon="basil:cross-outline" />
  //       </button>
  //     </div>,
  //     {
  //       duration: 10000,
  //     }
  //   );
  // };

  return (
    <>
      <div className="px-0 m-0">
        <div
          className="flex flex-col gap-1 p-0 relative overflow-hidden shadow-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))]"
          style={{
            boxShadow:
              'rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px',
          }}
        >
          {!upMd && (
            <MailHeader
              onOpenNav={openNav.onTrue}
              onOpenMail={mailsEmpty ? null : openMail.onTrue}
            />
          )}
          {/* <button type="button" onClick={handleClickButtonTest}>
            test
          </button> */}
          <Stack
            spacing={1}
            direction="row"
            flexGrow={1}
            sx={{
              px: 1,
              py: 1,
              height: {
                xs: '90vh',
                md: '90vh',
              },
            }}
          >
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={15} maxSize={25} minSize={10}>
                {renderMailNav}
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel>
                <Stack sx={{ width: 1, height: 1 }}>
                  {selectedLabelId !== 'draft' &&
                    filterCriteria === '' &&
                    settings.showImportant && (
                      <Box sx={{ width: 1, height: 'auto' }}>
                        {/* eslint-disable-next-line */}
                        {mailsLoadingImportant
                          ? renderSkeleton
                          : mailsImportant.allIds.length > 0
                            ? renderMailListImportant
                            : renderNoEmails}
                      </Box>
                    )}
                  <Box sx={{ width: 1, height: 1 }}>
                    {/* eslint-disable-next-line */}
                    {mailsLoading
                      ? renderSkeleton
                      : mails.allIds.length > 0
                        ? renderMailList
                        : renderNoEmails}
                  </Box>
                </Stack>
              </ResizablePanel>
            </ResizablePanelGroup>
            {/* {mails.allIds.length > 0 ? renderMailList : renderNoEmails} */}
            <LazyMotion features={domAnimation}>
              <AnimatePresence>
                {openDetail && !mailLoading && (
                  <m.div
                    key="mailDetails"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={variants}
                    transition={{ duration: 0 }}
                  >
                    {renderMailDetails}
                  </m.div>
                )}
              </AnimatePresence>
            </LazyMotion>

            {/* {mailLoading ? renderLoading : renderMailDetails} */}
          </Stack>
        </div>
      </div>

      {openCompose.value && (
        <MailCompose
          onCloseCompose={openCompose.onFalse}
          contacts={contacts}
          forwardEmails={forwardEmails}
          removeEmail={removeEmail}
          reinitForwardEmail={reinitForwardEmail}
          threadSummary={
            mail && mail.length > 0 && mails.byId[mail[0].threadId]
              ? mails.byId[mail[0].threadId].summary || 'No summary'
              : 'No summary'
          }
          draftEmail={draftEmail}
          draftId={draftId}
          setDraftId={setDraftId}
          jwtToken={jwtToken}
        />
      )}
    </>
  );
}
