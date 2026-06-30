import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { COLOR_OPTIONS } from "../../lib/uiOptions";
import ColorSwatchSelect from "./ColorSwatchSelect";

function ColorSwatchSelectHarness() {
  const [value, setValue] = useState("");

  return (
    <>
      <ColorSwatchSelect
        clearLabel="Sem cor"
        id="category-color"
        onChange={setValue}
        options={COLOR_OPTIONS.slice(0, 3)}
        value={value}
      />
      <output>{value || "empty"}</output>
    </>
  );
}

describe("ColorSwatchSelect", () => {
  it("shows colored dropdown options and allows clearing the selection", () => {
    render(<ColorSwatchSelectHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Sem cor" }));
    fireEvent.click(screen.getByRole("option", { name: "Vermelho" }));
    expect(screen.getByText("#ef4444")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Vermelho" }));
    fireEvent.click(screen.getByRole("option", { name: "Sem cor" }));
    expect(screen.getByText("empty")).toBeInTheDocument();
  });
});
