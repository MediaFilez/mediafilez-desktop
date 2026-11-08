import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ErrorBoundary } from "../../../src/components/ErrorBoundary";

function Boom(): never {
  throw new Error("kaboom");
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ErrorBoundary", () => {
  it("shows a recovery screen when a child throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toBeVisible();
    expect(screen.getByText("Something went wrong")).toBeVisible();
    expect(screen.getByText("kaboom")).toBeVisible();
    expect(screen.getByRole("button", { name: "Reload window" })).toBeVisible();
  });
});
