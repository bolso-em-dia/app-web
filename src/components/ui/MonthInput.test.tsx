import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import MonthInput from "./MonthInput";

describe("MonthInput", () => {
  it("renders ISO values in BR month format", () => {
    render(<MonthInput aria-label="month-input" onChange={vi.fn()} value="2026-07-01" />);

    expect(screen.getByRole("textbox", { name: "month-input" })).toHaveValue("07/2026");
  });

  it("emits ISO values when the typed BR month becomes valid", () => {
    const handleChange = vi.fn();

    render(<MonthInput aria-label="month-input" onChange={handleChange} value="" />);

    fireEvent.focus(screen.getByRole("textbox", { name: "month-input" }));
    fireEvent.change(screen.getByRole("textbox", { name: "month-input" }), { target: { value: "072026" } });

    expect(screen.getByRole("textbox", { name: "month-input" })).toHaveValue("07/2026");
    expect(handleChange).toHaveBeenCalledWith("2026-07-01");
  });

  it("restores the last valid value on blur when the typed value is incomplete", () => {
    const handleChange = vi.fn();

    render(<MonthInput aria-label="month-input" onChange={handleChange} value="2026-07-01" />);

    const input = screen.getByRole("textbox", { name: "month-input" });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "12" } });
    fireEvent.blur(input);

    expect(input).toHaveValue("07/2026");
    expect(handleChange).not.toHaveBeenLastCalledWith("");
  });
});
