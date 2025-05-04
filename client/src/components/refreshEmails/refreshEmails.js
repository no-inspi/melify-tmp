import { RefreshCw } from 'lucide-react';

import { Button } from 'src/s/components/ui/button';

const RefreshEmails = () => {
  const handleRefresh = async () => {
    // Logic to refresh emails
    console.log('Refreshing emails...');
    await refreshEmails();
    console.log('Emails refreshed');
  };

  const refreshEmails = async () => {
    const response = await fetch(
      `/api/refresh-emails?userEmail=${encodeURIComponent('charlie.apcher@gmail.com')}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  };

  return (
    <div>
      <Button variant="outline" size="icon" onClick={handleRefresh}>
        <RefreshCw />
      </Button>
    </div>
  );
};

export default RefreshEmails;
