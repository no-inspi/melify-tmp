'use client';

import { useState } from 'react';
import { Button } from 'src/s/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useAuthContext } from 'src/auth/hooks';
import { CONFIG } from 'src/config-global';

export function AddAccountButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthContext();

  const generateAddAccountUrl = () => {
    const CLIENT_ID = CONFIG.site.googleclientid;
    const REDIRECT_URI = `${CONFIG.site.serverUrl}/api/auth/googleredirect`;
    const SCOPES = encodeURIComponent(
      'profile email https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events'
    );

    // Create state object with isAddingAccount flag and current user ID
    const stateObj = {
      isAddingAccount: true,
      userId: user?.id,
    };

    const stateParam = encodeURIComponent(JSON.stringify(stateObj));

    return `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPES}&access_type=offline&prompt=consent&state=${stateParam}`;
  };

  const handleAddAccount = () => {
    if (!user?.id) {
      console.error('User must be logged in to add an account');
      return;
    }

    setIsLoading(true);
    try {
      const authUrl = generateAddAccountUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error generating auth URL:', error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleAddAccount}
      disabled={isLoading || !user}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <PlusCircle className="h-4 w-4" />
      {isLoading ? 'Adding...' : 'Add Account'}
    </Button>
  );
}
