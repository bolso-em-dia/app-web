import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PageResponse } from "../app/api/client";

type UseInfinitePageListOptions<T> = {
  enabled: boolean;
  queryKey: string;
  initialPageSize: number;
  loadPage: (page: number, pageSize: number) => Promise<PageResponse<T>>;
};

type UseInfinitePageListReturn<T> = {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  hasLoadedOnce: boolean;
  hasNextPage: boolean;
  error: string | null;
  sentinelRef: (node: HTMLDivElement | null) => void;
  retry: () => void;
};

export function useInfinitePageList<T>({
  enabled,
  queryKey,
  initialPageSize,
  loadPage,
}: UseInfinitePageListOptions<T>): UseInfinitePageListReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [isInitialLoading, setIsInitialLoading] = useState(enabled);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const inFlightRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pageSizeRef = useRef(initialPageSize);
  const loadPageRef = useRef(loadPage);

  useEffect(() => {
    loadPageRef.current = loadPage;
  }, [loadPage]);

  const executeLoad = useCallback(
    async (targetPage: number, replace: boolean) => {
      if (!enabled || inFlightRef.current) {
        return;
      }

      const requestId = ++requestIdRef.current;
      inFlightRef.current = true;
      setError(null);

      if (replace) {
        setIsInitialLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const response = await loadPageRef.current(targetPage, pageSizeRef.current);

        if (requestId !== requestIdRef.current) {
          return;
        }

        setItems((currentItems) => (replace ? response.items : [...currentItems, ...response.items]));
        setTotalItems(response.totalItems);
        setPage(response.page);
        pageSizeRef.current = response.size;
        setPageSize(response.size);
      } catch (loadError) {
        if (requestId === requestIdRef.current) {
          setError(loadError instanceof Error ? loadError.message : "Load failed.");
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setIsInitialLoading(false);
          setIsLoadingMore(false);
          setHasLoadedOnce(true);
        }

        inFlightRef.current = false;
      }
    },
    [enabled],
  );

  useEffect(() => {
    requestIdRef.current += 1;
    inFlightRef.current = false;
    setItems([]);
    setTotalItems(0);
    setPage(0);
    pageSizeRef.current = initialPageSize;
    setPageSize(initialPageSize);
    setError(null);
    setHasLoadedOnce(false);
    setIsLoadingMore(false);
    setIsInitialLoading(enabled);

    if (!enabled) {
      return;
    }

    void executeLoad(0, true);
  }, [enabled, executeLoad, initialPageSize, queryKey]);

  const hasNextPage = useMemo(() => {
    if (totalItems === 0) {
      return false;
    }

    return items.length < totalItems;
  }, [items.length, totalItems]);

  const loadNextPage = useCallback(() => {
    if (!enabled || !hasLoadedOnce || isInitialLoading || isLoadingMore) {
      return;
    }

    if (!hasNextPage) {
      return;
    }

    void executeLoad(page + 1, false);
  }, [enabled, executeLoad, hasLoadedOnce, hasNextPage, isInitialLoading, isLoadingMore, page]);

  const retry = useCallback(() => {
    void executeLoad(items.length === 0 ? 0 : page + 1, items.length === 0);
  }, [executeLoad, items.length, page]);

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      observerRef.current?.disconnect();

      if (
        !node ||
        !enabled ||
        !hasLoadedOnce ||
        isInitialLoading ||
        isLoadingMore ||
        !hasNextPage ||
        typeof IntersectionObserver === "undefined"
      ) {
        return;
      }

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting) {
          loadNextPage();
        }
      });

      observerRef.current.observe(node);
    },
    [enabled, hasLoadedOnce, hasNextPage, isInitialLoading, isLoadingMore, loadNextPage],
  );

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return {
    items,
    totalItems,
    page,
    pageSize,
    isInitialLoading,
    isLoadingMore,
    hasLoadedOnce,
    hasNextPage,
    error,
    sentinelRef,
    retry,
  };
}
