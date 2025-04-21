import React, { useEffect, useRef } from 'react';
import { useTheme as useThemeShadcn } from 'next-themes';
import { parseMessage } from '@u22n/mailtools';
import { generateDarkModeStyles } from './dark-mode';
import { darkTheme } from './theme/namedColors';

const colors = {
  bg: darkTheme.card.background,
  bgwhite: darkTheme.card.whitebackground,
  text: darkTheme.text.primary,
  link: darkTheme.accent.primary,
};

// Enhanced base styles with explicit text color handling
const createIframeStyles = (isDarkMode) => `
  html {
    background-color: ${isDarkMode ? colors.bg : colors.bgwhite} !important;
    color: ${isDarkMode ? colors.text : 'inherit'} !important;
  }
  
  body {
    background-color: ${isDarkMode ? colors.bg : colors.bgwhite} !important;
    color: ${isDarkMode ? colors.text : 'inherit'} !important;
    // min-height: 100vh;
  }
  
  /* Force colors for common email elements */
  div, p, span, h1, h2, h3, h4, h5, h6, td, th {
    background-color: ${isDarkMode ? colors.bg : colors.bgwhite} !important;
    color: ${isDarkMode ? colors.text : 'inherit'} !important;
  }
  
  /* Handle links separately */
  a {
    color: ${isDarkMode ? colors.link : 'inherit'} !important;
  }
  
  /* Preserve images and media */
  img, video, canvas, svg {
    background-color: initial !important;
  }
`;

export function Email({ body, height, forwarding }) {
  if (!forwarding) {
    if (body.length < 1000) {
      height = body.length * 0.8;
    } else {
      height = 600;
    }
  }
  const iframeRef = useRef(null);
  const { theme, resolvedTheme } = useThemeShadcn();

  // Function to process email content with current theme
  const processEmailContent = async (doc, isDarkMode) => {
    if (!doc) return;

    // Insert our base styles before the email's styles
    // const styleContent = createIframeStyles(isDarkMode);

    // Apply the appropriate styles based on theme
    if (isDarkMode) {
      // Modified dark mode processing
      const start = Date.now();

      // Set background colors
      doc.documentElement.style.backgroundColor = colors.bg;
      doc.body.style.backgroundColor = colors.bg;

      // Apply dark mode styles with modified colors
      const darkModeColors = {
        ...colors,
        text: darkTheme.text.primary,
        link: darkTheme.accent.primary,
      };

      generateDarkModeStyles(darkModeColors, doc);

      // Add final style override
      const finalStyles = doc.createElement('style');
      finalStyles.textContent = `
        * {
          background-color: ${colors.bg} !important;
          color: ${darkTheme.text.primary} !important;
        }
        a {
          color: ${darkTheme.accent.primary} !important;
        }
        img, video, canvas, svg {
          background-color: initial !important;
        }
      `;
      doc.head.appendChild(finalStyles);

      console.log('Dark mode processing took', Date.now() - start, 'ms');
    }
  };

  // Effect to handle initial email parsing and theme changes
  useEffect(() => {
    const processEmail = async () => {
      const iframe = iframeRef.current;
      const doc = iframe?.contentDocument;
      if (!doc) return;

      try {
        const parsedEmail = await parseMessage(body);
        const htmlWithStyles = parsedEmail.completeHtml.replace(
          '<head>',
          `<head><style id="base-styles">${createIframeStyles(resolvedTheme === 'dark')}</style>`
        );

        doc.open();
        doc.write(htmlWithStyles);
        doc.close();

        await processEmailContent(doc, resolvedTheme === 'dark');
      } catch (error) {
        console.error('Error processing email:', error);
      }
    };

    processEmail();
  }, [body, theme, resolvedTheme]); // React to both theme and resolvedTheme changes

  return (
    <div className="email h-full">
      {/* eslint-disable-next-line jsx-a11y/iframe-has-title */}
      <iframe ref={iframeRef} seamless sandbox="allow-same-origin allow-popups allow-scripts" />
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx>{`
        .email {
          display: flex;
          flex-direction: column;
          width: 100%;
          flex-shrink: 0;
          height: ${height}px;
        }

        iframe {
          flex-grow: 1;
          display: block;
          border-radius: 0;
          height: 100%;
          border: none;
          overflow: auto;
          background-color: ${resolvedTheme === 'dark'
            ? darkTheme.card.background
            : darkTheme.card.whitebackground};
        }
      `}</style>
    </div>
  );
}
