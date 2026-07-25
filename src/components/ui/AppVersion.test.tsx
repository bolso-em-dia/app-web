import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";
import { TestAuthProvider } from "../../app/auth/TestAuthProvider";
import AppVersion from "./AppVersion";

function renderAppVersion() {
  return render(
    <MemoryRouter>
      <TestAuthProvider user={{ id: "1", name: "Admin", email: "admin@bolso-em-dia.local", role: "ADMIN", allowanceEnabled: false }}>
        <AppVersion />
      </TestAuthProvider>
    </MemoryRouter>,
  );
}

describe("AppVersion", () => {
  afterEach(() => {
    delete window.__APP_CONFIG__;
  });

  it("renders the API version from the configured runtime base URL", async () => {
    window.__APP_CONFIG__ = {
      apiBaseUrl: "http://localhost:8081",
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({
        "content-type": "application/json",
      }),
      text: async () => JSON.stringify({ version: "1.0.0-test" }),
    } as Response);

    renderAppVersion();

    await waitFor(() => {
      expect(screen.getByText(/· api 1.0.0-test/)).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith("http://localhost:8081/api/version", { credentials: "include" });
  });

  it("ignores html responses instead of rendering them as the API version", async () => {
    window.__APP_CONFIG__ = {
      apiBaseUrl: "http://localhost:8081",
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({
        "content-type": "text/html; charset=UTF-8",
      }),
      text: async () => '<!doctype html><html lang="pt-BR"></html>',
    } as Response);

    renderAppVersion();

    await waitFor(() => {
      expect(screen.getByText(/web /)).toBeInTheDocument();
    });

    expect(screen.queryByText(/· api /)).not.toBeInTheDocument();
  });

  it("ignores non-json plain text responses that do not match the new contract", async () => {
    window.__APP_CONFIG__ = {
      apiBaseUrl: "http://localhost:8081",
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({
        "content-type": "text/plain; charset=UTF-8",
      }),
      text: async () => "1.0.0-test",
    } as Response);

    renderAppVersion();

    await waitFor(() => {
      expect(screen.getByText(/web /)).toBeInTheDocument();
    });

    expect(screen.queryByText(/· api /)).not.toBeInTheDocument();
  });

  it("ignores json responses without a version field", async () => {
    window.__APP_CONFIG__ = {
      apiBaseUrl: "http://localhost:8081",
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({
        "content-type": "application/json",
      }),
      text: async () => JSON.stringify({}),
    } as Response);

    renderAppVersion();

    await waitFor(() => {
      expect(screen.getByText(/web /)).toBeInTheDocument();
    });

    expect(screen.queryByText(/· api /)).not.toBeInTheDocument();
  });
});
