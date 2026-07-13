import { useEffect, useState } from "react";

type CacheEntry<T> = {
  data?: T;
  promise?: Promise<T>;
};

const optionsResourceCache = new Map<string, CacheEntry<unknown>>();

export function clearCachedOptionsResources() {
  optionsResourceCache.clear();
}

export function useCachedOptionsResource<T>(
  cacheKey: string | null,
  load: () => Promise<T>,
) {
  const cachedEntry = cacheKey
    ? (optionsResourceCache.get(cacheKey) as CacheEntry<T> | undefined)
    : undefined;

  const [data, setData] = useState<T | undefined>(cachedEntry?.data);
  const [isLoading, setIsLoading] = useState(
    Boolean(cacheKey) && cachedEntry?.data === undefined,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cacheKey) {
      setData(undefined);
      setIsLoading(false);
      setError(null);
      return;
    }

    let active = true;
    const currentEntry = optionsResourceCache.get(cacheKey) as
      CacheEntry<T> | undefined;

    if (currentEntry?.data !== undefined) {
      setData(currentEntry.data);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const promise = currentEntry?.promise ?? load();
    optionsResourceCache.set(cacheKey, { ...currentEntry, promise });

    promise
      .then((result) => {
        optionsResourceCache.set(cacheKey, { data: result });

        if (!active) {
          return;
        }

        setData(result);
        setIsLoading(false);
      })
      .catch(() => {
        optionsResourceCache.delete(cacheKey);

        if (!active) {
          return;
        }

        setError("load_failed");
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [cacheKey, load]);

  return {
    data,
    isLoading,
    error,
  };
}
