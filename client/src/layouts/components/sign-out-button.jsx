import { useCallback } from 'react';

import Button from '@mui/material/Button';

import { useRouter } from 'src/routes/hooks';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export function SignOutButton({ onClose, ...other }) {
  const router = useRouter();

  const { logout, checkUserSession } = useAuthContext();

  const handleLogout = useCallback(async () => {
    try {
      await logout();

      onClose?.();
      router.replace('/');
    } catch (error) {
      console.error(error);
    }
    // eslint-disable-next-line
  }, [checkUserSession, onClose, router]);

  return (
    <Button fullWidth variant="soft" size="large" color="error" onClick={handleLogout} {...other}>
      Logout
    </Button>
  );
}
