import { render, screen, fireEvent } from "@testing-library/react";
import Input from "./Input";

describe("Input", () => {
  it("renders with label and placeholder", () => {
    render(
      <label htmlFor="test-input">
        Test Label
        <Input id="test-input" placeholder="Enter value" />
      </label>,
    );
    const input = screen.getByLabelText("Test Label");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", "Enter value");
  });

  it("is disabled when disabled prop is true", () => {
    render(<Input id="disabled-input" disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("shows error styling when hasError is true", () => {
    render(<Input id="error-input" hasError />);
    const input = screen.getByRole("textbox");
    expect(input.className).toMatch(/error/);
  });

  it("fires onChange events", () => {
    render(<Input id="change-input" />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "hello" } });
    expect(input).toHaveValue("hello");
  });
});
