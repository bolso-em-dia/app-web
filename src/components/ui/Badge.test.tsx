import { Pin } from "lucide-react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/fixtures";
import Badge from "./Badge";

describe("Badge", () => {
  it("renders label content without an icon", () => {
    renderWithProviders(<Badge>Active</Badge>);

    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders an optional decorative icon", () => {
    renderWithProviders(
      <Badge icon={<Pin data-testid="badge-icon" />} tone="warning">
        Fixed
      </Badge>,
    );

    expect(screen.getByText("Fixed")).toBeInTheDocument();
    expect(screen.getByTestId("badge-icon")).toBeInTheDocument();
  });
});
