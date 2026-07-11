import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { TestAuthProvider } from "../../app/auth/TestAuthProvider";
import ExchangeRateIndicator from "./ExchangeRateIndicator";

function renderIndicator() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <TestAuthProvider user={{ id: "1", name: "Admin", email: "admin@bolso-em-dia.local", role: "ADMIN", allowanceEnabled: false }}>
        <ExchangeRateIndicator />
      </TestAuthProvider>
    </MemoryRouter>,
  );
}

describe("ExchangeRateIndicator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("MODE", "production");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("shows nothing when rate fetch fails", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({}),
      text: async () => "",
    } as Response);

    const { container } = renderIndicator();

    await waitFor(() => {
      expect(container.textContent).toBe("");
    });
  });

  it("shows rate when API returns data", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ rate: 5.10, fetchedAt: "2026-07-10T18:00:00Z", stale: false }),
      text: async () => "",
    } as Response);

    renderIndicator();

    expect(await screen.findByText(/US\$ 1 = R\$ 5,10/)).toBeInTheDocument();
  });

  it("shows stale warning when isStale is true", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ rate: 5.10, fetchedAt: "2026-07-09T18:00:00Z", stale: true }),
      text: async () => "",
    } as Response);

    renderIndicator();

    await screen.findByText(/US\$ 1 = R\$ 5,10/);
    const button = screen.getByRole("button", { name: "Atualizar cotação" });
    fireEvent.mouseOver(button);
    expect(await screen.findByText("Cotação desatualizada. Última atualização pode estar incorreta.")).toBeInTheDocument();
  });

  it("formats rate with 4 decimal places", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ rate: 5.1064, fetchedAt: "2026-07-10T18:27:00Z", stale: false }),
      text: async () => "",
    } as Response);

    renderIndicator();

    expect(await screen.findByText(/US\$ 1 = R\$ 5,11/)).toBeInTheDocument();
  });

  it("shows error tooltip on fetch failure", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
      text: async () => "",
    } as Response);

    const { container } = renderIndicator();

    await waitFor(() => {
      expect(container.textContent).toBe("");
    });
  });

  it("refresh button triggers manual update", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => ({ rate: 5.10, fetchedAt: "2026-07-10T18:00:00Z", stale: false }),
        text: async () => "",
      } as Response)
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => ({ rate: 5.20, fetchedAt: "2026-07-10T18:30:00Z", stale: false }),
        text: async () => "",
      } as Response);

    renderIndicator();

    await screen.findByText(/US\$ 1 = R\$ 5,10/);
    fireEvent.click(screen.getByRole("button", { name: "Atualizar cotação" }));

    expect(await screen.findByText(/US\$ 1 = R\$ 5,20/)).toBeInTheDocument();
  });

  it("refresh button shows error on failure", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => ({ rate: 5.10, fetchedAt: "2026-07-10T18:00:00Z", stale: false }),
        text: async () => "",
      } as Response)
      .mockResolvedValueOnce({
        ok: false, status: 500,
        json: async () => ({}),
        text: async () => "",
      } as Response);

    renderIndicator();

    await screen.findByText(/US\$ 1 = R\$ 5,10/);
    fireEvent.click(screen.getByRole("button", { name: "Atualizar cotação" }));

    // Rate display remains unchanged on error
    await waitFor(() => {
      expect(screen.getByText(/US\$ 1 = R\$ 5,10/)).toBeInTheDocument();
    });
  });
});
