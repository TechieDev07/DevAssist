import { useState, useCallback } from 'react';

/**
 * Generic hook for calling API functions.
 * @param {Function} apiFn - API function to call
 * @returns {{ execute, data, loading, error, reset }}
 */
export function useApi(apiFn) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFn(...args);
        setData(res.data);
        return res.data;
      } catch (err) {
        setError(err.message || 'An error occurred.');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFn]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { execute, data, loading, error, reset };
}
