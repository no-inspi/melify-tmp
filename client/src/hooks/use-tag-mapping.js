import { useState, useEffect } from 'react';

import { CONFIG } from 'src/config-global';

const useTagMapping = (userEmail) => {
  const [tagMapping, setTagMapping] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTagMapping = async () => {
      try {
        const response = await fetch(`${CONFIG.site.serverUrl}/api/users/tagMapping/${userEmail}`);
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();
        setTagMapping(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTagMapping();
  }, [userEmail]);

  return { tagMapping, loading, error };
};

export default useTagMapping;
