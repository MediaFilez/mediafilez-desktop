import type { TauriClient } from "./tauri-client";
import type { AppUpdateInfo, ToolUpdatesReport } from "./types";

export type UpdateLookup = {
  app: AppUpdateInfo | null;
  tools: ToolUpdatesReport | null;
  appFailed: boolean;
  toolsFailed: boolean;
  failed: boolean;
};

export async function lookupUpdates(target: TauriClient): Promise<UpdateLookup> {
  const [appResult, toolsResult] = await Promise.allSettled([target.checkAppUpdate(),target.checkToolUpdates()]);

  return {
    app: appResult.status === "fulfilled" ? appResult.value : null,
    tools: toolsResult.status === "fulfilled" ? toolsResult.value : null,
    appFailed: appResult.status === "rejected",
    toolsFailed: toolsResult.status === "rejected",
    failed: appResult.status === "rejected" && toolsResult.status === "rejected",
  };
}
