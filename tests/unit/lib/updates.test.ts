import { describe, expect, it, vi } from "vitest";

import { lookupUpdates } from "../../../src/lib/updates";
import type { TauriClient } from "../../../src/lib/tauri-client";
import type { ToolUpdatesReport } from "../../../src/lib/types";

const toolsReport: ToolUpdatesReport = {
  ytDlp: {
    name: "yt-dlp",
    managed: true,
    updateAvailable: false,
    currentVersion: "1.0.0",
  },
  galleryDl: {
    name: "gallery-dl",
    managed: true,
    updateAvailable: false,
    currentVersion: "1.0.0",
  },
  deno: {
    name: "Deno",
    managed: true,
    updateAvailable: false,
    currentVersion: "1.0.0",
  },
  ffmpeg: {
    name: "FFmpeg",
    managed: false,
    updateAvailable: null,
    currentVersion: null,
  },
  updatesAvailable: false,
};

function fakeClient(overrides: Partial<TauriClient>): TauriClient {
  return {
    checkAppUpdate: vi.fn(),
    checkToolUpdates: vi.fn(),
    ...overrides,
  } as unknown as TauriClient;
}

describe("lookupUpdates", () => {
  it("reports a partial failure without hiding the successful half", async () => {
    const result = await lookupUpdates(
      fakeClient({
        checkAppUpdate: vi.fn().mockRejectedValue(new Error("offline")),
        checkToolUpdates: vi.fn().mockResolvedValue(toolsReport),
      }),
    );

    expect(result).toMatchObject({
      app: null,
      tools: toolsReport,
      appFailed: true,
      toolsFailed: false,
      failed: false,
    });
  });

  it("flags a full failure when both checks reject", async () => {
    const result = await lookupUpdates(
      fakeClient({
        checkAppUpdate: vi.fn().mockRejectedValue(new Error("offline")),
        checkToolUpdates: vi.fn().mockRejectedValue(new Error("offline")),
      }),
    );

    expect(result.failed).toBe(true);
    expect(result.appFailed).toBe(true);
    expect(result.toolsFailed).toBe(true);
  });

  it("returns both reports when checks succeed", async () => {
    const app = {
      currentVersion: "1.0.0",
      version: "1.1.0",
      body: null,
      date: null,
    };
    const result = await lookupUpdates(
      fakeClient({
        checkAppUpdate: vi.fn().mockResolvedValue(app),
        checkToolUpdates: vi.fn().mockResolvedValue(toolsReport),
      }),
    );

    expect(result).toMatchObject({
      app,
      tools: toolsReport,
      appFailed: false,
      toolsFailed: false,
      failed: false,
    });
  });
});
