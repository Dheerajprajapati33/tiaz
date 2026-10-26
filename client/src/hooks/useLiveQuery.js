import { useState, useEffect, useCallback, useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

/**
 * useLiveQuery - Thin wrapper over @tanstack/react-query for auto-polling & live background sync.
 *
 * Cached data is served instantly (0ms) on mount/navigation while react-query
 * refreshes in the background — no manual API calls or browser refreshes needed.
 *
 * @param {Object} options
 * @param {Array|string} options.queryKey - Array or key identifying this query
 * @param {Function} options.queryFn - Async function returning response payload
 * @param {number} [options.refetchInterval=3000] - Polling interval in ms (default 3s)
 * @param {boolean} [options.refetchOnWindowFocus=true] - Auto-refetch when user returns to tab
 * @param {boolean} [options.enabled=true] - Whether query is active
 */
export function useLiveQuery({
  queryKey = [],
  queryFn,
  refetchInterval = 3000,
  refetchOnWindowFocus = true,
  enabled = true,
}) {
  const serializedKey = JSON.stringify(queryKey);
  const stableKey = useMemo(
    () => (Array.isArray(queryKey) ? queryKey : [queryKey]),
    [serializedKey],
  ); // eslint-disable-line react-hooks/exhaustive-deps

  const {
    data: response,
    isPending,
    isFetching,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: stableKey,
    queryFn,
    enabled,
    staleTime: 0, // always consider data stale -> silent background refresh on every mount/focus
    gcTime: 10 * 60 * 1000, // keep cache alive so revisiting a page renders instantly
    refetchInterval,
    refetchIntervalInBackground: false, // conserve bandwidth when tab hidden
    refetchOnWindowFocus,
    refetchOnMount: true,
    retry: 1,
    placeholderData: keepPreviousData,
  });

  const data = response?.data || response || null;

  // Surface errors only when there is no cached data to show (same behaviour as before)
  const error =
    data === null && queryError
      ? queryError.message || "Failed to fetch live data"
      : null;
  const loading = isPending && !data;

  const [lastUpdated, setLastUpdated] = useState(null);
  useEffect(() => {
    if (data) setLastUpdated(new Date());
  }, [data]);

  const executeRefetch = useCallback(() => refetch(), [refetch]);

  return {
    data,
    loading,
    isFetching,
    error,
    lastUpdated,
    refetch: executeRefetch,
  };
}
