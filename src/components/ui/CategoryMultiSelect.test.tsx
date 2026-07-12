import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import CategoryMultiSelect from "./CategoryMultiSelect";
import type { CategoryOption } from "../../app/api/categories";

const OPTIONS: CategoryOption[] = [
  {
    id: "cat-1",
    name: "Groceries",
    icon: "shopping-cart",
    color: "#2254d1",
  },
  {
    id: "cat-2",
    name: "Transport",
    icon: "car",
    color: "#14a44d",
  },
];

function Harness() {
  const [value, setValue] = useState<string[]>([]);

  return (
    <CategoryMultiSelect
      id="category-multi-select"
      onChange={setValue}
      options={OPTIONS}
      placeholder="Selecione categorias"
      value={value}
    />
  );
}

describe("CategoryMultiSelect", () => {
  it("allows selecting multiple categories and shows selected labels with icons", () => {
    render(<Harness />);

    fireEvent.click(
      screen.getByRole("button", { name: /Selecione categorias/i }),
    );

    const listbox = screen.getByRole("listbox");

    fireEvent.click(
      within(listbox).getByRole("option", { name: /Groceries/i }),
    );
    fireEvent.click(
      within(listbox).getByRole("option", { name: /Transport/i }),
    );

    expect(screen.getAllByText("Groceries")).toHaveLength(2);
    expect(screen.getAllByText("Transport")).toHaveLength(2);
    expect(document.querySelectorAll("svg").length).toBeGreaterThan(1);
  });
});
