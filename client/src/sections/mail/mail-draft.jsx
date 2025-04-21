'use client';

import PropTypes from 'prop-types';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

// @mui
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';

// hooks
import { useResponsive } from 'src/hooks/use-responsive';

import { MailItemDraft } from './mail-item-draft';
import { MailItemSkeleton } from './mail-skeleton';

// ----------------------------------------------------------------------

export function MailListDraft({
  loading,
  mails,
  mutate,
  //
  openMail,
  onCloseMail,
  onClickMail,
  //
  selectedLabelId,
  selectedMailId,
  openDetail,
  tagMapping,
}) {
  const mdUp = useResponsive('up', 'md');

  // const socket = useSocket();

  // useEffect(() => {
  //   if (socket) {
  //     // Listen for mail update events
  //     socket.on('mail_update', (message) => {
  //       console.log('Mail update received:', message);
  //     });

  //     // Clean up the listener when component unmounts
  //     return () => {
  //       socket.off('mail_update');
  //     };
  //   }
  //   return undefined;
  //   // eslint-disable-next-line
  // }, []);

  const renderSkeleton = (
    <>
      {[...Array(8)].map((_, index) => (
        <MailItemSkeleton key={index} />
      ))}
    </>
  );

  const Row = ({ index, style }) => {
    const mailId = mails.allIds[index];

    // Adjust the style to add a gap

    return (
      <MailItemDraft
        mail={mails.byId[mailId].emails[0]}
        threadMail={mails.byId[mailId]}
        mutate={mutate}
        selected={selectedMailId === mailId}
        selectedLabelId={selectedLabelId}
        onClickMail={() => {
          onClickMail(mails.byId[mailId]._id, mails.byId[mailId].emails[0].draftId);
        }}
        style={style}
        openDetail={openDetail}
        tagMapping={tagMapping}
        mails={mails.byId[mailId].emails}
      />
    );
  };

  Row.propTypes = {
    index: PropTypes.number.isRequired,
    style: PropTypes.object.isRequired,
  };

  const renderList = (
    <AutoSizer>
      {({ height, width }) => (
        <List
          height={height}
          itemCount={mails.allIds.length}
          itemSize={40} // Adjust the item size according to your item height
          width={width}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {Row}
        </List>
      )}
    </AutoSizer>
  );

  const renderContent = (
    <>
      {loading && renderSkeleton}
      <div style={{ height: '100%', width: '100%' }}>{!!mails.allIds.length && renderList}</div>
    </>
  );

  return mdUp ? (
    <Stack
      sx={{
        height: 1,
        position: 'relative',
        // width: 'calc(100% - 150px)',
        flexShrink: 0,
        borderRadius: 1.5,
        paddingLeft: '10px',
        paddingRight: '10px',
        paddingTop: '5px',
        paddingBottom: '5px',
        // bgcolor: 'background.default',
        background: 'transparent',
        width: openDetail ? 'calc(50% - 70px)' : 'calc(100%)',
      }}
    >
      {renderContent}
    </Stack>
  ) : (
    <Drawer
      open={openMail}
      onClose={onCloseMail}
      slotProps={{
        backdrop: { invisible: true },
      }}
      PaperProps={{
        sx: {
          width: 400,
        },
      }}
    >
      {renderContent}
    </Drawer>
  );
}

MailListDraft.propTypes = {
  loading: PropTypes.bool,
  mails: PropTypes.object,
  mutate: PropTypes.func,
  onClickMail: PropTypes.func,
  onCloseMail: PropTypes.func,
  openMail: PropTypes.bool,
  selectedLabelId: PropTypes.string,
  selectedMailId: PropTypes.string,
  openDetail: PropTypes.bool,
  tagMapping: PropTypes.object,
};
