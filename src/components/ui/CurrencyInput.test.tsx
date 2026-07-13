import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import CurrencyInput from "./CurrencyInput";

function CurrencyInputHarness() {
  const [value, setValue] = useState(0);

  return (
    <>
      <CurrencyInput aria-label="Valor" onValueChange={setValue} value={value} />
      <output>{value.toFixed(2)}</output>
    </>
  );
}

describe("CurrencyInput", () => {
  it("formats values using pt-BR currency input behavior", () => {
    render(<CurrencyInputHarness />);

    const input = screen.getByLabelText("Valor");

    expect(input).toHaveValue("R$\u00a00,00");

    fireEvent.change(input, { target: { value: "1234" } });

    expect(input).toHaveValue("R$\u00a012,34");
    expect(screen.getByText("12.34")).toBeInTheDocument();
  });
});
