import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useRef, useState } from "react";
import { vi } from "vitest";
import { t } from "../../test/i18n";
import type { FilterFields } from "../../lib/filterFields";
import FilterToolbar from "./FilterToolbar";

type VisualViewportMock = {
  height: number;
  offsetTop: number;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  dispatch: (eventName: "resize" | "scroll") => void;
};

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
    writable: true,
  });
  window.dispatchEvent(new Event("resize"));
}

function installVisualViewportMock({ height, offsetTop }: { height: number; offsetTop: number }): VisualViewportMock {
  const listeners = new Map<string, Set<() => void>>();
  const addEventListener = vi.fn((eventName: string, listener: () => void) => {
    const group = listeners.get(eventName) ?? new Set<() => void>();
    group.add(listener);
    listeners.set(eventName, group);
  });
  const removeEventListener = vi.fn((eventName: string, listener: () => void) => {
    listeners.get(eventName)?.delete(listener);
  });
  const viewport = {
    height,
    offsetTop,
    addEventListener,
    removeEventListener,
    dispatch(eventName: "resize" | "scroll") {
      listeners.get(eventName)?.forEach((listener) => listener());
    },
  };

  Object.defineProperty(window, "visualViewport", {
    configurable: true,
    value: viewport,
  });

  return viewport;
}

function Harness() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [search, setSearch] = useState("Mercado");

  const fields: FilterFields = {
    search: {
      kind: "text",
      label: t("common.search"),
      value: search,
      defaultValue: "",
      placement: "visible",
      element: <input aria-label={t("common.search")} value={search} onChange={(event) => setSearch(event.target.value)} />,
    },
    status: {
      kind: "select",
      label: t("common.status"),
      value: "",
      defaultValue: "",
      placement: "expanded",
      options: [],
      element: <input aria-label={t("common.status")} />,
    },
  };

  return (
    <FilterToolbar
      fields={fields}
      isPanelOpen={isPanelOpen}
      onClosePanel={() => setIsPanelOpen(false)}
      onResetField={(name, defaultValue) => {
        if (name === "search") {
          setSearch(String(defaultValue));
        }
      }}
      onTogglePanel={() => setIsPanelOpen((current) => !current)}
    />
  );
}

function MobileSearchHarness() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const fields: FilterFields = {
    search: {
      kind: "text",
      label: t("common.search"),
      value: search,
      defaultValue: "",
      placement: "visible",
      element: <input aria-label={t("common.search")} ref={inputRef} value={search} onChange={(event) => setSearch(event.target.value)} />,
    },
    status: {
      kind: "select",
      label: t("common.status"),
      value: "",
      defaultValue: "",
      placement: "expanded",
      options: [],
      element: <input aria-label={t("common.status")} />,
    },
  };

  return (
    <>
      <button
        onClick={() => {
          setIsMobileSearchOpen(true);
          window.requestAnimationFrame(() => inputRef.current?.focus());
        }}
        type="button"
      >
        {t("common.search")}
      </button>
      <FilterToolbar
        fields={fields}
        onCloseMobileSearch={() => setIsMobileSearchOpen(false)}
        isMobileSearchOpen={isMobileSearchOpen}
        isPanelOpen={isPanelOpen}
        onClosePanel={() => setIsPanelOpen(false)}
        onResetField={(name, defaultValue) => {
          if (name === "search") {
            setSearch(String(defaultValue));
          }
        }}
        onTogglePanel={() => setIsPanelOpen((current) => !current)}
      />
    </>
  );
}

describe("FilterToolbar", () => {
  afterEach(() => {
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: undefined,
    });
  });

  it("renders an icon-only filters button, active chips, and toggles the secondary panel on desktop", () => {
    setViewportWidth(1280);
    render(<Harness />);

    expect(screen.getByText(`${t("common.search")}: Mercado`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t("common.clearFilters") })).toBeInTheDocument();
    expect(screen.queryByLabelText(t("common.status"))).not.toBeInTheDocument();
    expect(screen.queryByText(t("common.filters"))).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: t("common.filters") }));

    expect(screen.getByLabelText(t("common.status"))).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: t("common.clearFilters") }));

    expect(screen.queryByText(`${t("common.search")}: Mercado`)).not.toBeInTheDocument();
  });

  it("uses the drawer for tablet-width layouts too", () => {
    setViewportWidth(900);
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: t("common.filters") }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText(t("common.status"))).toBeInTheDocument();
  });

  it("opens the secondary filters inside a drawer on compact screens and closes without clearing", () => {
    setViewportWidth(480);
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: t("common.filters") }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText(t("common.status"))).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: t("common.close") }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText(`${t("common.search")}: Mercado`)).toBeInTheDocument();
  });

  it("clears filters and closes the compact drawer from the mobile action", () => {
    setViewportWidth(480);
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: t("common.filters") }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: t("common.clearFilters") }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText(`${t("common.search")}: Mercado`)).not.toBeInTheDocument();
  });

  it("keeps search hidden by default on mobile and reveals it when requested", () => {
    setViewportWidth(480);
    render(<MobileSearchHarness />);

    expect(screen.queryByLabelText(t("common.search"))).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: t("common.filters") })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: t("common.search") }));

    expect(screen.getByLabelText(t("common.search"))).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: t("common.filters") }).length).toBeGreaterThan(0);
    return waitFor(() => {
      expect(screen.getByLabelText(t("common.search"))).toHaveFocus();
    });
  });

  it("opens extra filters from the mobile search dock and lets the user close the dock independently", async () => {
    setViewportWidth(480);
    render(<MobileSearchHarness />);

    fireEvent.click(screen.getByRole("button", { name: t("common.search") }));

    const filtersButton = screen.getAllByRole("button", { name: t("common.filters") }).at(-1);
    expect(filtersButton).toBeTruthy();
    filtersButton!.focus();
    fireEvent.click(filtersButton!);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByLabelText(t("common.status"))).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: t("common.close") }));

    await waitFor(() => {
      expect(filtersButton!).toHaveFocus();
    });

    fireEvent.click(screen.getByRole("button", { name: t("common.close") }));

    expect(screen.queryByLabelText(t("common.search"))).not.toBeInTheDocument();
  });

  it("repositions the dock and signals keyboard-active when the keyboard opens", async () => {
    setViewportWidth(480);
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 800,
      writable: true,
    });
    const visualViewport = installVisualViewportMock({ height: 800, offsetTop: 0 });

    render(<MobileSearchHarness />);

    fireEvent.click(screen.getByRole("button", { name: t("common.search") }));

    const dock = screen.getByRole("search");
    expect(dock).toHaveStyle("--keyboard-inset: 0px");

    visualViewport.height = 520;
    visualViewport.dispatch("resize");

    await waitFor(() => {
      expect(dock).toHaveStyle("--keyboard-inset: 280px");
      expect(dock).toHaveStyle("--keyboard-active: 1");
    });
  });

  it("keeps the inset at zero when the layout viewport resizes together with the keyboard (Android resizes-content)", async () => {
    setViewportWidth(480);
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 800,
      writable: true,
    });
    const visualViewport = installVisualViewportMock({ height: 800, offsetTop: 0 });

    render(<MobileSearchHarness />);

    fireEvent.click(screen.getByRole("button", { name: t("common.search") }));

    // Simulate Android resizes-content: innerHeight shrinks together with the
    // visual viewport. The layout viewport (anchor of position: fixed) already
    // excludes the keyboard, so the dock must NOT apply an additional offset.
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 520,
      writable: true,
    });
    visualViewport.height = 520;
    window.dispatchEvent(new Event("resize"));
    visualViewport.dispatch("resize");

    const dock = screen.getByRole("search");
    await waitFor(() => {
      expect(dock).toHaveStyle("--keyboard-inset: 0px");
      expect(dock).not.toHaveStyle("--keyboard-active: 1");
    });
  });

  it("dismisses the mobile search dock when the overlay is tapped", async () => {
    setViewportWidth(480);

    render(<MobileSearchHarness />);

    fireEvent.click(screen.getByRole("button", { name: t("common.search") }));
    expect(screen.getByLabelText(t("common.search"))).toBeInTheDocument();

    const overlay = screen.getByRole("button", { name: t("common.closeSearch") });
    fireEvent.click(overlay);

    await waitFor(() => {
      expect(screen.queryByLabelText(t("common.search"))).not.toBeInTheDocument();
    });
  });

  it("does not render the overlay when the mobile search dock is not visible", () => {
    setViewportWidth(480);

    render(<MobileSearchHarness />);

    expect(screen.queryByRole("button", { name: t("common.closeSearch") })).not.toBeInTheDocument();
  });

  it("keeps the mobile search dock stable when visualViewport is unavailable", async () => {
    setViewportWidth(480);

    render(<MobileSearchHarness />);

    fireEvent.click(screen.getByRole("button", { name: t("common.search") }));

    await waitFor(() => {
      expect(screen.getByRole("search")).toHaveStyle("--keyboard-inset: 0px");
    });
  });

  it("hides the mobile search dock when clearing all filters", async () => {
    setViewportWidth(480);
    render(<MobileSearchHarness />);

    fireEvent.click(screen.getByRole("button", { name: t("common.search") }));
    fireEvent.change(screen.getByLabelText(t("common.search")), {
      target: { value: "Mercado" },
    });

    fireEvent.click(screen.getByRole("button", { name: t("common.clearFilters") }));

    await waitFor(() => {
      expect(screen.queryByLabelText(t("common.search"))).not.toBeInTheDocument();
    });
  });

  it("keeps search visible on compact tablet widths when the mobile action bar is not active", () => {
    setViewportWidth(768);
    render(<MobileSearchHarness />);

    expect(screen.getByLabelText(t("common.search"))).toBeInTheDocument();
  });
});
