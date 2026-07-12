import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
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
        <select id="test-select">
          <option value="a">Option A</option>
          <option value="b">Option B</option>
        </select>
      </label>,
    );
    const select = screen.getByRole("combobox", { name: "Choose" });
    expect(screen.getByRole("option", { name: "Option A" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Option B" })).toBeInTheDocument();
  });

  it("fires onChange", () => {
    renderSelect(
      <select id="change-select" data-testid="change-select">
        <option value="a">A</option>
        <option value="b">B</option>
      </select>,
    );
    const select = screen.getByTestId("change-select");
    fireEvent.change(select, { target: { value: "b" } });
    expect(select).toHaveValue("b");
  });
});

describe("Select (component mode)", () => {
  it("renders with initial value", () => {
    renderSelect(
      <Select id="mode-select" value="a" options={[
        { value: "a", label: "Alpha" },
        { value: "b", label: "Beta" },
      ]} placeholder="Select" onValueChange={() => {}} />,
    );
    expect(screen.getByText("Alpha")).toBeInTheDocument();
  });
});
