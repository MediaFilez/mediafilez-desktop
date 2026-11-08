import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Progress } from "../../../../src/components/ui/progress";

describe("Progress", () => {
  it("exposes a determinate value", () => {
    render(<Progress value={42} label="Downloading" />);
    const bar = screen.getByRole("progressbar", { name: "Downloading" });
    expect(bar).toHaveAttribute("aria-valuenow", "42");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(bar).not.toHaveAttribute("aria-valuetext");
  });

  it("does not invent a percentage for indeterminate work", () => {
    render(<Progress indeterminate label="Preparing" />);
    const bar = screen.getByRole("progressbar", { name: "Preparing" });
    expect(bar).toHaveAttribute("aria-valuetext", "In progress");
    expect(bar).not.toHaveAttribute("aria-valuenow");
  });

  it("clamps values outside the 0 to 100 range", () => {
    render(<Progress value={150} label="Clamped" />);
    expect(screen.getByRole("progressbar", { name: "Clamped" })).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
  });
});
