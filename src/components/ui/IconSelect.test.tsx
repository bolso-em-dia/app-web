import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { ptBRMessages } from "../../app/i18n/messages";
import { buildIconOptions } from "../../lib/uiOptions";
import IconSelect from "./IconSelect";

const iconOptions = buildIconOptions((key) => ptBRMessages[key]);

function IconSelectHarness() {
  const [value, setValue] = useState("");

  return (
    <>
      <IconSelect clearLabel="Sem ícone" id="category-icon" onChange={setValue} options={iconOptions.slice(0, 3)} value={value} />
      <output>{value || "empty"}</output>
    </>
  );
}

describe("IconSelect", () => {
  it("uses the same dropdown pattern and allows clearing the selection", () => {
    render(<IconSelectHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Sem ícone" }));
    fireEvent.click(screen.getByRole("option", { name: "Compras" }));
    expect(screen.getByText("shopping-cart")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Compras" }));
    fireEvent.click(screen.getByRole("option", { name: "Sem ícone" }));
    expect(screen.getByText("empty")).toBeInTheDocument();
  });
});
