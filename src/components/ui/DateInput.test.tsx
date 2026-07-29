import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import DateInput from "./DateInput";

describe("DateInput", () => {
  it("renders ISO values in BR date format", () => {
    render(<DateInput aria-label="date-input" onChange={vi.fn()} value="2026-07-03" />);

    expect(screen.getByRole("textbox", { name: "date-input" })).toHaveValue("03/07/2026");
  });

  it("emits ISO values when the typed BR date becomes valid", () => {
    const handleChange = vi.fn();

    render(<DateInput aria-label="date-input" onChange={handleChange} value="" />);

    fireEvent.focus(screen.getByRole("textbox", { name: "date-input" }));
    fireEvent.change(screen.getByRole("textbox", { name: "date-input" }), { target: { value: "03072026" } });

    expect(screen.getByRole("textbox", { name: "date-input" })).toHaveValue("03/07/2026");
    expect(handleChange).toHaveBeenCalledWith("2026-07-03");
  });

  it("restores the last valid value on blur when the typed value is incomplete", () => {
    const handleChange = vi.fn();

    render(<DateInput aria-label="date-input" onChange={handleChange} value="2026-07-03" />);

    const input = screen.getByRole("textbox", { name: "date-input" });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "12" } });
    fireEvent.blur(input);

    expect(input).toHaveValue("03/07/2026");
    expect(handleChange).not.toHaveBeenLastCalledWith("");
  });
});
