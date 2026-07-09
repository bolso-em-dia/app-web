import { render, screen } from "@testing-library/react";
import MoneyAmount from "./MoneyAmount";

describe("MoneyAmount", () => {
  it("renders an expense with a negative value and the expense color class", () => {
    render(<MoneyAmount amount={150} type="EXPENSE" />);

    const element = screen.getByText("-R$ 150,00");
    expect(element.tagName).toBe("SPAN");
    expect(element.className).toContain("expense");
    expect(element.className).not.toContain("income");
  });

  it("renders income with a positive value and the income color class", () => {
    render(<MoneyAmount amount={150} type="INCOME" />);

    const element = screen.getByText("R$ 150,00");
    expect(element.tagName).toBe("SPAN");
    expect(element.className).toContain("income");
    expect(element.className).not.toContain("expense");
  });

  it("renders as the specified HTML tag", () => {
    render(<MoneyAmount amount={150} as="strong" type="INCOME" />);

    const element = screen.getByText("R$ 150,00");
    expect(element.tagName).toBe("STRONG");
  });

  it("renders as a span by default", () => {
    render(<MoneyAmount amount={0} type="INCOME" />);

    const element = screen.getByText("R$ 0,00");
    expect(element.tagName).toBe("SPAN");
  });

  it("formats zero with the expense sign and color class", () => {
    render(<MoneyAmount amount={0} type="EXPENSE" />);

    const element = screen.getByText("-R$ 0,00");
    expect(element.className).toContain("expense");
  });
});
