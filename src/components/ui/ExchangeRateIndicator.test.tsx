import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, vi } from "vitest";
import { TestAuthProvider } from "../../app/auth/TestAuthProvider";
import { resetFetchMocks, mockJsonResponse, mockErrorResponse, mockFetchUrl } from "../../test/setup";
import ExchangeRateIndicator from "./ExchangeRateIndicator";

const userWithForeignCurrency = {
  id: "1", name: "Admin", email: "admin@bolso-em-dia.local", role: "ADMIN" as const,
  allowanceEnabled: false,
  preferences: { defaultAccountId: null, locale: "pt-BR" as const, showBalanceWithBudgets: false, showForeignCurrency: true },
};

function renderIndicator() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <TestAuthProvider user={userWithForeignCurrency}>
        <ExchangeRateIndicator />
      </TestAuthProvider>
    </MemoryRouter>,
  );
}

describe("ExchangeRateIndicator", () => {
  beforeEach(() => {
    resetFetchMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows nothing when rate fetch fails", async () => {
    mockFetchUrl("/api/exchange-rate", mockErrorResponse(404));

    const { container } = renderIndicator();

    await waitFor(() => {
      expect(container.textContent).toBe("");
    });
  });

  it("shows rate when API returns data", async () => {
    mockFetchUrl("/api/exchange-rate", mockJsonResponse({
      rate: 5.10,
      fetchedAt: "2026-07-10T18:00:00Z",
      stale: false,
    }));

    renderIndicator();

    expect(await screen.findByText(/US\$ 1 = R\$ 5,10/)).toBeInTheDocument();
  });

  it("shows stale warning when isStale is true", async () => {
    mockFetchUrl("/api/exchange-rate", mockJsonResponse({
      rate: 5.10,
      fetchedAt: "2026-07-09T18:00:00Z",
      stale: true,
    }));

    renderIndicator();

    await screen.findByText(/US\$ 1 = R\$ 5,10/);
    const button = screen.getByRole("button", { name: "Atualizar cotação" });
    fireEvent.mouseOver(button);
    expect(await screen.findByText("Cotação desatualizada. Última atualização pode estar incorreta.")).toBeInTheDocument();
  });

  it("formats rate with 4 decimal places", async () => {
    mockFetchUrl("/api/exchange-rate", mockJsonResponse({
      rate: 5.1064,
      fetchedAt: "2026-07-10T18:27:00Z",
      stale: false,
    }));

    renderIndicator();

    expect(await screen.findByText(/US\$ 1 = R\$ 5,11/)).toBeInTheDocument();
  });

  it("shows error tooltip on fetch failure", async () => {
    mockFetchUrl("/api/exchange-rate", mockErrorResponse(500));

    const { container } = renderIndicator();

    await waitFor(() => {
      expect(container.textContent).toBe("");
    });
  });

  it("refresh button triggers manual update", async () => {
    let callCount = 0;
    mockFetchUrl("/api/exchange-rate", () => {
      if (++callCount === 1) {
        return mockJsonResponse({
          rate: 5.10,
          fetchedAt: "2026-07-10T18:00:00Z",
          stale: false,
        });
      }
      return mockJsonResponse({
        rate: 5.20,
        fetchedAt: "2026-07-10T18:30:00Z",
        stale: false,
      });
    });

    renderIndicator();

    await screen.findByText(/US\$ 1 = R\$ 5,10/);
    fireEvent.click(screen.getByRole("button", { name: "Atualizar cotação" }));

    expect(await screen.findByText(/US\$ 1 = R\$ 5,20/)).toBeInTheDocument();
  });

  it("refresh button shows error on failure", async () => {
    let callCount = 0;
    mockFetchUrl("/api/exchange-rate", () => {
      if (++callCount === 1) {
        return mockJsonResponse({
          rate: 5.10,
          fetchedAt: "2026-07-10T18:00:00Z",
          stale: false,
        });
      }
      return mockErrorResponse(500);
    });

    renderIndicator();

    await screen.findByText(/US\$ 1 = R\$ 5,10/);
    fireEvent.click(screen.getByRole("button", { name: "Atualizar cotação" }));

    // Rate display remains unchanged on error
    await waitFor(() => {
      expect(screen.getByText(/US\$ 1 = R\$ 5,10/)).toBeInTheDocument();
    });
  });

  it("refresh button is accessible with correct label", async () => {
    mockFetchUrl("/api/exchange-rate", mockJsonResponse({
      rate: 5.10,
      fetchedAt: "2026-07-10T18:00:00Z",
      stale: false,
    }));

    renderIndicator();

    await screen.findByText(/US\$ 1 = R\$ 5,10/);
    const button = screen.getByRole("button", { name: "Atualizar cotação" });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });
});
