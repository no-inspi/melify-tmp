import COLORS from './colors.json';
import { varAlpha, createPaletteChannel } from '../styles';

// ----------------------------------------------------------------------

// Grey
export const grey = createPaletteChannel(COLORS.grey);

// Primary
export const primary = createPaletteChannel(COLORS.primary);

// Secondary
export const secondary = createPaletteChannel(COLORS.secondary);

// Info
export const info = createPaletteChannel(COLORS.info);

// Success
export const success = createPaletteChannel(COLORS.success);

// Warning
export const warning = createPaletteChannel(COLORS.warning);

// Error
export const error = createPaletteChannel(COLORS.error);

// Common
export const common = createPaletteChannel(COLORS.common);

// Text
export const text = {
  light: createPaletteChannel({
    primary: grey[800],
    secondary: grey[600],
    disabled: grey[500],
  }),
  dark: createPaletteChannel({
    primary: '#FFFFFF',
    secondary: grey[500],
    disabled: grey[600],
  }),
};

// Background
export const background = {
  light: createPaletteChannel({
    paper: '#f1f5f8',
    default: '#f1f5f8',
    neutral: grey[200],
  }),
  dark: createPaletteChannel({
    paper: grey[800],
    default: '#262626',
    neutral: '#28323D',
  }),
};

// Action
export const baseAction = {
  hover: varAlpha(grey['500Channel'], 0.08),
  selected: varAlpha(grey['500Channel'], 0.16),
  focus: varAlpha(grey['500Channel'], 0.24),
  disabled: varAlpha(grey['500Channel'], 0.8),
  disabledBackground: varAlpha(grey['500Channel'], 0.24),
  hoverOpacity: 0.08,
  disabledOpacity: 0.48,
};

export const MELIFY = {
  whiteRgba: '#ffffffe6',
  lighterRgba: '#c1bef61a',
  darkerRgba: '#21203c33',
  lighter: '#C1BEF6',
  light: '#A29EF2',
  main: '#827ded',
  mainDark: 'rgba(22, 22, 32, 0.8)',
  dark: '#413F77',
  darker: '#21203C',
  contrastText: '#FFFFFF',
  linearDarker: 'linear-gradient(to right, rgba(228, 82, 154, 0.14), rgba(124, 122, 185, 0.14))',
  linearDark: 'linear-gradient(to right, rgba(228, 82, 154, 0.24), rgba(124, 122, 185, 0.24))',
  linearMain: 'linear-gradient(90deg, rgba(190,46,117,1) 0%, rgba(93,91,173,1) 100%)',
  linearLight: 'linear-gradient(to right, rgba(228, 82, 154, 0.8), rgba(124, 122, 185, 0.8))',
  linearLighter: 'linear-gradient(to right, rgba(228, 82, 154, 1), rgba(124, 122, 185, 1))',
  linearForward: 'linear-gradient(to right,rgba(228, 82, 154, 0.4),rgba(124, 122, 185, 0.4))',
  textRenderEmail: '#808080',
};

export const action = {
  light: { ...baseAction, active: grey[600] },
  dark: { ...baseAction, active: grey[500] },
};

/*
 * Base palette
 */
export const basePalette = {
  primary,
  secondary,
  info,
  success,
  warning,
  error,
  grey,
  common,
  divider: varAlpha(grey['500Channel'], 0.2),
  action,
};

export const lightPalette = {
  ...basePalette,
  text: text.light,
  background: background.light,
  action: action.light,
  melify: MELIFY,
};

export const darkPalette = {
  ...basePalette,
  text: text.dark,
  background: background.dark,
  action: action.dark,
  melify: MELIFY,
};

// ----------------------------------------------------------------------

export const colorSchemes = {
  light: { palette: lightPalette },
  dark: { palette: darkPalette },
};
