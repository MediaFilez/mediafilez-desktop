import type { CSSProperties } from "react";
import { ArrowClockwiseIcon } from "@phosphor-icons/react";
import type { SetupProgress } from "../../lib/types";

type SetupBannerProps = {
  progress: SetupProgress;
};

function formatMegabytes(bytes: number) {
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

export function SetupStatus({ progress }: SetupBannerProps) {
  const { tool, phase, downloadedBytes, totalBytes } = progress;
  const percent = totalBytes && totalBytes > 0 ? Math.round((downloadedBytes / totalBytes) * 100) : null;

  const label = phase === "verifying" ? `Verifying ${tool}…` : phase === "extracting" ? `Unpacking ${tool}…` : percent !== null ? `Downloading ${tool} · ${percent}% · ${formatMegabytes(downloadedBytes)} of ${formatMegabytes(totalBytes!)}` : `Downloading ${tool} · ${formatMegabytes(downloadedBytes)}`;

  return (
    <div className="setup-banner" role="status">
      <div className="setup-header">
        <ArrowClockwiseIcon className="spin" size={16} weight="regular" aria-hidden="true" />
        <span className="setup-title">Updating downloader</span>
      </div>
      <p className="setup-label">{label}</p>
      {percent !== null && (
        <div className="setup-progress-track">
          <div className="setup-progress-fill" style={{ transform: `scaleX(${percent / 100})` } as CSSProperties} />
        </div>
      )}
    </div>
  );
}
