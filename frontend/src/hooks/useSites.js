import React, { useState, useEffect } from 'react';
import { siteService } from '../services/siteService';

export const useSites = (params) => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({});

  const fetchSites = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await siteService.getAll(params);
      setSites(data.data);
      setMeta(data.meta || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sites');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => { fetchSites(); }, [fetchSites]);
  return { sites, loading, error, meta, refetch: fetchSites };
};
