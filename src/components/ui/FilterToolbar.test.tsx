import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { t } from "../../test/i18n";
import type { FilterFields } from "../../lib/filterFields";
import FilterToolbar from "./FilterToolbar";

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
    writable: true,
  });
  window.dispatchEvent(new Event("resize"));
}

function Harness() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [search, setSearch] = useState("Mercado");

  const fields: FilterFields = {
    search: {
      kind: "text",
      label: "Buscar",
      value: search,
      defaultValue: "",
      placement: "visible",
      element: <input aria-label="Busca principal" />,
    },
    status: {
      kind: "select",
      label: "Status",
      value: "",
      defaultValue: "",
      placement: "expanded",
      options: [],
      element: <input aria-label="Status secundário" />,
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

describe("FilterToolbar", () => {
  it("renders active chips and toggles the secondary panel on desktop", () => {
    setViewportWidth(1280);
    render(<Harness />);

    expect(screen.getByText(`${t("common.search")}: Mercado`)).toBeInTheDocument();
    expect(screen.queryByLabelText("Status secundário")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: `${t("common.filters")} (1)` }));

    expect(screen.getByLabelText("Status secundário")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: t("common.clearFilters") }));

    expect(screen.queryByText("Buscar: Mercado")).not.toBeInTheDocument();
  });

  it("uses the drawer for tablet-width layouts too", () => {
    setViewportWidth(900);
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: `${t("common.filters")} (1)` }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Status secundário")).toBeInTheDocument();
  });

  it("opens the secondary filters inside a drawer on compact screens", () => {
    setViewportWidth(480);
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: `${t("common.filters")} (1)` }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Status secundário")).toBeInTheDocument();
  });
});
