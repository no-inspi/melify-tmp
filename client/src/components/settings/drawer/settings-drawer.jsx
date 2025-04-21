'use client';

import { useTheme as useThemeShadcn } from 'next-themes';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Drawer, { drawerClasses } from '@mui/material/Drawer';
import { useTheme, useColorScheme } from '@mui/material/styles';

import COLORS from 'src/theme/core/colors.json';
import { paper, varAlpha } from 'src/theme/styles';
import { defaultFont } from 'src/theme/core/typography';
import PRIMARY_COLOR from 'src/theme/with-settings/primary-color.json';

import { Iconify } from '../../iconify';
import { BaseOption } from './base-option';
import { Scrollbar } from '../../scrollbar';
import { FontOptions } from './font-options';
import { useSettingsContext } from '../context';
import { PresetsOptions } from './presets-options';
import { defaultSettings } from '../config-settings';

// ----------------------------------------------------------------------

export function SettingsDrawer({ sx, hideFont, hidePresets }) {
  const theme = useTheme();

  const { theme: themeShadcn, setTheme } = useThemeShadcn();

  const settings = useSettingsContext();

  const { setMode } = useColorScheme();

  const renderHead = (
    <Box display="flex" alignItems="center" sx={{ py: 2, pr: 1, pl: 2.5 }}>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        Settings
      </Typography>

      {/* <FullScreenButton /> */}

      <Tooltip title="Reset">
        <IconButton
          onClick={() => {
            settings.onReset();
            setMode(defaultSettings.colorScheme);
            setTheme('dark');
          }}
        >
          <Badge color="error" variant="dot" invisible={!settings.canReset}>
            <Iconify icon="solar:restart-bold" />
          </Badge>
        </IconButton>
      </Tooltip>

      <Tooltip title="Close">
        <IconButton onClick={settings.onCloseDrawer}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Tooltip>
    </Box>
  );

  // const renderMode = (
  //   <BaseOption
  //     label="Dark mode"
  //     icon="moon"
  //     selected={settings.colorScheme === 'dark'}
  //     onClick={() => {
  //       settings.onUpdateField('colorScheme', mode === 'light' ? 'dark' : 'light');
  //       setMode(mode === 'light' ? 'dark' : 'light');
  //       setTheme(themeShadcn === 'light' ? 'dark' : 'light');
  //     }}
  //   />
  // );

  const renderImportant = (
    <BaseOption
      label="Important"
      icon="round-label-important"
      selected={settings.showImportant}
      onClick={() => settings.onUpdateField('showImportant', !settings.showImportant)}
    />
  );

  // const renderModeColor = (
  //   <BaseOption
  //     label="Red mode"
  //     icon="moon"
  //     selected={themeShadcn === 'red'}
  //     onClick={() => {
  //       // settings.onUpdateField('colorScheme', mode === 'light' ? 'dark' : 'light');
  //       setTheme('red');
  //     }}
  //   />
  // );

  const renderPresetsShadcn = (
    <PresetsOptions
      value={themeShadcn}
      onClickOption={(newValue) => {
        if (newValue === 'system') {
          // Handle system theme
          const systemTheme =
            window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light';

          settings.onUpdateField('colorScheme', 'system');
          setMode(systemTheme); // Set MUI theme to system preference
          setTheme('system'); // Set Shadcn theme to system
        } else if (newValue === 'dark' || newValue === 'light') {
          settings.onUpdateField('colorScheme', newValue);
          setMode(newValue);
          setTheme(newValue);
        } else {
          const themeColorDarkness = newValue.split('-')[0];
          console.log('themeColorDarkness', themeColorDarkness);
          if (themeColorDarkness === 'dark') {
            settings.onUpdateField('colorScheme', 'dark');
            setMode('dark');
            setTheme(newValue);
          } else {
            settings.onUpdateField('colorScheme', 'light');
            setMode('light');
            setTheme(newValue);
          }
        }
      }}
      options={[
        { name: 'system', value: '#000000', displayName: 'System' },
        { name: 'dark', value: '#000000', displayName: 'Dark' },
        { name: 'light', value: '#C0C0C0', displayName: 'Light' },
        { name: 'light-red', value: PRIMARY_COLOR.red.light, displayName: 'Light Red' },
        { name: 'dark-red', value: PRIMARY_COLOR.red.dark, displayName: 'Dark Red' },
        { name: 'dark-blue', value: PRIMARY_COLOR.blue.dark, displayName: 'Dark Blue' },
        { name: 'dark-green', value: COLORS.success.dark, displayName: 'Dark Green' },
        { name: 'dark-teal', value: COLORS.info.dark, displayName: 'Dark Teal' },
      ]}
    />
  );

  const renderFont = (
    <FontOptions
      value={settings.fontFamily}
      onClickOption={(newValue) => settings.onUpdateField('fontFamily', newValue)}
      options={[defaultFont, 'Inter', 'DM Sans', 'Nunito Sans']}
    />
  );

  return (
    <Drawer
      anchor="right"
      open={settings.openDrawer}
      onClose={settings.onCloseDrawer}
      slotProps={{ backdrop: { invisible: true } }}
      sx={{
        [`& .${drawerClasses.paper}`]: {
          ...paper({
            theme,
            color: varAlpha(theme.vars.palette.background.defaultChannel, 0.9),
          }),
          width: 360,
          ...sx,
        },
      }}
    >
      {renderHead}

      <Scrollbar>
        <Stack spacing={6} sx={{ px: 2.5, pb: 5 }}>
          <Box gap={2} display="grid" gridTemplateColumns="repeat(2, 1fr)">
            {/* {!hideColorScheme && renderMode} */}
            {/* {!hideContrast && renderContrast} */}
            {/* {!hideDirection && renderRTL} */}
            {/* {!hideCompact && renderCompact} */}
            {renderImportant}
          </Box>
          {/* {!(hideNavLayout && hideNavColor) && renderNav} */}
          {!hidePresets && renderPresetsShadcn}
          {!hideFont && renderFont}
        </Stack>
      </Scrollbar>
    </Drawer>
  );
}
