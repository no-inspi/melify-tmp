import Color from 'color';

/** Returns whether the document has dark mode rules */
const hasDarkModeRules = (doc) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const sheet of doc.styleSheets) {
    // eslint-disable-next-line no-restricted-syntax
    for (const rule of sheet.rules) {
      // Look for `@media (prefers-color-scheme: dark)` in styles
      if (rule.type === rule.MEDIA_RULE) {
        const mediaText = rule.media.mediaText;
        if (mediaText.includes('prefers-color-scheme: dark')) {
          return true;
        }
      }

      // Outlook appends this attribute to dark mode emails
      if (rule.cssText.includes('data-ogsc')) {
        return true;
      }
    }
  }

  return false;
};

/** Returns whether the document has a dark background */
const hasDarkBackground = (doc) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const element of doc.body.children) {
    try {
      const background = findBackgroundColor(element);
      if (background && element.clientHeight > 200 && parseColor(background[1]).isDark()) {
        return true;
      }
    } catch (e) {
      console.error(e);
    }
  }

  return false;
};

/** Returns whether the doc has its own styles for dark mode */
export const hasNativeDarkModeSupport = (doc) => {
  const colorSchemeMeta = doc.head.querySelector(
    'meta[name="color-scheme"],meta[name="supported-color-schemes"]'
  );

  if (colorSchemeMeta?.getAttribute('content')?.includes('dark')) {
    return true;
  }

  if (hasDarkModeRules(doc)) {
    return true;
  }

  if (hasDarkBackground(doc)) {
    return true;
  }

  return false;
};

/** Attributes that can contain colors */
const COLOR_ATTRS = ['fill', 'stop-color', 'stroke', 'bgcolor', 'color'];

/** Elements with these attributes should be processed */
const INLINE_STYLE_SELECTOR = ['style', ...COLOR_ATTRS].map((attr) => `[${attr}]`).join(', ');

/** Styles that contain colors */
const COLOR_STYLES = [
  'backgroundColor',
  'color',
  'fill',
  'stroke',
  'outlineColor',
  'stopColor',
  'borderTopColor',
  'borderBottomColor',
  'borderLeftColor',
  'borderRightColor',
  'textDecorationColor',
];

/** CSS values to skip in processing */
const SKIP_VALUES = ['none', 'initial', 'inherit', 'transparent'];

/** Dark mode default styles */
const darkModeStyles = `
  body {
    background-color: transparent !important;
    color: var(--tempo-text) !important;
  }

  a {
    color: var(--tempo-link);
  }
`;

/* Parses a color string. Throws an error if parsing fails. */
export const parseColor = (color) => {
  if (color.match(/^[a-f\d]{3}$|^[a-f\d]{6}$/)) {
    color = `#${color}`;
  }
  return new Color(color);
};

/** Determines if a color is vibrant */
// eslint-disable-next-line arrow-body-style
export const isVibrant = (color, lightnessThreshold = 10) => {
  return color.saturationv() > 50 && color.lightness() >= lightnessThreshold;
};

/** Converts a light-mode color into a dark-mode one */
export const generateInvertedColor = (color, backgroundColor, colors) => {
  if (SKIP_VALUES.includes(color)) {
    return color;
  }

  try {
    const parsedColor = parseColor(color);
    const parsedBackground = parseColor(backgroundColor ?? 'white');

    const colorIsVibrant = isVibrant(parsedColor, 30);
    const backgroundIsVibrant = isVibrant(parsedBackground);

    if (colorIsVibrant || backgroundIsVibrant) {
      return Color(color).desaturate(0.3).hex();
    }

    if (parsedColor.lightness() > 97) {
      return colors.bg;
    }

    if (parsedColor.lightness() < 10) {
      return colors.text;
    }

    const lightness = parsedColor.lightness() / 100;
    const bgLightness = Color(colors.bg).lightness() / 100;

    if (parsedColor.saturationv() === 0) {
      const mix = lightness * (1 + bgLightness) - bgLightness;
      // eslint-disable-next-line no-else-return
      return Color(colors.text).mix(Color(colors.bg), mix).hex();
      // eslint-disable-next-line no-else-return
    } else {
      const newLightness = (1 - bgLightness) * (1 - lightness) + bgLightness;
      return parsedColor
        .lightness(newLightness * 100)
        .desaturate(lightness - 0.3)
        .hex();
    }
  } catch (e) {
    console.warn('Cannot parse', color, 'on', backgroundColor);
    return color;
  }
};

/** Finds the closest element with a background color and returns its value */
const findBackgroundColor = (el) => {
  if (el.tagName === 'BODY' || el.tagName === 'HTML') {
    return null;
  }

  const bgColor = el.getAttribute('bgcolor');
  // eslint-disable-next-line no-else-return
  if (el.style.backgroundColor && !SKIP_VALUES.includes(el.style.backgroundColor)) {
    return [el, el.style.backgroundColor];
    // eslint-disable-next-line no-else-return
  } else if (bgColor) {
    return [el, bgColor];
    // eslint-disable-next-line no-else-return
  } else if (el.parentElement) {
    return findBackgroundColor(el.parentElement);
    // eslint-disable-next-line no-else-return
  } else {
    return null;
  }
};

/** Finds the closest element with a background image and returns its value */
const findBackgroundImage = (el) => {
  if (el.tagName === 'BODY' || el.tagName === 'HTML') {
    return null;
  }
  // eslint-disable-next-line no-else-return
  if (el.style.backgroundImage && !SKIP_VALUES.includes(el.style.backgroundImage)) {
    return [el, el.style.backgroundImage];
    // eslint-disable-next-line no-else-return
  } else if (el.style.backgroundColor && !SKIP_VALUES.includes(el.style.backgroundColor)) {
    return null;
    // eslint-disable-next-line no-else-return
  } else if (el.parentElement) {
    return findBackgroundImage(el.parentElement);
    // eslint-disable-next-line no-else-return
  } else {
    return null;
  }
};

/** Overrides style colors */
export const overrideStyleColors = (doc, colors) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const sheet of doc.styleSheets) {
    // eslint-disable-next-line no-restricted-syntax
    for (const rule of sheet.cssRules) {
      if (rule.type !== CSSRule.STYLE_RULE) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const style = rule.style;
      // eslint-disable-next-line no-restricted-syntax
      for (const key of COLOR_STYLES) {
        if (style[key]) {
          style[key] = generateInvertedColor(style[key], undefined, colors);
        }
      }
    }
  }
};

/** Processes the document and adds dark mode styles */
export const generateDarkModeStyles = (colors, doc = document) => {
  if (hasNativeDarkModeSupport(doc)) {
    return;
  }

  overrideStyleColors(doc, colors);
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, color] of Object.entries(colors)) {
    doc.documentElement.style.setProperty(`--tempo-${key}`, color);
  }
  // eslint-disable-next-line no-shadow
  const style = doc.createElement('style');
  style.textContent = darkModeStyles;
  doc.body.append(style);

  doc.body.querySelectorAll(INLINE_STYLE_SELECTOR).forEach((e) => {
    const element = e;
    // eslint-disable-next-line no-shadow
    const style = element.style;

    const bgColor = findBackgroundColor(element);
    const bgImage = findBackgroundImage(element);
    // eslint-disable-next-line no-restricted-syntax
    for (const key of COLOR_STYLES) {
      if (bgImage && !bgColor && (!key.startsWith('border') || bgImage[0] !== element)) {
        // eslint-disable-next-line no-continue
        continue;
      }

      if (style[key] && style[key] !== 'initial') {
        style[key] = generateInvertedColor(style[key], bgColor?.[1], colors);
      }
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const attr of COLOR_ATTRS) {
      if (bgImage) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const value = element.getAttribute(attr);
      if (value) {
        const inverted = generateInvertedColor(value, bgColor?.[1], colors);
        element.setAttribute(attr, inverted);
      }
    }
  });

  doc.body.style.removeProperty('color');
  doc.body.style.removeProperty('background');
};
