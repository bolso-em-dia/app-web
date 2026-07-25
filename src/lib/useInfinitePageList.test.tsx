import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PageResponse } from "../app/api/client";
import { useInfinitePageList } from "./useInfinitePageList";

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error?: unknown) => void;
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });

  return { promise, resolve, reject };
}

type Item = { id: string };

function createPageResponse(page: number, items: Item[], totalItems = items.length): PageResponse<Item> {
  return {
    items,
    page,
    size: 2,
    totalItems,
    totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / 2),
  };
}

describe("useInfinitePageList", () => {
  it("keeps the in-flight lock while the latest request is still pending", async () => {
    const firstRequest = createDeferred<PageResponse<Item>>();
    const secondRequest = createDeferred<PageResponse<Item>>();
    const loadPage = vi
      .fn<(page: number, pageSize: number) => Promise<PageResponse<Item>>>()
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise);

    const { result, rerender } = renderHook(
      ({ queryKey }) =>
        useInfinitePageList({
          enabled: true,
          initialPageSize: 2,
          loadPage,
          queryKey,
        }),
      {
        initialProps: { queryKey: "first" },
      },
    );

    await act(async () => {});
    rerender({ queryKey: "second" });

    await act(async () => {});

    expect(loadPage).toHaveBeenCalledTimes(2);

    await act(async () => {
      firstRequest.resolve(createPageResponse(0, [{ id: "stale" }], 1));
      await firstRequest.promise;
    });

    const sentinel = document.createElement("div");
    act(() => {
      result.current.sentinelRef(sentinel);
    });

    expect(loadPage).toHaveBeenCalledTimes(2);

    await act(async () => {
      secondRequest.resolve(createPageResponse(0, [{ id: "fresh" }], 1));
      await secondRequest.promise;
    });

    await waitFor(() => {
      expect(result.current.items).toEqual([{ id: "fresh" }]);
    });
  });
});
