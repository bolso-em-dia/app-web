import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import CategorySelect from "./CategorySelect";
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
  const [value, setValue] = useState("");

  return <CategorySelect id="category-select" onChange={setValue} options={OPTIONS} placeholder="Selecione uma categoria" value={value} />;
}

describe("CategorySelect", () => {
  it("renders category icons in the dropdown and updates the selected value", () => {
    render(<Harness />);

    const trigger = screen.getByRole("button", {
      name: /Selecione uma categoria/i,
    });

    fireEvent.click(trigger);

    const listbox = screen.getByRole("listbox");
    const groceriesOption = within(listbox).getByRole("option", {
      name: /Groceries/i,
    });

    expect(groceriesOption.querySelector("svg")).not.toBeNull();

    fireEvent.click(groceriesOption);

    expect(
      screen.getByRole("button", {
        name: /Groceries/i,
      }),
    ).toBeInTheDocument();
  });
});
