import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { TestAuthProvider } from "../../app/auth/TestAuthProvider";
import { t } from "../../test/i18n";
import PaginationBar from "./PaginationBar";

function renderPaginationBar(props: {
  loaded: number;
  total: number;
  isLoadingMore: boolean;
  hasNextPage: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  return render(
    <MemoryRouter>
      <TestAuthProvider
        user={{
          id: "1",
          name: "Admin",
          email: "admin@bolso-em-dia.local",
          role: "ADMIN",
          allowanceEnabled: false,
        }}
      >
        <PaginationBar {...props} />
      </TestAuthProvider>
    </MemoryRouter>,
  );
}

describe("PaginationBar", () => {
  const defaultProps = {
    loaded: 12,
    total: 100,
    isLoadingMore: false,
    hasNextPage: true,
  };

  it("renders loaded summary", () => {
    renderPaginationBar(defaultProps);
    expect(screen.getByText(t("common.loadedItems", { loaded: 12, total: 100 }))).toBeInTheDocument();
  });

  it("shows scroll hint when there are more pages", () => {
    renderPaginationBar(defaultProps);
    expect(screen.getByText(t("common.scrollToLoadMore"))).toBeInTheDocument();
  });

  it("shows loading state", () => {
    renderPaginationBar({ ...defaultProps, isLoadingMore: true });
    expect(screen.getByText(t("common.loadingMore"))).toBeInTheDocument();
  });

  it("shows completion state", () => {
    renderPaginationBar({ ...defaultProps, loaded: 100, hasNextPage: false });
    expect(screen.getByText(t("common.allItemsLoaded"))).toBeInTheDocument();
  });

  it("allows retry after error", () => {
    const onRetry = vi.fn();
    renderPaginationBar({
      ...defaultProps,
      error: "Falha ao carregar.",
      onRetry,
    });
    fireEvent.click(screen.getByRole("button", { name: t("common.retry") }));
    expect(onRetry).toHaveBeenCalled();
  });
});
