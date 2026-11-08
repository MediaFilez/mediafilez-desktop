import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import App from "../../../src/app/App";

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState({}, "", "/");
});

describe("MediaFilez Desktop persistence and validation", () => {
  it("validates links before a download is scheduled", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("Media link"), "not a link");

    expect(
      await screen.findByText("Use a complete http or https link."),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Download video" })).toBeDisabled();
  });

  it("keeps finished history across a remount", async () => {
    const user = userEvent.setup();
    const view = render(<App />);

    await user.type(
      screen.getByLabelText("Media link"),
      "https://example.com/watch/remember",
    );
    await user.click(screen.getByRole("button", { name: "Download video" }));
    await waitFor(() => expect(screen.getByText("Complete")).toBeVisible(), {
      timeout: 4000,
    });

    view.unmount();
    render(<App />);

    expect((await screen.findAllByText("Demo media"))[0]).toBeVisible();
  });

  it("restores the last composer choices", async () => {
    const user = userEvent.setup();
    const view = render(<App />);

    await user.type(screen.getByLabelText("Media link"), "https://example.com/watch/demo");
    await user.click(await screen.findByRole("radio", { name: /Audio/ }));
    await user.selectOptions(screen.getByLabelText("Audio format"), "mp3");
    view.unmount();

    const view2 = render(<App />);
    await user.type(screen.getByLabelText("Media link"), "https://example.com/watch/demo");

    expect(await screen.findByRole("radio", { name: /Audio/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByLabelText("Audio format")).toHaveValue("mp3");
    view2.unmount();
  });

  it("saves and restores settings values", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Settings" }));
    await user.selectOptions(screen.getByLabelText("Parallel fragments"), "4");
    await user.click(screen.getByRole("button", { name: "Save settings" }));
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Settings" }),
      ).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Settings" }));
    expect(await screen.findByLabelText("Parallel fragments")).toHaveValue("4");

    // Restore the shared browser fallback client for the rest of the suite.
    await user.selectOptions(screen.getByLabelText("Parallel fragments"), "2");
    await user.click(screen.getByRole("button", { name: "Save settings" }));
  });

  it("labels simulated tool status as preview data", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Settings" }));
    await user.click(screen.getByRole("button", { name: "Advanced" }));

    expect(await screen.findByText("yt-dlp:")).toBeVisible();
    expect(screen.getAllByText("Preview data").length).toBeGreaterThan(0);
    expect(screen.queryByText(/SHA-256 verified/)).not.toBeInTheDocument();
  });
});
