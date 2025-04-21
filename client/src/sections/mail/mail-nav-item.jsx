'use client';

import PropTypes from 'prop-types';

// @mui
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';

import {
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
  Tooltip as TooltipShadcn,
} from 'src/s/components/ui/tooltip.tsx';

// components
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const LABEL_ICONS = {
  all: 'fluent:mail-24-filled',
  inbox: 'solar:inbox-bold',
  trash: 'solar:trash-bin-trash-bold',
  draft: 'solar:file-text-bold',
  spam: 'solar:danger-bold',
  sent: 'iconamoon:send-fill',
  starred: 'eva:star-fill',
  important: 'material-symbols:label-important-rounded',
  todo: 'lucide:list-todo',
  done: 'lucide:check-check',
  RH: 'icon-park-solid:peoples',
  'High Urgency': 'solar:tag-horizontal-bold-duotone',
  'Low Urgency': 'solar:tag-horizontal-bold-duotone',
  'Medium Urgency': 'solar:tag-horizontal-bold-duotone',
  Personal: 'icon-park-outline:family',
  Transactional: 'uil:transaction',
  'Work-Related': 'material-symbols:work',
  'Notifications/Promotions': 'carbon:notification-new',
  'Legal and Administrative': 'ri:admin-line',
  Educational: 'solar:book-outline',
  Health: 'solar:health-outline',
  Travel: 'material-symbols-light:travel',
  Other: 'tabler:category-filled',
  'Product Development and Management': 'basil:other-1-outline',
  'Launches and negotiations': 'basil:other-1-outline',
  'Market Analysis and Strategy': 'basil:other-1-outline',
  'Supplier and Inventory Management': 'basil:other-1-outline',
  'Quality Assurance and Control': 'basil:other-1-outline',
  'Financial Reporting and Analysis': 'basil:other-1-outline',
  'Communication and Collaboration': 'basil:other-1-outline',
};

// ----------------------------------------------------------------------

export function MailNavItem({ selected, label, onClickNavItem, ...other }) {
  const { unreadCount, color, name } = label;

  const getLabelIcon = (labelId) => {
    const DEFAULT_ICON = 'tabler:point'; // Replace this with the default icon you want to use
    const SPECIAL_LABELS = [
      'todo',
      'all',
      'inbox',
      'trash',
      'draft',
      'spam',
      'sent',
      'starred',
      'important',
      'done',
    ];

    if (SPECIAL_LABELS.includes(labelId)) {
      return LABEL_ICONS[labelId];
    }

    return DEFAULT_ICON;
  };

  const labelIcon = getLabelIcon(label.id);

  return (
    <TooltipProvider delayDuration={0}>
      <TooltipShadcn>
        <TooltipTrigger asChild>
          <ListItemButton
            disableRipple
            onClick={onClickNavItem}
            sx={{
              px: 1,
              my: 0.2,
              height: 'auto',
              borderRadius: 1,
              color: 'text.secondary',
              ...(selected && {
                color: 'text.primary',
                bgcolor: 'hsl(var(--card))',
              }),
              '&:hover': {
                color: 'text.primary',
                bgcolor: 'hsl(var(--card))',
              },
            }}
            {...other}
          >
            <Iconify
              icon={labelIcon}
              width={22}
              sx={{
                mr: 0.5,
                color,
              }}
            />

            <ListItemText
              primary={name}
              primaryTypographyProps={{
                textTransform: 'capitalize',
                typography: selected ? 'subtitle2' : 'body2',
                noWrap: true,
              }}
              sx={{
                whiteSpace: 'nowrap', // Prevents the text from wrapping
                overflow: 'hidden', // Hides the overflowing text
                textOverflow: 'ellipsis', // Adds the ellipsis for long text
              }}
            />

            {/* <Tooltip title={name} placement="right"></Tooltip> */}
            {!!unreadCount && <Typography variant="caption">{unreadCount}</Typography>}
          </ListItemButton>
        </TooltipTrigger>
        <TooltipContent className="z-[2147483647]" side="right" sideOffset={10}>
          <p>{name}</p>
        </TooltipContent>
      </TooltipShadcn>
    </TooltipProvider>
  );
}

MailNavItem.propTypes = {
  selected: PropTypes.bool,
  label: PropTypes.object,
  onClickNavItem: PropTypes.func,
};
