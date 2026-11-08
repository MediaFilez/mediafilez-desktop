import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toaster, toast } from "sonner";

import type { ApiProviderSettings, AppUpdateInfo, AudioBitrate, AudioFormat, DownloadMode, JobItem, JobUpdate, SetupProgress, ToolsReport, ToolUpdatesReport, VideoQuality } from "../lib/types";
import { browserFallbackClient, createTauriClient, type TauriClient } from "../lib/tauri-client";
import { readComposerPreferences, writeComposerPreferences } from "../lib/preferences";
import { AppSidebar, type SidebarView } from "../components/layout/AppSidebar";
import { DownloadComposer } from "../features/downloads/DownloadComposer";
import { SettingsDialog } from "../features/settings/SettingsDialog";
import { DownloadList } from "../features/downloads/DownloadList";
import { SetupStatus } from "../features/downloads/SetupStatus";
import { UpdateDialog } from "../features/updates/UpdateDialog";
import { FINISHED_JOB_STATUSES } from "../lib/download-options";
import { AppHeader } from "../components/layout/AppHeader";
import { lookupUpdates } from "../lib/updates";
import { isProbablyUrl } from "../lib/utils";
import { useTheme } from "../lib/use-theme";
import "../styles/app.css";

const REPO_URL = "https://github.com/RlxChap2/mediafilez-desktop";
const HISTORY_KEY = "mediafilez-desktop-history-v1";
const AUTOSTART_KEY = "mediafilez-desktop-autostart";
const ADVANCED_KEY = "mediafilez-desktop-advanced";
const SIDEBAR_KEY = "mediafilez-desktop-sidebar-collapsed";

const initialApiProvider: ApiProviderSettings = {
  enabled: false,
  baseUrl: "",
  authType: "none",
  token: "",
  timeoutSeconds: 20,
};

function readPref(key: string, fallback: boolean) {
  const stored = window.localStorage.getItem(key);
  return stored === null ? fallback : stored === "true";
}

function readHistory(): JobItem[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value
      .filter(
        (job): job is JobItem =>
          typeof job?.id === "string" &&
          typeof job?.url === "string" &&
          FINISHED_JOB_STATUSES.includes(job?.status),
      )
      .slice(0, 30);
  } catch {
    return [];
  }
}

function App() {
  const { theme, preference: themePreference, setTheme: setThemePreference } = useTheme();
  const [composerDefaults] = useState(readComposerPreferences);
  const [client, setClient] = useState<TauriClient>(browserFallbackClient);
  const [activeView, setActiveView] = useState<SidebarView>("downloader");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => readPref(SIDEBAR_KEY, false));
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<DownloadMode>(composerDefaults.mode);
  const [removeAudio, setRemoveAudio] = useState(composerDefaults.removeAudio);
  const [videoQuality, setVideoQuality] = useState<VideoQuality>(composerDefaults.videoQuality);
  const [audioFormat, setAudioFormat] = useState<AudioFormat>(composerDefaults.audioFormat);
  const [audioBitrate, setAudioBitrate] = useState<AudioBitrate>(composerDefaults.audioBitrate);
  const [outputFolder, setOutputFolder] = useState("");
  const [starting, setStarting] = useState(false);
  const startingRef = useRef(false);
  const [jobs, setJobs] = useState<JobItem[]>(readHistory);
  const [apiProvider, setApiProvider] = useState(initialApiProvider);
  const [communityFallback, setCommunityFallback] = useState(false);
  const [instagramProxyFallback, setInstagramProxyFallback] = useState(false);
  const [concurrency, setConcurrency] = useState(2);
  const [cookiesFromBrowser, setCookiesFromBrowser] = useState(false);
  const [cookieBrowser, setCookieBrowser] = useState<"edge" | "chrome" | "firefox" | "brave" | "vivaldi" | "opera">("firefox");
  const [cookieBrowserProfile, setCookieBrowserProfile] = useState("");
  const [cookieFile, setCookieFile] = useState("");
  const [autoStart, setAutoStart] = useState(() => readPref(AUTOSTART_KEY, false));
  const [showAdvanced, setShowAdvanced] = useState(() => readPref(ADVANCED_KEY, false));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tools, setTools] = useState<ToolsReport | null>(null);
  const [checkingTools, setCheckingTools] = useState(false);
  const [setupProgress, setSetupProgress] = useState<SetupProgress | null>(null);
  const [appUpdate, setAppUpdate] = useState<AppUpdateInfo | null>(null);
  const [toolUpdates, setToolUpdates] = useState<ToolUpdatesReport | null>(null);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [installingUpdate, setInstallingUpdate] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<number | null>(null);

  const finishedHistory = useMemo(() => jobs.filter((job) => FINISHED_JOB_STATUSES.includes(job.status)).slice(0, 30), [jobs]);
  const finishedHistoryJson = useMemo(() => JSON.stringify(finishedHistory), [finishedHistory]);

  useEffect(() => {
    window.localStorage.setItem(HISTORY_KEY, finishedHistoryJson);
  }, [finishedHistoryJson]);

  useEffect(() => {
    writeComposerPreferences({ mode, videoQuality, audioFormat, audioBitrate, removeAudio });
  }, [mode, videoQuality, audioFormat, audioBitrate, removeAudio]);

  const applyDownloadUpdate = useCallback((update: JobUpdate) => {
    setJobs((previous) =>
      previous.map((job) =>
        job.id === update.id
          ? {
              ...job,
              status: update.status,
              title: update.title ?? job.title,
              provider: update.provider ?? job.provider,
              progress: update.progress ?? job.progress,
              speed: update.speed ?? job.speed,
              eta: update.eta ?? job.eta,
              detail: update.detail ?? job.detail,
              filePath: update.filePath ?? job.filePath,
              error: update.error ?? job.error,
              errorCode: update.errorCode ?? job.errorCode,
            }
          : job,
      ),
    );
  }, []);

  useEffect(() => {
    let mounted = true;
    let unlistenDownload: (() => void) | undefined;
    let unlistenSetup: (() => void) | undefined;

    void (async () => {
      const tauriClient = await createTauriClient();
      if (!mounted) return;
      setClient(tauriClient);

      const updatesPromise = lookupUpdates(tauriClient);
      const [folderResult, settingsResult, reportResult] = await Promise.allSettled([
        tauriClient.getDefaultOutputDir(),
        tauriClient.getSettings(),
        tauriClient.checkTools(),
      ]);
      if (!mounted) return;

      if (folderResult.status === "fulfilled") setOutputFolder(folderResult.value);
      if (settingsResult.status === "fulfilled") {
        const settings = settingsResult.value;
        setApiProvider(settings.apiProvider);
        setCommunityFallback(settings.communityFallback);
        setInstagramProxyFallback(settings.instagramProxyFallback);
        setConcurrency(settings.concurrency);
        setCookiesFromBrowser(settings.cookiesFromBrowser);
        setCookieBrowser(settings.cookieBrowser);
        setCookieBrowserProfile(settings.cookieBrowserProfile);
        setCookieFile(settings.cookieFile);
      }
      if (reportResult.status === "fulfilled") setTools(reportResult.value);

      try {
        unlistenDownload = await tauriClient.onDownloadUpdate(applyDownloadUpdate);
        unlistenSetup = await tauriClient.onSetupProgress((progress) => {
          if (progress.phase === "ready" || progress.phase === "error") {
            setSetupProgress(null);
            void tauriClient
              .checkTools()
              .then(setTools)
              .catch((error) => {
                toast.error("Downloader status could not be refreshed", {
                  description: String(error),
                });
              });
            if (progress.phase === "error") {
              toast.error("Downloader setup failed", { description: progress.message });
            }
          } else {
            setSetupProgress(progress);
          }
        });
      } catch (error) {
        toast.error("App events could not be connected", { description: String(error) });
      }

      const updates = await updatesPromise;
      if (!mounted) return;
      setAppUpdate(updates.app);
      setToolUpdates(updates.tools);
      if (updates.app || updates.tools?.updatesAvailable) setUpdateOpen(true);
    })().catch((error) => {
      if (mounted) toast.error("App initialization failed", { description: String(error) });
    });

    return () => {
      mounted = false;
      unlistenDownload?.();
      unlistenSetup?.();
    };
  }, [applyDownloadUpdate]);

  const startDownload = useCallback(
    async (overrides?: { url?: string; mode?: DownloadMode }): Promise<string | null> => {
      if (startingRef.current) return null;

      const targetUrl = (overrides?.url ?? url).trim();
      if (!isProbablyUrl(targetUrl)) {
        toast.error("Enter a complete http or https media link.");
        return null;
      }
      const jobMode = overrides?.mode ?? (mode === "video" && removeAudio ? "muted-video" : mode);
      startingRef.current = true;
      setStarting(true);
      try {
        const id = await client.startDownload({
          url: targetUrl,
          outputDir: outputFolder,
          mode: jobMode,
          videoQuality,
          audioFormat,
          audioBitrate,
        });
        setJobs((previous) => [
          { id, url: targetUrl, title: targetUrl, mode: jobMode, status: "queued", progress: 0 },
          ...previous,
        ]);
        if (!overrides?.url) setUrl("");
        return id;
      } catch (error) {
        toast.error("Download could not start", { description: String(error) });
        return null;
      } finally {
        startingRef.current = false;
        setStarting(false);
      }
    },
    [client, url, mode, removeAudio, outputFolder, videoQuality, audioFormat, audioBitrate],
  );

  async function handlePaste() {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!text) return;
      setUrl(text);
      if (autoStart && isProbablyUrl(text)) {
        const id = await startDownload({ url: text });
        if (id) setUrl("");
      }
    } catch {
      toast.error("Clipboard access is unavailable. Paste with Ctrl+V.");
    }
  }

  const handleNewDownload = useCallback(() => {
    setActiveView("downloader");
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>("input[type='url']");
      input?.focus();
    }, 40);
  }, []);

  async function chooseFolder() {
    const selected = await client.chooseOutputFolder();
    if (selected) setOutputFolder(selected);
  }

  async function chooseCookieFile() {
    const selected = await client.chooseCookieFile();
    if (!selected) return;
    setCookieFile(selected);
    setCookiesFromBrowser(false);
  }

  function openAuthenticationSettings() {
    updatePref(ADVANCED_KEY, true, setShowAdvanced);
    setSettingsOpen(true);
  }

  async function retryJob(job: JobItem) {
    const id = await startDownload({ url: job.url, mode: job.mode });
    if (!id) return;
    setJobs((previous) => previous.filter((item) => item.id !== job.id));
  }

  function updatePref(key: string, value: boolean, setter: (value: boolean) => void) {
    setter(value);
    window.localStorage.setItem(key, String(value));
  }

  async function saveSettings() {
    try {
      await client.saveSettings({
        outputFolder,
        concurrency,
        cookiesFromBrowser,
        cookieBrowser,
        cookieBrowserProfile,
        cookieFile,
        ffmpegPath: "",
        apiProvider: { ...apiProvider, enabled: Boolean(apiProvider.baseUrl.trim()) },
        communityFallback,
        instagramProxyFallback,
      });
      setSettingsOpen(false);
    } catch (error) {
      toast.error("Settings could not be saved", { description: String(error) });
    }
  }

  async function repairTools() {
    setCheckingTools(true);
    try {
      setTools(await client.setupTools());
      setToolUpdates(await client.checkToolUpdates());
    } catch (error) {
      toast.error("Engine repair failed", { description: String(error) });
    } finally {
      setCheckingTools(false);
    }
  }

  async function checkForUpdates() {
    setCheckingUpdates(true);
    setSettingsOpen(false);
    const updates = await lookupUpdates(client);
    setAppUpdate(updates.app);
    setToolUpdates(updates.tools);
    setCheckingUpdates(false);
    if (updates.failed || updates.appFailed || updates.toolsFailed) {
      toast.error("Update check failed", { description: "Check your connection and try again." });
      return;
    }
    setUpdateOpen(true);
  }

  async function installUpdates() {
    setInstallingUpdate(true);
    setUpdateProgress(null);
    try {
      if (toolUpdates?.updatesAvailable) {
        try {
          setTools(await client.setupTools());
          setToolUpdates(await client.checkToolUpdates());
        } catch (error) {
          if (!appUpdate) throw error;
          toast.error("Download tools could not be updated", { description: String(error) });
        }
      }
      if (appUpdate) {
        await client.installAppUpdate(setUpdateProgress);
        setUpdateOpen(false);
      } else {
        setUpdateOpen(false);
        toast.success("Download tools updated.");
      }
    } catch (error) {
      toast.error("Update failed", { description: String(error) });
    } finally {
      setInstallingUpdate(false);
    }
  }

  return (
    <div className="app-shell">
      <AppSidebar
        activeView={activeView}
        onViewChange={setActiveView}
        jobs={jobs}
        tools={tools}
        engineBusy={setupProgress !== null}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() =>
          updatePref(SIDEBAR_KEY, !sidebarCollapsed, setSidebarCollapsed)
        }
        onNewDownload={handleNewDownload}
        onOpenSettings={() => setSettingsOpen(true)}
        onClearFinished={() =>
          setJobs((previous) =>
            previous.filter(
              (job) => !["complete", "failed", "cancelled"].includes(job.status),
            ),
          )
        }
        onRetry={retryJob}
        onOpenFile={(path) => void client.openFile(path)}
        onShowInFolder={(path) => void client.showInFolder(path)}
      />

      <div className="app-main-area">
        <AppHeader
          tools={tools}
          engineBusy={setupProgress !== null}
          isDesktop={client.isDesktop}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => updatePref(SIDEBAR_KEY, false, setSidebarCollapsed)}
          onRepairEngine={() => void repairTools()}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <main className="app-viewport">
          <div className="app-container">
            {setupProgress && <SetupStatus progress={setupProgress} />}

            {activeView === "downloader" ? (
              <DownloadComposer
                url={url}
                mode={mode}
                videoQuality={videoQuality}
                audioFormat={audioFormat}
                audioBitrate={audioBitrate}
                outputFolder={outputFolder}
                showAdvanced={showAdvanced}
                removeAudio={removeAudio}
                busy={starting}
                onUrlChange={setUrl}
                onModeChange={(value) => {
                  setMode(value);
                  if (value !== "video") setRemoveAudio(false);
                }}
                onVideoQualityChange={setVideoQuality}
                onAudioFormatChange={setAudioFormat}
                onAudioBitrateChange={setAudioBitrate}
                onRemoveAudioChange={setRemoveAudio}
                onPaste={() => void handlePaste()}
                onChooseFolder={() => void chooseFolder()}
                onDownload={() => void startDownload()}
                activity={
                  <DownloadList
                    jobs={jobs}
                    onCancel={(id) => void client.cancelDownload(id)}
                    onRetry={retryJob}
                    onClearFinished={() =>
                      setJobs((previous) =>
                        previous.filter(
                          (job) => !["complete", "failed", "cancelled"].includes(job.status),
                        ),
                      )
                    }
                    onOpenFile={(path) => void client.openFile(path)}
                    onShowInFolder={(path) => void client.showInFolder(path)}
                    onOpenSettings={openAuthenticationSettings}
                  />
                }
              />
            ) : (
              <div className="activity-view-wrapper">
                <DownloadList
                  jobs={jobs}
                  onCancel={(id) => void client.cancelDownload(id)}
                  onRetry={retryJob}
                  onClearFinished={() =>
                    setJobs((previous) =>
                      previous.filter(
                        (job) => !["complete", "failed", "cancelled"].includes(job.status),
                      ),
                    )
                  }
                  onOpenFile={(path) => void client.openFile(path)}
                  onShowInFolder={(path) => void client.showInFolder(path)}
                  onOpenSettings={openAuthenticationSettings}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      <SettingsDialog
        open={settingsOpen}
        themePreference={themePreference}
        onThemeChange={setThemePreference}
        outputFolder={outputFolder}
        autoStart={autoStart}
        showAdvanced={showAdvanced}
        communityFallback={communityFallback}
        instagramProxyFallback={instagramProxyFallback}
        concurrency={concurrency}
        cookiesFromBrowser={cookiesFromBrowser}
        cookieBrowser={cookieBrowser}
        cookieBrowserProfile={cookieBrowserProfile}
        cookieFile={cookieFile}
        apiProvider={apiProvider}
        tools={tools}
        isDesktop={client.isDesktop}
        checkingTools={checkingTools}
        checkingUpdates={checkingUpdates}
        onClose={() => setSettingsOpen(false)}
        onChooseFolder={() => void chooseFolder()}
        onAutoStartChange={(value) => updatePref(AUTOSTART_KEY, value, setAutoStart)}
        onShowAdvancedChange={(value) => updatePref(ADVANCED_KEY, value, setShowAdvanced)}
        onCommunityFallbackChange={setCommunityFallback}
        onInstagramProxyFallbackChange={setInstagramProxyFallback}
        onConcurrencyChange={setConcurrency}
        onCookiesFromBrowserChange={(value) => {
          setCookiesFromBrowser(value);
          if (value) setCookieFile("");
        }}
        onCookieBrowserChange={setCookieBrowser}
        onCookieBrowserProfileChange={setCookieBrowserProfile}
        onChooseCookieFile={() => void chooseCookieFile()}
        onRemoveCookieFile={() => setCookieFile("")}
        onApiProviderChange={setApiProvider}
        onSave={() => void saveSettings()}
        onRepairTools={() => void repairTools()}
        onCheckUpdates={() => void checkForUpdates()}
        onOpenSource={() => void client.openUrl(REPO_URL)}
      />

      <UpdateDialog
        open={updateOpen}
        appUpdate={appUpdate}
        toolUpdates={toolUpdates}
        installing={installingUpdate}
        progress={updateProgress}
        onInstall={() => void installUpdates()}
        onClose={() => setUpdateOpen(false)}
      />

      <Toaster richColors theme={theme} position="bottom-right" />
    </div>
  );
}

export default App;
