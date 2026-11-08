import { SidebarSimple } from "@phosphor-icons/react";
import { IconButton } from "../ui/IconButton";
import type { ToolsReport } from "../../lib/types";

type AppHeaderProps = {
  tools: ToolsReport | null;
  engineBusy: boolean;
  isDesktop: boolean;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onRepairEngine?: () => void;
  onOpenSettings?: () => void;
};

export function AppHeader({
  tools,
  engineBusy,
  sidebarCollapsed,
  onToggleSidebar,
  onRepairEngine,
  onOpenSettings,
}: AppHeaderProps) {
  const hasEngineError = tools !== null && !tools.ready && !engineBusy;

  return (
    <header className="app-main-header" data-tauri-drag-region>
      <div className="header-left">
        {sidebarCollapsed && onToggleSidebar && (
          <IconButton
            label="Expand sidebar"
            onClick={onToggleSidebar}
            className="header-sidebar-toggle"
          >
            <SidebarSimple size={18} weight="regular" aria-hidden="true" />
          </IconButton>
        )}
      </div>

      <div className="header-right">
        {engineBusy && (
          <span className="engine-badge busy" role="status">
            Updating downloader…
          </span>
        )}
        {hasEngineError && (
          <button
            type="button"
            className="engine-badge error"
            onClick={onRepairEngine ?? onOpenSettings}
          >
            Downloader needs an update
          </button>
        )}
      </div>
    </header>
  );
}
