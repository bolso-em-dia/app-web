import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { TestAuthProvider } from "../../app/auth/TestAuthProvider";
import Select from "./Select";

function renderSelect(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <TestAuthProvider
        user={{
          id: "1",
          name: "Admin",
          email: "admin@bolso-em-dia.local",
          role: "ADMIN",
          allowanceEnabled: false,
        }}
      >
        {ui}
      </TestAuthProvider>
    </MemoryRouter>,
  );
}

describe("Select (native mode)", () => {
  it("renders options", () => {
    renderSelect(
      <label htmlFor="test-select">
        Choose
        <Select id="test-select" defaultValue="a">
          <option value="a">Option A</option>
          <option value="b">Option B</option>
        </Select>
      </label>,
    );

    expect(screen.getByRole("combobox", { name: "Choose" })).toHaveValue("a");
    expect(screen.getByRole("option", { name: "Option A" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Option B" })).toBeInTheDocument();
  });

  it("fires onChange", () => {
    const handleChange = vi.fn();

    renderSelect(
      <Select data-testid="change-select" defaultValue="a" id="change-select" onChange={handleChange}>
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>,
    );

    const select = screen.getByTestId("change-select");

    fireEvent.change(select, { target: { value: "b" } });

    expect(select).toHaveValue("b");
    expect(handleChange).toHaveBeenCalledTimes(1);
  });
});

describe("Select (component mode)", () => {
  it("renders with initial value", () => {
    renderSelect(
      <Select
        id="mode-select"
        value="a"
        options={[
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta" },
        ]}
        placeholder="Select"
        onValueChange={() => {}}
      />,
    );
    expect(screen.getByText("Alpha")).toBeInTheDocument();
  });
});
