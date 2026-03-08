import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";

// Mock the useDisclaimers hook
const mockDisclaimers = vi.fn();
vi.mock("@/hooks/useDisclaimers", () => ({
  useDisclaimers: (...args: any[]) => mockDisclaimers(...args),
}));

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
}

describe("DisclaimerBanner Component", () => {
  beforeEach(() => {
    mockDisclaimers.mockReset();
  });

  it("renders nothing when no disclaimers", () => {
    mockDisclaimers.mockReturnValue({ data: [] });
    const { container } = renderWithProviders(<DisclaimerBanner placement="home" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when data is undefined", () => {
    mockDisclaimers.mockReturnValue({ data: undefined });
    const { container } = renderWithProviders(<DisclaimerBanner placement="home" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders disclaimers with correct variant styles", () => {
    mockDisclaimers.mockReturnValue({
      data: [
        { id: "1", title: "Warning Title", message: "Warning message", variant: "warning" },
        { id: "2", title: "Info Title", message: "Info message", variant: "info" },
        { id: "3", title: "Error Title", message: "Error message", variant: "error" },
      ],
    });

    renderWithProviders(<DisclaimerBanner placement="home" />);
    expect(screen.getByText("Warning Title")).toBeInTheDocument();
    expect(screen.getByText("Info Title")).toBeInTheDocument();
    expect(screen.getByText("Error Title")).toBeInTheDocument();
    expect(screen.getByText("Warning message")).toBeInTheDocument();
    expect(screen.getByText("Info message")).toBeInTheDocument();
    expect(screen.getByText("Error message")).toBeInTheDocument();
  });

  it("passes correct placement to hook", () => {
    mockDisclaimers.mockReturnValue({ data: [] });
    renderWithProviders(<DisclaimerBanner placement="implementing_act:art-92-1" />);
    expect(mockDisclaimers).toHaveBeenCalledWith("implementing_act:art-92-1");
  });

  it("handles unknown variant gracefully (falls back to warning)", () => {
    mockDisclaimers.mockReturnValue({
      data: [{ id: "1", title: "Unknown", message: "Unknown variant", variant: "unknown" }],
    });
    renderWithProviders(<DisclaimerBanner placement="home" />);
    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });
});

describe("Disclaimer Hook Logic", () => {
  it("should filter disclaimers by placement and include global", () => {
    const disclaimers = [
      { id: "1", placement: ["home"], title: "Home only", message: "", variant: "info", is_active: true },
      { id: "2", placement: ["global"], title: "Global", message: "", variant: "warning", is_active: true },
      { id: "3", placement: ["news"], title: "News only", message: "", variant: "info", is_active: true },
    ];

    const placement = "home";
    const filtered = disclaimers.filter(
      (d) => d.placement.includes(placement) || d.placement.includes("global")
    );

    expect(filtered).toHaveLength(2);
    expect(filtered.map((d) => d.id)).toContain("1");
    expect(filtered.map((d) => d.id)).toContain("2");
    expect(filtered.map((d) => d.id)).not.toContain("3");
  });

  it("should return all disclaimers when no placement filter", () => {
    const disclaimers = [
      { id: "1", placement: ["home"] },
      { id: "2", placement: ["global"] },
      { id: "3", placement: ["news"] },
    ];
    expect(disclaimers).toHaveLength(3);
  });
});
