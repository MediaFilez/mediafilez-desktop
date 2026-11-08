import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import App from "../../../src/app/App";

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState({}, "", "/");
});

describe("MediaFilez Desktop app shell", () => {
  it("renders the focused downloader workbench", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText("MediaFilez")).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Download media" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Media link")).toBeVisible();
    expect(screen.getByRole("button", { name: "Paste" })).toBeVisible();
    expect(screen.getByText("Downloads will appear here.")).toBeVisible();
    expect(screen.getByRole("region", { name: "Downloads" })).toBeVisible();

    // Engine status is invisible when healthy (no header clutter)
    expect(screen.queryByText("Engine ready")).not.toBeInTheDocument();

    // On entering a link, the preview card reveals the download mode controls
    await user.type(screen.getByLabelText("Media link"), "https://example.com/watch/demo");
    expect(await screen.findByRole("radiogroup", { name: "Download mode" })).toBeVisible();
    expect(screen.getByRole("radio", { name: /Video/ })).toBeVisible();
    expect(screen.getByRole("radio", { name: /Image/ })).toBeVisible();
    expect(screen.getByRole("radio", { name: /Audio/ })).toBeVisible();
  });

  it("keeps network and session controls behind advanced settings", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryByText("Authorized Cobalt pool")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Settings" }));

    expect(screen.getByRole("dialog", { name: "Settings" })).toBeVisible();
    expect(screen.getByText("Download folder")).toBeVisible();
    expect(screen.getByRole("switch", { name: "Auto-start downloads" })).toBeVisible();

    // Switch to Advanced tab
    await user.click(screen.getByRole("button", { name: "Advanced" }));
    expect(screen.getByRole("switch", { name: "Show advanced options" })).toBeVisible();
    expect(screen.queryByRole("switch", { name: "Community fallback servers" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("switch", { name: "Show advanced options" }));
    expect(await screen.findByText("Authorized Cobalt pool")).toBeVisible();
    expect(screen.getByPlaceholderText(/https:\/\/cobalt-one\.example/)).toBeVisible();
    expect(screen.getByRole("switch", { name: "Use browser session" })).toBeVisible();
    expect(screen.getByRole("switch", { name: "Community fallback servers" })).toBeVisible();
    expect(screen.getByRole("switch", { name: "Instagram embed fallback" })).toBeVisible();

    await user.click(screen.getByRole("switch", { name: "Use browser session" }));
    expect(screen.getByRole("option", { name: "Mozilla Firefox (recommended)" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Choose file" }));
    expect(await screen.findByText("C:\\Users\\Demo\\cookies.txt")).toBeVisible();
  });

  it("switches between light and dark themes in Settings > Appearance", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Settings" }));
    await user.click(screen.getByRole("button", { name: "Appearance" }));

    const initialDark = document.documentElement.classList.contains("dark");
    if (initialDark) {
      await user.click(screen.getByRole("radio", { name: /Light mode/ }));
      expect(document.documentElement.classList.contains("light")).toBe(true);
    } else {
      await user.click(screen.getByRole("radio", { name: /Dark mode/ }));
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    }
  });

  it("offers a discovered app update now or later", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/?mockUpdate=1");
    render(<App />);

    const dialog = await screen.findByRole("dialog", { name: "Update available" });
    expect(within(dialog).getByText("0.1.0 to 0.2.0")).toBeVisible();
    expect(within(dialog).getByRole("button", { name: "Update now" })).toBeVisible();
    expect(within(dialog).getByRole("button", { name: "Later" })).toBeVisible();

    await user.click(within(dialog).getByRole("button", { name: "Later" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Update available" })).not.toBeInTheDocument();
    });
  });

  it("completes the browser update flow", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/?mockUpdate=1");
    render(<App />);

    const dialog = await screen.findByRole("dialog", { name: "Update available" });
    await user.click(within(dialog).getByRole("button", { name: "Update now" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Update available" })).not.toBeInTheDocument();
    });
  });
});
