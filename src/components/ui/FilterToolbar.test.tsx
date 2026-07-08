import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
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

  const activeFilters = search
    ? [
        {
          key: "search",
          label: `Buscar: ${search}`,
          onRemove: () => setSearch(""),
        },
      ]
    : [];

  return (
    <FilterToolbar
      activeFilters={activeFilters}
      isPanelOpen={isPanelOpen}
      onClearFilters={() => setSearch("")}
      onClosePanel={() => setIsPanelOpen(false)}
      onTogglePanel={() => setIsPanelOpen((current) => !current)}
      primaryContent={<input aria-label="Busca principal" />}
      secondaryContent={<input aria-label="Status secundário" />}
    />
  );
}

describe("FilterToolbar", () => {
  it("renders active chips and toggles the secondary panel on desktop", () => {
    setViewportWidth(1280);
    render(<Harness />);

    expect(screen.getByText("Buscar: Mercado")).toBeInTheDocument();
    expect(screen.queryByLabelText("Status secundário")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Filtros (1)" }));

    expect(screen.getByLabelText("Status secundário")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));

    expect(screen.queryByText("Buscar: Mercado")).not.toBeInTheDocument();
  });

  it("uses the drawer for tablet-width layouts too", () => {
    setViewportWidth(900);
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Filtros (1)" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Status secundário")).toBeInTheDocument();
  });

  it("opens the secondary filters inside a drawer on compact screens", () => {
    setViewportWidth(480);
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Filtros (1)" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Status secundário")).toBeInTheDocument();
  });
});
