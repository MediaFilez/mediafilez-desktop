import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DownloadList } from "../../../../src/features/downloads/DownloadList";
import type { JobItem } from "../../../../src/lib/types";

function job(overrides: Partial<JobItem> = {}): JobItem {
  return {
    id: "job-1",
    url: "https://example.com/watch/demo",
    title: "Demo",
    mode: "video",
    status: "downloading",
    progress: 40,
    ...overrides,
  };
}

function handlers() {
  return {
    onCancel: vi.fn(),
    onRetry: vi.fn(),
    onClearFinished: vi.fn(),
    onOpenFile: vi.fn(),
    onShowInFolder: vi.fn(),
    onOpenSettings: vi.fn(),
  };
}

describe("DownloadList", () => {
  it("announces queue state outside the interactive list", () => {
    render(<DownloadList jobs={[job()]} {...handlers()} />);

    const section = screen.getByRole("region", { name: "Downloads" });
    expect(section).not.toHaveAttribute("aria-live");
    expect(screen.getByRole("status")).toHaveTextContent(
      "1 of 1 download in progress.",
    );
  });

  it("cancels a running job", async () => {
    const user = userEvent.setup();
    const actions = handlers();
    render(<DownloadList jobs={[job()]} {...actions} />);

    await user.click(screen.getByRole("button", { name: "Cancel Demo" }));
    expect(actions.onCancel).toHaveBeenCalledWith("job-1");
  });

  it("retries failed and cancelled jobs", async () => {
    const user = userEvent.setup();
    const actions = handlers();
    const failed = job({ id: "failed", title: "Broken", status: "failed" });
    render(<DownloadList jobs={[failed]} {...actions} />);

    await user.click(screen.getByRole("button", { name: "Retry Broken" }));
    expect(actions.onRetry).toHaveBeenCalledWith(failed);
  });

  it("offers sign-in settings for authentication failures", async () => {
    const user = userEvent.setup();
    const actions = handlers();
    render(
      <DownloadList
        jobs={[
          job({
            status: "failed",
            errorCode: "authentication-required",
            error: "Sign in first.",
          }),
        ]}
        {...actions}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Sign-in settings" }));
    expect(actions.onOpenSettings).toHaveBeenCalledOnce();
  });

  it("clears finished rows only when something has finished", async () => {
    const user = userEvent.setup();
    const actions = handlers();
    const { rerender } = render(
      <DownloadList jobs={[job()]} {...actions} />,
    );
    expect(
      screen.queryByRole("button", { name: "Clear finished" }),
    ).not.toBeInTheDocument();

    rerender(
      <DownloadList jobs={[job({ status: "complete", progress: 100 })]} {...actions} />,
    );
    await user.click(screen.getByRole("button", { name: "Clear finished" }));
    expect(actions.onClearFinished).toHaveBeenCalledOnce();
  });

  it("opens completed files and their folder", async () => {
    const user = userEvent.setup();
    const actions = handlers();
    const complete = job({
      status: "complete",
      progress: 100,
      filePath: "C:\\Media\\Demo.mp4",
    });
    render(<DownloadList jobs={[complete]} {...actions} />);

    await user.click(screen.getByRole("button", { name: "Open Demo" }));
    await user.click(screen.getByRole("button", { name: "Show Demo in folder" }));

    expect(actions.onOpenFile).toHaveBeenCalledWith("C:\\Media\\Demo.mp4");
    expect(actions.onShowInFolder).toHaveBeenCalledWith("C:\\Media\\Demo.mp4");
  });
});
