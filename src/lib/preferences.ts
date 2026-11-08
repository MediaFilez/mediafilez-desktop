import type { AudioBitrate, AudioFormat, DownloadMode, VideoQuality } from "./types";

export type ComposerPreferences = {
  mode: DownloadMode;
  videoQuality: VideoQuality;
  audioFormat: AudioFormat;
  audioBitrate: AudioBitrate;
  removeAudio: boolean;
};

export const COMPOSER_PREFERENCES_KEY = "mediafilez-desktop-composer-v1";

export const DEFAULT_COMPOSER_PREFERENCES: ComposerPreferences = {
  mode: "video",
  videoQuality: "best",
  audioFormat: "best",
  audioBitrate: "best",
  removeAudio: false,
};

const MODES: DownloadMode[] = ["video", "image", "audio"];
const VIDEO_QUALITIES: VideoQuality[] = ["best", "2160p", "1440p", "1080p", "720p", "480p", "360p"];
const AUDIO_FORMATS: AudioFormat[] = ["best", "mp3", "m4a", "opus", "wav"];
const AUDIO_BITRATES: AudioBitrate[] = ["best", "320", "256", "128", "96", "64"];

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

export function readComposerPreferences(): ComposerPreferences {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(COMPOSER_PREFERENCES_KEY) ?? "null");
    if (!parsed || typeof parsed !== "object") return DEFAULT_COMPOSER_PREFERENCES;
    const value = parsed as Record<string, unknown>;

    return {
      mode: pick(value.mode, MODES, DEFAULT_COMPOSER_PREFERENCES.mode),
      videoQuality: pick(
        value.videoQuality,
        VIDEO_QUALITIES,
        DEFAULT_COMPOSER_PREFERENCES.videoQuality,
      ),
      audioFormat: pick(
        value.audioFormat,
        AUDIO_FORMATS,
        DEFAULT_COMPOSER_PREFERENCES.audioFormat,
      ),
      audioBitrate: pick(
        value.audioBitrate,
        AUDIO_BITRATES,
        DEFAULT_COMPOSER_PREFERENCES.audioBitrate,
      ),
      removeAudio: value.removeAudio === true,
    };
  } catch {
    return DEFAULT_COMPOSER_PREFERENCES;
  }
}

export function writeComposerPreferences(preferences: ComposerPreferences): void {
  window.localStorage.setItem(
    COMPOSER_PREFERENCES_KEY,
    JSON.stringify(preferences),
  );
}