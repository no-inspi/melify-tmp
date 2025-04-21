import 'src/global.css';

// ----------------------------------------------------------------------

import { CONFIG } from 'src/config-global';
import { primary } from 'src/theme/core/palette';
import { ThemeProvider } from 'src/theme/theme-provider';
import { Toaster } from 'src/s/components/ui/sonner.tsx';
import { getInitColorSchemeScript } from 'src/theme/color-scheme-script';
import { SearchProvider } from 'src/layouts/dashboard/context/searchProvider';
import { EmailFilterProvider } from 'src/layouts/dashboard/context/emailProvider';

import { ProgressBar } from 'src/components/progress-bar';
import { MotionLazy } from 'src/components/animate/motion-lazy';
import { detectSettings } from 'src/components/settings/server';
import { DialogProvider } from 'src/components/game-dialog/gameDialog';
import { ThemeProvider as ThemeProviderShadcn } from 'src/components/theme-provider.tsx';
import { SettingsDrawer, defaultSettings, SettingsProvider } from 'src/components/settings';

import { AuthProvider } from 'src/auth/context/gmail';
import { SocketProvider } from 'src/auth/socket/SocketProvider';

// ----------------------------------------------------------------------

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: primary.main,
};

export default async function RootLayout({ children }) {
  const settings = CONFIG.isStaticExport ? defaultSettings : await detectSettings();

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {getInitColorSchemeScript}

        <AuthProvider>
          <SettingsProvider
            settings={settings}
            caches={CONFIG.isStaticExport ? 'localStorage' : 'cookie'}
          >
            <ThemeProviderShadcn
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
              value={{
                light: 'light',
                dark: 'dark',
                'light-red': 'light-red',
                'dark-red': 'dark-red',
                'dark-blue': 'dark-blue',
                'dark-green': 'dark-green',
                'dark-teal': 'dark-teal',
              }}
            >
              <ThemeProvider>
                <SearchProvider>
                  <EmailFilterProvider>
                    <DialogProvider>
                      <SocketProvider>
                        <MotionLazy>
                          <ProgressBar />
                          <SettingsDrawer />
                          {children}
                        </MotionLazy>
                      </SocketProvider>
                    </DialogProvider>
                  </EmailFilterProvider>
                </SearchProvider>
              </ThemeProvider>
            </ThemeProviderShadcn>
          </SettingsProvider>
        </AuthProvider>
        <Toaster expand />
      </body>
    </html>
  );
}
