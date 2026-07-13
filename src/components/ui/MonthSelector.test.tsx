import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { t } from "../../test/i18n";
import MonthSelector from "./MonthSelector";

describe("MonthSelector", () => {
  it("renders with the current month value", () => {
    render(<MonthSelector onChange={vi.fn()} value="2026-07-01" />);

    const input = screen.getByDisplayValue("2026-07");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "month");
  });

  it("calls onChange with the previous month when the previous button is clicked", () => {
    const handleChange = vi.fn();

    render(<MonthSelector onChange={handleChange} value="2026-07-01" />);

    fireEvent.click(screen.getByRole("button", { name: t("common.previousMonth") }));
    expect(handleChange).toHaveBeenCalledWith("2026-06-01");
  });

  it("calls onChange with the next month when the next button is clicked", () => {
    const handleChange = vi.fn();

    render(<MonthSelector onChange={handleChange} value="2026-07-01" />);

    fireEvent.click(screen.getByRole("button", { name: t("common.nextMonth") }));
    expect(handleChange).toHaveBeenCalledWith("2026-08-01");
  });

  it("calls onChange when the month input value changes", () => {
    const handleChange = vi.fn();

    render(<MonthSelector onChange={handleChange} value="2026-07-01" />);

    const input = screen.getByDisplayValue("2026-07");
    fireEvent.change(input, { target: { value: "2026-03" } });

    expect(handleChange).toHaveBeenCalledWith("2026-03-01");
  });
});
