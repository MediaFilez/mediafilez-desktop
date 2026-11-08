import { ArrowClockwiseIcon, CheckCircleIcon, CircleNotchIcon, FolderOpenIcon, PauseIcon, PlusIcon, SidebarSimpleIcon, WarningIcon } from "@phosphor-icons/react";
import { FINISHED_JOB_STATUSES, RUNNING_JOB_STATUSES } from "../../lib/download-options";
import type { JobItem, ToolsReport } from "../../lib/types";
import { IconButton } from "../ui/IconButton";
import { Tooltip } from "../ui/Tooltip";

export type SidebarView = "downloader" | "activity";

type AppSidebarProps = {
  activeView: SidebarView;
  onViewChange: (view: SidebarView) => void;
  jobs: JobItem[];
  tools: ToolsReport | null;
  engineBusy: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNewDownload: () => void;
  onOpenSettings: () => void;
  onClearFinished: () => void;
  onRetry: (job: JobItem) => void;
  onOpenFile: (path: string) => void;
  onShowInFolder: (path: string) => void;
};

function formatSidebarTitle(job: JobItem): string {
  const text = job.title || job.url;
  if (!text) return "Untitled media";
  if (text.startsWith("http://") || text.startsWith("https://")) {
    try {
      const parsed = new URL(text);
      const host = parsed.hostname.replace(/^www\./, "");
      return host + (parsed.pathname.length > 1 ? parsed.pathname : "");
    } catch {
      return text.replace(/^https?:\/\//, "");
    }
  }
  return text;
}

function ThemedIcon({ name, size = 22, active = false, className = ""}: {
  name: "download" | "activity" | "settings";
  size?: number;
  active?: boolean;
  className?: string;
}) {
  return (
    <span className={`themed-icon-wrapper ${active ? "is-active" : ""} ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      <img src={`/icons/${name}-white.png`} alt="" width={size} height={size} className="themed-icon icon-dark-theme" draggable={false} />
      <img src={`/icons/${name}-black.png`} alt="" width={size} height={size} className="themed-icon icon-light-theme" draggable={false} />
    </span>
  );
}

export function AppSidebar({ activeView, onViewChange, jobs, tools, engineBusy, collapsed, onToggleCollapse, onNewDownload, onOpenSettings, onClearFinished, onRetry, onOpenFile, onShowInFolder }: AppSidebarProps) {
  const runningJobs = jobs.filter((job) => RUNNING_JOB_STATUSES.includes(job.status));
  const finishedJobs = jobs.filter((job) => FINISHED_JOB_STATUSES.includes(job.status));
  const hasEngineError = tools !== null && !tools.ready && !engineBusy;

  return (
    <aside className={`app-sidebar ${collapsed ? "is-collapsed" : ""}`} aria-label="Navigation & downloads" >
      <div className="sidebar-header" data-tauri-drag-region>
        <div className="sidebar-brand">
          <img src="/logo.svg" alt="" className="sidebar-logo" width="24" height="24" draggable={false} />
          {!collapsed && <h1 className="sidebar-wordmark">MediaFilez</h1>}
        </div>
        <IconButton label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={onToggleCollapse} className="sidebar-toggle-btn">
          <SidebarSimpleIcon size={20} weight="regular" aria-hidden="true" />
        </IconButton>
      </div>



      <div className="sidebar-primary-action">
        {collapsed ? (
          <Tooltip content="New Download" side="right">
            <button type="button" className="sidebar-new-btn is-collapsed-btn" onClick={onNewDownload} aria-label="New Download">
              <PlusIcon size={18} weight="bold" aria-hidden="true" />
            </button>
          </Tooltip>
        ) : (
          <button type="button" className="sidebar-new-btn" onClick={onNewDownload}>
            <PlusIcon size={18} weight="bold" aria-hidden="true" />
            <span>New Download</span>
          </button>
        )}
      </div>



      <nav className="sidebar-nav" aria-label="Main views">
        <ul className="sidebar-nav-list" role="list">
          <li>
            {collapsed ? (
              <Tooltip content="Downloader" side="right">
                <button type="button" className={`sidebar-nav-item ${activeView === "downloader" ? "is-active" : ""}`} onClick={() => onViewChange("downloader")} aria-label="Downloader">
                  <ThemedIcon name="download" size={22} active={activeView === "downloader"} />
                </button>
              </Tooltip>
            ) : (
              <button type="button" className={`sidebar-nav-item ${activeView === "downloader" ? "is-active" : ""}`} onClick={() => onViewChange("downloader")}>
                <ThemedIcon name="download" size={22} active={activeView === "downloader"} />
                <span>Downloader</span>
              </button>
            )}
          </li>

          <li>
            {collapsed ? (
              <Tooltip content={`Activity${runningJobs.length > 0 ? ` (${runningJobs.length} active)` : ""}`} side="right">
                <button type="button" className={`sidebar-nav-item ${activeView === "activity" ? "is-active" : ""}`} onClick={() => onViewChange("activity")} aria-label="Activity">
                  <ThemedIcon name="activity" size={22} active={activeView === "activity"} />
                  {runningJobs.length > 0 && (
                    <span className="sidebar-counter-badge">{runningJobs.length}</span>
                  )}
                </button>
              </Tooltip>
            ) : (
              <button type="button" className={`sidebar-nav-item ${activeView === "activity" ? "is-active" : ""}`} onClick={() => onViewChange("activity")}>
                <ThemedIcon name="activity" size={22} active={activeView === "activity"} />
                <span>Activity</span>
                {runningJobs.length > 0 && (
                  <span className="sidebar-counter-badge">{runningJobs.length}</span>
                )}
              </button>
            )}
          </li>
        </ul>
      </nav>

      {!collapsed && (
        <section className="sidebar-log-section" aria-label="Recent downloads">
          <div className="sidebar-section-header">
            <span className="sidebar-section-title">Downloads</span>
            {finishedJobs.length > 0 && (
              <button type="button" className="sidebar-clear-btn" onClick={onClearFinished}>
                Clear
              </button>
            )}
          </div>

          <div className="sidebar-log-list" role="list">
            {jobs.length === 0 ? (
              <p className="sidebar-log-empty">No recent downloads</p>
            ) : (
              jobs.slice(0, 15).map((job) => {
                const isRunning = RUNNING_JOB_STATUSES.includes(job.status);
                const isComplete = job.status === "complete";
                const isFailed = job.status === "failed";
                const isCancelled = job.status === "cancelled";

                return (
                  <div key={job.id} className="sidebar-log-item" role="listitem"
                    onClick={() => {
                      if (job.filePath && isComplete) {
                        onOpenFile(job.filePath);
                      } else {
                        onViewChange("activity");
                      }
                    }}
                  >
                    <div className="sidebar-log-indicator">
                      { isRunning && ( <CircleNotchIcon size={14} weight="bold" className="spin-icon" aria-hidden="true" /> )}
                      { isComplete && ( <CheckCircleIcon size={14} weight="fill" className="status-success-icon" aria-hidden="true" /> )}
                      { isFailed && ( <WarningIcon size={14} weight="fill" className="status-danger-icon" aria-hidden="true" /> )}
                      { isCancelled && ( <PauseIcon size={14} weight="fill" className="status-WarningIcon-icon" aria-hidden="true" /> )}
                    </div>

                    <div className="sidebar-log-content">
                      <span className="sidebar-log-title" title={job.title || job.url}>{formatSidebarTitle(job)}</span>
                      <span className="sidebar-log-meta">
                        {isRunning && (job.progress ? `${Math.round(job.progress)}%` : "Downloading…")}
                        {isComplete && (job.speed ? job.speed : "Completed")}
                        {isFailed && "Failed"}
                        {isCancelled && "Cancelled"}
                      </span>
                    </div>

                    <div className="sidebar-log-actions" onClick={(event) => event.stopPropagation()}>
                      {isComplete && job.filePath && (
                        <IconButton label="Show in folder" className="sidebar-item-action-btn" onClick={() => onShowInFolder(job.filePath!)}>
                          <FolderOpenIcon size={14} weight="regular" aria-hidden="true" />
                        </IconButton>
                      )}
                      {isFailed && (
                        <IconButton label="Retry download" className="sidebar-item-action-btn" onClick={() => onRetry(job)} >
                          <ArrowClockwiseIcon size={14} weight="regular" aria-hidden="true" />
                        </IconButton>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      <div className="sidebar-footer">
        {collapsed ? (
          <Tooltip content="Settings" side="right">
            <button type="button" className="sidebar-settings-btn is-collapsed-btn" onClick={onOpenSettings} aria-label="Settings">
              <ThemedIcon name="settings" size={22} />
              {hasEngineError && <span className="settings-error-dot" />}
            </button>
          </Tooltip>
        ) : (
          <button type="button" className="sidebar-settings-btn" onClick={onOpenSettings}>
            <ThemedIcon name="settings" size={22} />
            <span>Settings</span>
            {engineBusy && ( <span className="sidebar-engine-pill busy">Updating…</span> )}
            {hasEngineError && ( <span className="sidebar-engine-pill error">Needs update</span> )}
          </button>
        )}
      </div>
    </aside>
  );
}
