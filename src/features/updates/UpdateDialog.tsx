import { ArrowClockwiseIcon, CheckCircleIcon, WarningIcon, XIcon } from "@phosphor-icons/react";
import type { AppUpdateInfo, ToolUpdatesReport } from "../../lib/types";
import { IconButton } from "../../components/ui/IconButton";
import { Progress } from "../../components/ui/progress";
import { useEffect, useRef } from "react";

type UpdateDialogProps = {
  open: boolean;
  appUpdate: AppUpdateInfo | null;
  toolUpdates: ToolUpdatesReport | null;
  installing: boolean;
  progress: number | null;
  onInstall: () => void;
  onClose: () => void;
};

function toolStatus(report: ToolUpdatesReport | null) {
  if (!report) return "Tool versions could not be checked.";
  const updates = [report.ytDlp, report.galleryDl, report.deno, report.ffmpeg].filter((tool) => tool.updateAvailable).map((tool) => tool.name);
  if (updates.length === 0) return "Download tools are current.";
  return `${updates.join(" and ")} ${updates.length === 1 ? "has" : "have"} an update.`;
}

export function UpdateDialog({ open, appUpdate, toolUpdates, installing, progress, onInstall, onClose }: UpdateDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }
    if (!open && dialog.open) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
  }, [open]);

  const hasUpdates = Boolean(appUpdate || toolUpdates?.updatesAvailable);

  return (
    <dialog ref={dialogRef} className="modal-dialog update-dialog" aria-labelledby="update-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!installing) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !installing) onClose();
      }}
    >
      <div className="modal-panel update-panel">
        <header className="modal-header">
          <div className="modal-title-lockup">
            <h2 id="update-dialog-title">
              {hasUpdates ? "Update available" : "You are up to date"}
            </h2>
          </div>
          {!installing && (
            <IconButton label="Close updates" onClick={onClose}>
              <XIcon size={16} weight="regular" aria-hidden="true" />
            </IconButton>
          )}
        </header>

        <div className="modal-body update-body">
          <div className="update-status-row">
            {hasUpdates ? (
              <WarningIcon size={20} weight="fill" className="status-warn" aria-hidden="true" />
            ) : (
              <CheckCircleIcon size={20} weight="fill" className="status-success" aria-hidden="true" />
            )}
            <div className="update-text-col">
              <span className="update-row-title">MediaFilez Desktop</span>
              <span className="update-row-sub">
                {appUpdate ? `${appUpdate.currentVersion} to ${appUpdate.version}` : "Current version installed"}
              </span>
            </div>
          </div>

          <div className="update-status-row">
            <div className="update-text-col">
              <span className="update-row-title">Download tools</span>
              <span className="update-row-sub">{toolStatus(toolUpdates)}</span>
            </div>
          </div>

          {appUpdate?.body && <p className="update-release-notes">{appUpdate.body}</p>}

          {installing && (
            <div className="update-progress-block" role="status">
              <span className="update-progress-label">
                {progress === null ? "Downloading update…" : `Downloading update · ${progress}%`}
              </span>
              <Progress value={progress ?? 0} indeterminate={progress === null} label="Update progress"/>
            </div>
          )}
        </div>

        <footer className="modal-footer">
          {hasUpdates ? (
            <>
              <button type="button" className="ghost-button" onClick={onClose} disabled={installing}>Later</button>
              <button type="button" className="primary-button" onClick={onInstall} disabled={installing}>
                {installing ? (
                  <>
                    <ArrowClockwiseIcon className="spin" size={16} weight="regular" aria-hidden="true" />
                    Updating…
                  </>
                ) : (
                  "Update now"
                )}
              </button>
            </>
          ) : (
            <button type="button" className="primary-button" onClick={onClose}>Done</button>
          )}
        </footer>
      </div>
    </dialog>
  );
}
