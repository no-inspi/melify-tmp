'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { alpha, useTheme } from '@mui/material/styles';

import { bgGradient } from 'src/theme/styles';

import { Logo } from 'src/components/logo';

import CloudFunctionStatus from 'src/components/check_status';
// ----------------------------------------------------------------------

export function AuthClassicLayout({ children }) {
  const theme = useTheme();

  const renderLogo = (
    <Logo
      sx={{
        zIndex: 9,
        position: 'absolute',
        m: { xs: 2, md: 5 },
      }}
    />
  );

  const renderDevInformations = (
    <div className="absolute top-10 right-5">
      <CloudFunctionStatus />
    </div>
  );

  const renderContent = (
    <Stack
      sx={{
        width: 1,
        mx: 'auto',
        maxWidth: 480,
        px: { xs: 2, md: 8 },
        py: { xs: 15, md: 30 },
      }}
    >
      {children}
    </Stack>
  );

  const renderSection = (
    <Stack
      flexGrow={1}
      alignItems="center"
      justifyContent="center"
      spacing={0}
      sx={{
        ...bgGradient({
          color: alpha(
            theme.palette.background.default,
            theme.palette.mode === 'light' ? 0.88 : 0.64
          ),
          imgUrl: '/assets/background/loginBackgroundFromWebflow.svg',
        }),
        animation: 'slide 5s linear infinite',
        '@keyframes slide': {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '100% 0%' },
        },
      }}
    >
      {/* <Typography variant="h3" sx={{ maxWidth: 480, textAlign: 'center' }}>
        {title || 'Hi, Welcome back'}
      </Typography> */}

      <Box
        // component="img"
        alt="auth"
        // src={image || '/assets/illustrations/illustration_dashboard.png'}
        sx={{ maxWidth: 720 }}
      >
        {renderContent}
      </Box>
    </Stack>
  );

  return (
    <Stack
      component="main"
      direction="row"
      sx={{
        minHeight: '100vh',
      }}
    >
      {renderLogo}

      {process.env.NODE_ENV === 'development' && renderDevInformations}

      {renderSection}

      {/* {renderContent} */}
    </Stack>
  );
}
