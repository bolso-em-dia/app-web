import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TestAuthProvider } from "../../app/auth/TestAuthProvider";
import PaginationBar from "./PaginationBar";

function renderPaginationBar(props: {
  start: number;
  end: number;
  total: number;
  pageSize: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onPageSizeChange: (size: number) => void;
}) {
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
        <PaginationBar {...props} />
      </TestAuthProvider>
    </MemoryRouter>,
  );
}

describe("PaginationBar", () => {
  const defaultProps = {
    start: 1,
    end: 12,
    total: 100,
    pageSize: 12,
    hasPrevious: false,
    hasNext: true,
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onPageSizeChange: vi.fn(),
  };

  it("renders range text", () => {
    renderPaginationBar(defaultProps);
    expect(screen.getByText("1-12 de 100")).toBeInTheDocument();
  });

  it("disables previous button when hasPrevious is false", () => {
    renderPaginationBar(defaultProps);
    const prevButton = screen.getByRole("button", { name: "Anterior" });
    expect(prevButton).toBeDisabled();
  });

  it("enables next button when hasNext is true", () => {
    renderPaginationBar(defaultProps);
    const nextButton = screen.getByRole("button", { name: "Próxima" });
    expect(nextButton).not.toBeDisabled();
  });

  it("calls onPrevious when previous button is clicked", () => {
    const onPrevious = vi.fn();
    renderPaginationBar({ ...defaultProps, hasPrevious: true, onPrevious });
    const prevButton = screen.getByRole("button", { name: "Anterior" });
    fireEvent.click(prevButton);
    expect(onPrevious).toHaveBeenCalled();
  });

  it("calls onNext when next button is clicked", () => {
    const onNext = vi.fn();
    renderPaginationBar({ ...defaultProps, onNext });
    const nextButton = screen.getByRole("button", { name: "Próxima" });
    fireEvent.click(nextButton);
    expect(onNext).toHaveBeenCalled();
  });

  it("changes page size", () => {
    const onPageSizeChange = vi.fn();
    renderPaginationBar({ ...defaultProps, onPageSizeChange });
    const select = screen.getByRole("combobox", { name: "Linhas" });
    fireEvent.change(select, { target: { value: "24" } });
    expect(onPageSizeChange).toHaveBeenCalledWith(24);
  });
});
