'use client';

import Image from 'next/image';
import { useState, useCallback, useRef, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { useRouter, usePathname } from 'src/routes/hooks';

import { varAlpha } from 'src/theme/styles';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { AnimateAvatar } from 'src/components/animate';

import { useAuthContext } from 'src/auth/hooks';
import { CONFIG } from 'src/config-global';

import { AccountButton } from './account-button';
import { SignOutButton } from './sign-out-button';
import { AddAccountButton } from './addAccount';

import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from 'src/s/lib/utils';
import { Button } from 'src/s/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from 'src/s/components/ui/command';

// ----------------------------------------------------------------------

export function AccountDrawer({ data = [], sx, ...other }) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { user, checkUserSession } = useAuthContext();

  const [open, setOpen] = useState(false);
  const [openComboBox, setOpenComboBox] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [value, setValue] = useState(user?.currentAccount?.email);

  // Update value when user changes
  useEffect(() => {
    if (user?.currentAccount?.email) {
      setValue(user.currentAccount.email);
    }
  }, [user?.currentAccount?.email]);

  const handleOpenDrawer = useCallback(() => {
    setOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setOpen(false);
  }, []);

  const handleClickItem = useCallback(
    (path) => {
      handleCloseDrawer();
      router.push(path);
    },
    [handleCloseDrawer, router]
  );

  const handleSwitchAccount = async (accountId) => {
    if (switching) return;

    setSwitching(true);
    try {
      const response = await fetch(`${CONFIG.site.serverUrl}/api/auth/switch-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ accountId }),
      });

      if (response.ok) {
        // Re-check user session to update with new account
        await checkUserSession();
        // Optionally reload the page to refresh all data
        // window.location.reload();
      } else {
        const error = await response.json();
        console.error('Failed to switch account:', error.message);
      }
    } catch (error) {
      console.error('Error switching account:', error);
    } finally {
      setSwitching(false);
    }
  };

  const renderAvatar = (
    <AnimateAvatar
      width={96}
      slotProps={{
        avatar: { src: user?.photoURL, alt: user?.displayName },
        overlay: {
          border: 2,
          spacing: 3,
          color: `linear-gradient(135deg, ${varAlpha(theme.vars.palette.primary.mainChannel, 0)} 25%, ${theme.vars.palette.primary.main} 100%)`,
        },
      }}
    >
      {user?.displayName?.charAt(0).toUpperCase()}
    </AnimateAvatar>
  );

  const renderBadge = (
    <div className="flex flex-row items-center justify-center gap-1">
      {user?.badgesList?.map((element) => (
        <div key={element._id}>
          <Image
            src={`/logo/${element.iconImage}`}
            alt="Badge"
            width={30}
            height={30}
            className="rounded-md"
          />
        </div>
      ))}
    </div>
  );

  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setOpenComboBox(false);
      }
    };

    if (openComboBox) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openComboBox]);

  const handleComboBoxToggle = (e) => {
    e.stopPropagation();
    setOpenComboBox(!openComboBox);
  };

  const handleComboBoxSelect = async (selectedEmail) => {
    const selectedAccount = user?.accounts.find((account) => account.email === selectedEmail);

    if (selectedAccount && selectedAccount.accountId !== user?.currentAccount?.accountId) {
      setValue(selectedEmail);
      setOpenComboBox(false);
      await handleSwitchAccount(selectedAccount.accountId);
    } else {
      setOpenComboBox(false);
    }
  };

  const renderAccounts = (
    <div ref={popoverRef} style={{ position: 'relative', display: 'inline-block' }}>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={openComboBox}
        className="w-[250px] justify-between rounded"
        onClick={handleComboBoxToggle}
        disabled={switching}
      >
        {switching ? (
          <span>Switching...</span>
        ) : (
          <>
            {value || 'Select account...'}
            <ChevronsUpDown className="opacity-50" />
          </>
        )}
      </Button>
      {openComboBox && (
        <div
          className="rounded"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 1000,
            width: '250px',
            backgroundColor: 'white',
            borderRadius: '6px',
            marginTop: '4px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Command>
            <CommandList>
              <CommandEmpty>No accounts found.</CommandEmpty>
              <CommandGroup>
                {user?.accounts?.map((account) => (
                  <CommandItem
                    key={account.accountId}
                    value={account.email}
                    onSelect={() => handleComboBoxSelect(account.email)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{account.email}</span>
                      <div className="flex items-center gap-2">
                        {account.isPrimary && (
                          <span className="text-xs text-muted-foreground">(Primary)</span>
                        )}
                        <Check
                          className={cn(
                            'ml-2',
                            value === account.email ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );

  return (
    <>
      <AccountButton
        open={open}
        onClick={handleOpenDrawer}
        photoURL={user?.photoURL}
        displayName={user?.displayName}
        sx={sx}
        {...other}
      />

      <Drawer
        open={open}
        onClose={handleCloseDrawer}
        anchor="right"
        slotProps={{ backdrop: { invisible: true } }}
        PaperProps={{ sx: { width: 320, background: 'hsl(var(--black-background))' } }}
      >
        <IconButton
          onClick={handleCloseDrawer}
          sx={{ top: 12, left: 12, zIndex: 9, position: 'absolute' }}
        >
          <Iconify icon="mingcute:close-line" />
        </IconButton>

        <Scrollbar>
          <Stack alignItems="center" sx={{ pt: 8, pb: 3 }}>
            {renderAvatar}
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                mt: 0.5,
                mb: 0.5,
                fontWeight: '600',
                fontStyle: 'italic',
              }}
              noWrap
            >
              {user?.levelTitle}
            </Typography>
            {renderBadge}
            <div className="mt-3 flex flex-col gap-3 items-end">
              <div>{renderAccounts}</div>
              <div>
                <AddAccountButton />
              </div>
            </div>
          </Stack>

          <Stack
            sx={{
              py: 3,
              px: 2.5,
              borderTop: `dashed 1px ${theme.vars.palette.divider}`,
              borderBottom: `dashed 1px ${theme.vars.palette.divider}`,
            }}
          >
            {data.map((option) => {
              const rootLabel = pathname.includes('/dashboard') ? 'Home' : 'Dashboard';
              const rootHref = pathname.includes('/dashboard') ? '/' : paths.dashboard.root;

              return (
                <MenuItem
                  key={option.label}
                  onClick={() => handleClickItem(option.label === 'Home' ? rootHref : option.href)}
                  sx={{
                    py: 1,
                    color: 'text.secondary',
                    '& svg': { width: 24, height: 24 },
                    '&:hover': { color: 'text.primary' },
                  }}
                >
                  {option.icon}

                  <Box component="span" sx={{ ml: 2 }}>
                    {option.label === 'Home' ? rootLabel : option.label}
                  </Box>

                  {option.info && (
                    <Label color="error" sx={{ ml: 1 }}>
                      {option.info}
                    </Label>
                  )}
                </MenuItem>
              );
            })}
          </Stack>
        </Scrollbar>

        <Box sx={{ p: 2.5 }}>
          <SignOutButton onClose={handleCloseDrawer} />
        </Box>
      </Drawer>
    </>
  );
}
