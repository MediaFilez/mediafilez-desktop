import { ArrowClockwiseIcon, ArrowSquareOutIcon, CheckCircleIcon, FolderOpenIcon, WarningIcon, XIcon } from "@phosphor-icons/react";
import { FINISHED_JOB_STATUSES, RUNNING_JOB_STATUSES } from "../../lib/download-options";
import { IconButton } from "../../components/ui/IconButton";
import { Progress } from "../../components/ui/progress";
import type { JobItem, JobStatus } from "../../lib/types";
import { useState } from "react";

type DownloadListProps = {
  jobs: JobItem[];
  onCancel: (id: string) => void;
  onRetry: (job: JobItem) => void;
  onClearFinished: () => void;
  onOpenFile: (path: string) => void;
  onShowInFolder: (path: string) => void;
  onOpenSettings: () => void;
};

const AUTH_ERROR_CODES = new Set([
  "authentication-required",
  "browser-cookies-locked",
  "cookie-decryption-failed",
  "forbidden",
]);

const STATUS_LABELS: Record<JobStatus, string> = {
  queued: "Queued",
  probing: "Analyzing",
  downloading: "Downloading",
  converting: "Processing",
  complete: "Complete",
  failed: "Failed",
  cancelled: "Cancelled",
};

export function DownloadList({ jobs, onCancel, onRetry, onClearFinished, onOpenFile, onShowInFolder, onOpenSettings }: DownloadListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const runningCount = jobs.filter((job) => RUNNING_JOB_STATUSES.includes(job.status)).length;
  const finishedCount = jobs.filter((job) => FINISHED_JOB_STATUSES.includes(job.status)).length;

  const statusMessage = jobs.length === 0 ? "Download queue is clear." : runningCount > 0 ? `${runningCount} of ${jobs.length} download${jobs.length === 1 ? "" : "s"} in progress.` : `${finishedCount} of ${jobs.length} download${jobs.length === 1 ? "" : "s"} finished.`;

  const copyDetails = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <section className="downloads-section" aria-label="Downloads">
      <p className="sr-only" role="status" aria-atomic="true">{statusMessage}</p>

      <div className="downloads-header">
        <h2 id="downloads-section-heading" className="downloads-heading-title">Downloads</h2>
        {finishedCount > 0 && (
          <button type="button" className="ghost-button clear-finished-btn" onClick={onClearFinished}>Clear finished</button>
        )}
      </div>

      {jobs.length === 0 ? (
        <div className="downloads-empty-state">
          <p className="empty-quiet-line">Downloads will appear here.</p>
        </div>
      ) : (
        <ul className="download-jobs-list" role="list">
          {jobs.map((job) => {
            const isRunning = RUNNING_JOB_STATUSES.includes(job.status);
            const isAuthError = job.errorCode && AUTH_ERROR_CODES.has(job.errorCode);
            const indeterminate = job.status === "queued" || job.status === "probing" || job.status === "converting" || (job.status === "downloading" && job.progress === 0);

            let errorMessage = job.error;
            if (job.status === "failed") {
              if (isAuthError) {
                errorMessage = "This post requires sign in. Configure browser cookies in Settings.";
              } else if (!errorMessage) {
                errorMessage = "Could not download media from this link.";
              }
            }

            return (
              <li key={job.id} className={`download-job-row ${job.status}`} data-status={job.status}>
                <div className="job-media-badge" aria-hidden="true">
                  <span className="badge-text">{job.mode.slice(0, 3).toUpperCase()}</span>
                </div>

                <div className="job-main">
                  <div className="job-header-line">
                    <span className="job-title" title={job.title || job.url}>{job.title || job.url}</span>
                    <span className={`job-status-pill status-${job.status}`}>
                      {job.status === "complete" && (
                        <CheckCircleIcon size={14} weight="fill" className="status-icon" aria-hidden="true" />
                      )}
                      {job.status === "failed" && (
                        <WarningIcon size={14} weight="fill" className="status-icon" aria-hidden="true" />
                      )}
                      {STATUS_LABELS[job.status]}
                    </span>
                  </div>

                  <div className="job-meta-line">
                    {isRunning && (
                      <span className="job-stats-mono">
                        {job.status === "downloading" && (
                          <>
                            {job.speed && <span className="stat-item">{job.speed}</span>}
                            {job.eta && <span className="stat-item">{job.eta} left</span>}
                          </>
                        )}
                        {(job.status === "queued" || job.status === "probing") && (
                          <span className="stat-item">{job.detail || "Preparing download"}</span>
                        )}
                        {job.status === "converting" && (
                          <span className="stat-item">{job.detail || "Processing media"}</span>
                        )}
                      </span>
                    )}

                    {job.status === "complete" && job.filePath && (
                      <span className="job-path-mono" title={job.filePath}>{job.filePath}</span>
                    )}

                    {job.status === "failed" && (
                      <div className="job-error-block">
                        <span className="job-error-text">{errorMessage}</span>
                        {job.error && (
                          <button type="button" className="copy-details-btn" onClick={() => copyDetails(job.id, job.error || "")}>
                            {copiedId === job.id ? "Copied" : "Copy details"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {isRunning && (
                    <div className="job-progress-bar">
                      <Progress value={job.progress} indeterminate={indeterminate} label={`${job.title || job.url} progress`}/>
                    </div>
                  )}
                </div>

                <div className="job-actions">
                  {job.status === "failed" && isAuthError && (
                    <button type="button" className="secondary-button compact-btn" onClick={onOpenSettings}>Sign-in settings</button>
                  )}

                  {job.status === "complete" && job.filePath && (
                    <>
                      <IconButton label={`Open ${job.title || "file"}`} onClick={() => onOpenFile(job.filePath!)}>
                        <ArrowSquareOutIcon size={16} weight="regular" aria-hidden="true" />
                      </IconButton>
                      <IconButton label={`Show ${job.title || "file"} in folder`} onClick={() => onShowInFolder(job.filePath!)}>
                        <FolderOpenIcon size={16} weight="regular" aria-hidden="true" />
                      </IconButton>
                    </>
                  )}

                  {(job.status === "failed" || job.status === "cancelled") && (
                    <IconButton label={`Retry ${job.title || "download"}`} onClick={() => onRetry(job)}>
                      <ArrowClockwiseIcon size={16} weight="regular" aria-hidden="true" />
                    </IconButton>
                  )}

                  {isRunning && (
                    <IconButton label={`Cancel ${job.title || "download"}`} onClick={() => onCancel(job.id)}>
                      <XIcon size={16} weight="regular" aria-hidden="true" />
                    </IconButton>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
