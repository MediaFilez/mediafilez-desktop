import { beforeEach, describe, expect, it } from "vitest";

import {
  COMPOSER_PREFERENCES_KEY,
  DEFAULT_COMPOSER_PREFERENCES,
  readComposerPreferences,
  writeComposerPreferences,
} from "../../../src/lib/preferences";

beforeEach(() => {
  window.localStorage.clear();
});

describe("composer preferences", () => {
  it("returns defaults when nothing is stored", () => {
    expect(readComposerPreferences()).toEqual(DEFAULT_COMPOSER_PREFERENCES);
  });

  it("round-trips valid choices", () => {
    writeComposerPreferences({
      mode: "audio",
      videoQuality: "1080p",
      audioFormat: "mp3",
      audioBitrate: "320",
      removeAudio: false,
    });

    expect(readComposerPreferences()).toEqual({
      mode: "audio",
      videoQuality: "1080p",
      audioFormat: "mp3",
      audioBitrate: "320",
      removeAudio: false,
    });
  });

  it("drops invalid stored values instead of trusting them", () => {
    window.localStorage.setItem(
      COMPOSER_PREFERENCES_KEY,
      JSON.stringify({
        mode: "muted-video",
        videoQuality: "9999p",
        audioFormat: "flac",
        audioBitrate: "999",
        removeAudio: "yes",
      }),
    );

    expect(readComposerPreferences()).toEqual(DEFAULT_COMPOSER_PREFERENCES);
  });

  it("survives corrupt JSON", () => {
    window.localStorage.setItem(COMPOSER_PREFERENCES_KEY, "{not json");
    expect(readComposerPreferences()).toEqual(DEFAULT_COMPOSER_PREFERENCES);
  });
});
