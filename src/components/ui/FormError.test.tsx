import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FormError from "./FormError";

describe("FormError", () => {
  it("renders nothing when children are falsy", () => {
    const { container } = render(<FormError>{null}</FormError>);

    expect(container.firstChild).toBeNull();
  });

  it("renders children with an alert role", () => {
    render(<FormError>Server error occurred</FormError>);

    expect(screen.getByRole("alert")).toHaveTextContent("Server error occurred");
  });
});
