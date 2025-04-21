import { useState, useEffect } from 'react';

import { CONFIG } from 'src/config-global';

const useContactsSearch = (userEmail) => {
  const [contacts, setContacts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTagMapping = async () => {
      try {
        const response = await fetch(
          `${CONFIG.site.serverUrl}/api/users/email_contacts/${userEmail}`
        );
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();
        setContacts(data.contacts);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTagMapping();
  }, [userEmail]);

  return { contacts, loading, error };
};

export default useContactsSearch;
