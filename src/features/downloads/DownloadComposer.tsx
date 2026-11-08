import { type DragEvent, type KeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";
import { AUDIO_BITRATES, AUDIO_FORMATS, VIDEO_QUALITIES } from "../../lib/download-options";
import type { AudioBitrate, AudioFormat, DownloadMode, VideoQuality } from "../../lib/types";
import { SupportedPlatforms } from "../../components/ui/SupportedPlatforms";
import { FolderOpenIcon, XIcon } from "@phosphor-icons/react";
import { Select } from "../../components/ui/select";
import { Switch } from "../../components/ui/switch";
import { isProbablyUrl } from "../../lib/utils";

type DownloadComposerProps = {
  url: string;
  mode: DownloadMode;
  videoQuality: VideoQuality;
  audioFormat: AudioFormat;
  audioBitrate: AudioBitrate;
  outputFolder: string;
  showAdvanced: boolean;
  removeAudio: boolean;
  busy: boolean;
  activity: ReactNode;
  onUrlChange: (url: string) => void;
  onModeChange: (mode: DownloadMode) => void;
  onVideoQualityChange: (quality: VideoQuality) => void;
  onAudioFormatChange: (format: AudioFormat) => void;
  onAudioBitrateChange: (bitrate: AudioBitrate) => void;
  onRemoveAudioChange: (value: boolean) => void;
  onPaste: () => void;
  onChooseFolder: () => void;
  onDownload: () => void;
};

const MODE_OPTIONS: Array<{ value: DownloadMode; label: string }> = [
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
  { value: "image", label: "Image" },
];

export function DownloadComposer({ url, mode, videoQuality, audioFormat, audioBitrate, outputFolder, showAdvanced, removeAudio, busy, activity, onUrlChange, onModeChange, onVideoQualityChange, onAudioFormatChange, onAudioBitrateChange, onRemoveAudioChange, onPaste, onChooseFolder, onDownload }: DownloadComposerProps) {
  const urlInputRef = useRef<HTMLInputElement>(null);
  const urlId = useId();
  const qualityId = useId();
  const formatId = useId();
  const bitrateId = useId();

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const trimmedUrl = url.trim();
  const validUrl = isProbablyUrl(trimmedUrl);
  const invalid = url.length > 0 && !validUrl;
  const ready = validUrl && Boolean(outputFolder.trim());


  useEffect(() => {
    if (validUrl) {
      setAnalyzing(true);
      const timer = setTimeout(() => {
        setAnalyzing(false);
      }, 260);
      return () => clearTimeout(timer);
    } else {
      setAnalyzing(false);
    }
  }, [trimmedUrl, validUrl]);


  useEffect(() => {
    const handleGlobalKeyDown = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "v") {
        const target = event.target as HTMLElement | null;
        if (target && target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          urlInputRef.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);


  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onUrlChange("");
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    const text = event.dataTransfer.getData("text/plain") || event.dataTransfer.getData("text/uri-list");
    if (text) {
      onUrlChange(text.trim());
    }
  };


  const handleModeKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % MODE_OPTIONS.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + MODE_OPTIONS.length) % MODE_OPTIONS.length;
    }
    if (nextIndex !== currentIndex) {
      event.preventDefault();
      onModeChange(MODE_OPTIONS[nextIndex].value);
    }
  };


  let sourceDomain = "";
  let cleanTitle = trimmedUrl;
  if (validUrl) {
    try {
      const parsed = new URL(trimmedUrl);
      sourceDomain = parsed.hostname.replace(/^www\./, "");
      cleanTitle = `${sourceDomain}${parsed.pathname.length > 1 ? parsed.pathname : ""}`;
    } catch {
      sourceDomain = "media source";
    }
  }

  const primaryLabel = busy ? "Starting download…" : mode === "audio" ? "Download audio" : mode === "image" ? "Download image" : removeAudio ? "Download muted video" : "Download video";

  return (
    <section className="download-stage" aria-labelledby="download-title">
      <h1 id="download-title" className="sr-only">Download media</h1>

      <form className="download-composer" onSubmit={(event) => { event.preventDefault(); if (ready && !busy) onDownload(); }} >
        <div className={`input-row ${dragOver ? "is-dragover" : ""}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} >
          <div className={`url-input-container ${invalid ? "is-error" : ""}`}>
            
            <label htmlFor={urlId} className="sr-only">Media link</label>
            <input ref={urlInputRef} id={urlId} type="url" value={url} onChange={(event) => onUrlChange(event.currentTarget.value)} onKeyDown={handleInputKeyDown} placeholder="Paste a link to a video, audio, or image post" spellCheck={false} autoComplete="off" inputMode="url" aria-invalid={invalid} aria-describedby="url-help" />
            {url ? (
              <button type="button" className="input-action-btn clear-btn" aria-label="Clear link" onClick={() => { onUrlChange(""); urlInputRef.current?.focus(); }} >
                <XIcon size={16} weight="regular" aria-hidden="true" />
              </button>
            ) : (
              <button type="button" className="input-action-btn paste-ghost-btn" onClick={onPaste}>Paste</button>
            )}
          </div>

          <button type="submit" className="primary-button primary-cta" disabled={!ready || busy}>
            {primaryLabel}
          </button>
        </div>


        <div className="input-helper-row">
          <p id="url-help" className={`input-helper-text ${invalid ? "is-error" : ""}`} aria-live="polite">
            {invalid ? "Use a complete http or https link." : !validUrl ? "Paste a link to start" : ""}
          </p>

          <div className="policy-popover-anchor">
            <button type="button" className="popover-trigger" onClick={() => setPopoverOpen((prev) => !prev)} aria-expanded={popoverOpen}>What can I download?</button>
            {popoverOpen && (
              <div className="popover-bubble" role="dialog">
                <p>Public links only. DRM and paywall bypass are not supported.</p>
                <button type="button" className="popover-close" aria-label="Close message" onClick={() => setPopoverOpen(false)}>
                  <XIcon size={12} weight="regular" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>


        <SupportedPlatforms
          currentUrl={url}
          onSelectPlatform={() => {
            urlInputRef.current?.focus();
          }}
        />



        {analyzing && (
          <div className="preview-card-skeleton" aria-busy="true" aria-label="Analyzing link">
            <div className="skeleton-thumb" />
            <div className="skeleton-info">
              <div className="skeleton-line skeleton-title" />
              <div className="skeleton-line skeleton-meta" />
            </div>
          </div>
        )}



        {validUrl && !analyzing && (
          <div className="preview-card">
            <div className="preview-card-header">
              <div className="preview-thumbnail">
                <span className="thumbnail-badge">{mode.toUpperCase()}</span>
              </div>
              <div className="preview-info">
                <div className="preview-title" title={trimmedUrl}>{cleanTitle}</div>
                <div className="preview-meta">
                  <span>{sourceDomain}</span>
                  <span className="meta-bullet">·</span>
                  <span>ready to download</span>
                </div>
              </div>
            </div>



            <div className="segmented-control-section">
              <div className="segmented-control" role="radiogroup" aria-label="Download mode">
                {MODE_OPTIONS.map((opt, index) => {
                  const isSelected = mode === opt.value;
                  return (
                    <button key={opt.value} type="button" role="radio" aria-checked={isSelected} tabIndex={isSelected ? 0 : -1} className={`segmented-tab ${isSelected ? "is-selected" : ""}`} onClick={() => onModeChange(opt.value)} onKeyDown={(event) => handleModeKeyDown(event, index)}>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>



            <div className="preview-options-row">
              {mode === "video" && (
                <div className="option-field">
                  <label htmlFor={qualityId} className="option-label">Video quality</label>
                  <Select id={qualityId} value={videoQuality} onChange={(event) => onVideoQualityChange(event.currentTarget.value as VideoQuality)}>
                    {VIDEO_QUALITIES.map((quality) => (
                      <option key={quality.value} value={quality.value}>{quality.label}</option>
                    ))}
                  </Select>
                </div>
              )}

              {mode === "audio" && (
                <div className="option-field">
                  <label htmlFor={formatId} className="option-label">
                    Audio format
                  </label>
                  <Select id={formatId} value={audioFormat} onChange={(event) => onAudioFormatChange(event.currentTarget.value as AudioFormat)}>
                    {AUDIO_FORMATS.map((format) => (
                      <option key={format.value} value={format.value}>
                        {format.label}
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              {mode === "audio" && showAdvanced && (
                <div className="option-field">
                  <label htmlFor={bitrateId} className="option-label">Bitrate</label>
                  <Select id={bitrateId} value={audioBitrate} onChange={(event) => onAudioBitrateChange(event.currentTarget.value as AudioBitrate)}>
                    {AUDIO_BITRATES.map((bitrate) => (
                      <option key={bitrate.value} value={bitrate.value}>{bitrate.label}</option>
                    ))}
                  </Select>
                </div>
              )}

              {mode === "video" && showAdvanced && (
                <div className="option-field toggle-field">
                  <span className="option-label">Mute video</span>
                  <Switch checked={removeAudio} onCheckedChange={onRemoveAudioChange} aria-label="Remove audio from video"/>
                </div>
              )}

              {mode === "image" && (
                <div className="image-mode-notice">
                  <span>Saves original images or gallery posts</span>
                </div>
              )}
            </div>



            <div className="preview-destination-row">
              <div className="destination-text">
                <span className="destination-label">Save to</span>
                <span className="destination-path" title={outputFolder || "Downloads"}>
                  {outputFolder || "Downloads"}
                </span>
              </div>
              <button type="button" className="secondary-button compact-btn" onClick={onChooseFolder}>
                <FolderOpenIcon size={16} weight="regular" aria-hidden="true" />
                Change
              </button>
            </div>
          </div>
        )}


        {activity}
      </form>
    </section>
  );
}
