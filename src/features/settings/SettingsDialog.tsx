import { ArrowClockwiseIcon, ArrowSquareOutIcon, FolderOpenIcon, XIcon } from "@phosphor-icons/react";
import type { ApiProviderSettings, AppSettings, ToolsReport } from "../../lib/types";
import { IconButton } from "../../components/ui/IconButton";
import type { ThemePreference } from "../../lib/use-theme";
import { useEffect, useRef, useState } from "react";
import { Select } from "../../components/ui/select";
import { Switch } from "../../components/ui/switch";
import { Input } from "../../components/ui/input";
import { version } from "../../../package.json";

type CookieBrowser = AppSettings["cookieBrowser"];

type SettingsDialogProps = {
  open: boolean;
  themePreference: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  outputFolder: string;
  autoStart: boolean;
  showAdvanced: boolean;
  communityFallback: boolean;
  instagramProxyFallback: boolean;
  concurrency: number;
  cookiesFromBrowser: boolean;
  cookieBrowser: CookieBrowser;
  cookieBrowserProfile: string;
  cookieFile: string;
  apiProvider: ApiProviderSettings;
  tools: ToolsReport | null;
  isDesktop: boolean;
  checkingTools: boolean;
  checkingUpdates: boolean;
  onClose: () => void;
  onChooseFolder: () => void;
  onAutoStartChange: (value: boolean) => void;
  onShowAdvancedChange: (value: boolean) => void;
  onCommunityFallbackChange: (value: boolean) => void;
  onInstagramProxyFallbackChange: (value: boolean) => void;
  onConcurrencyChange: (value: number) => void;
  onCookiesFromBrowserChange: (value: boolean) => void;
  onCookieBrowserChange: (value: CookieBrowser) => void;
  onCookieBrowserProfileChange: (value: string) => void;
  onChooseCookieFile: () => void;
  onRemoveCookieFile: () => void;
  onApiProviderChange: (provider: ApiProviderSettings) => void;
  onSave: () => void;
  onRepairTools: () => void;
  onCheckUpdates: () => void;
  onOpenSource: () => void;
};

type SettingsTab = "general" | "appearance" | "advanced" | "about";

function toolSummary(tool: ToolsReport["ytDlp"] | undefined, isDesktop: boolean) {
  if (!tool) return "Checking";
  if (!isDesktop) return "Preview data";
  if (!tool.available) return "Not installed yet";
  if (tool.verified) return "Ready · SHA-256 verified";
  return "Ready · provided by system";
}

export function SettingsDialog({ open, themePreference, onThemeChange, outputFolder, autoStart, showAdvanced, communityFallback, instagramProxyFallback, concurrency, cookiesFromBrowser, cookieBrowser, cookieBrowserProfile, cookieFile, apiProvider, tools, isDesktop, checkingTools, checkingUpdates, onClose, onChooseFolder, onAutoStartChange, onShowAdvancedChange, onCommunityFallbackChange, onInstagramProxyFallbackChange, onConcurrencyChange, onCookiesFromBrowserChange, onCookieBrowserChange, onCookieBrowserProfileChange, onChooseCookieFile, onRemoveCookieFile, onApiProviderChange, onSave, onRepairTools, onCheckUpdates, onOpenSource }: SettingsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    } else if (!open && dialog.open) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
  }, [open]);

  return (
    <dialog ref={dialogRef} className="modal-dialog" aria-labelledby="settings-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-panel settings-panel">
        <header className="modal-header">
          <div className="modal-title-lockup">
            <h2 id="settings-dialog-title">Settings</h2>
          </div>
          <IconButton label="Close settings" onClick={onClose}>
            <XIcon size={16} weight="regular" aria-hidden="true" />
          </IconButton>
        </header>


        <nav className="settings-nav" aria-label="Settings categories">
          <button type="button" className={`settings-nav-item ${activeTab === "general" ? "is-active" : ""}`} onClick={() => setActiveTab("general")}>
            General
          </button>
          <button type="button" className={`settings-nav-item ${activeTab === "appearance" ? "is-active" : ""}`} onClick={() => setActiveTab("appearance")}>
            Appearance
          </button>
          <button type="button" className={`settings-nav-item ${activeTab === "advanced" ? "is-active" : ""}`} onClick={() => setActiveTab("advanced")}>
            Advanced
          </button>
          <button type="button" className={`settings-nav-item ${activeTab === "about" ? "is-active" : ""}`} onClick={() => setActiveTab("about")}>
            About
          </button>
        </nav>


        <div className="modal-body settings-body">
          {activeTab === "general" && (
            <div className="settings-tab-pane">
              <section className="settings-field-group">
                <span className="field-title">Download folder</span>
                <p className="field-desc">Files are saved locally and never overwritten.</p>
                <div className="folder-row">
                  <span className="folder-path" title={outputFolder}>
                    {outputFolder || "Downloads"}
                  </span>
                  <button type="button" className="secondary-button compact-btn" onClick={onChooseFolder}>
                    <FolderOpenIcon size={16} weight="regular" aria-hidden="true" />
                    Choose folder
                  </button>
                </div>
              </section>

              <section className="settings-field-group">
                <div className="select-field">
                  <label htmlFor="parallel-fragments" className="field-title">Parallel fragments</label>
                  <p className="field-desc">Higher fragments increase download speed on fast connections.</p>
                  <Select id="parallel-fragments" value={String(concurrency)} onChange={(event) => onConcurrencyChange(Number(event.currentTarget.value))}>
                    <option value="1">1 - lowest resource use</option>
                    <option value="2">2 - efficient (default)</option>
                    <option value="4">4 - balanced</option>
                    <option value="8">8 - fast connection</option>
                  </Select>
                </div>
              </section>

              <section className="settings-field-group">
                <label className="switch-row">
                  <div className="switch-text">
                    <span className="field-title">Auto-start downloads</span>
                    <span className="field-desc">Automatically begin downloading valid links upon pasting.</span>
                  </div>
                  <Switch checked={autoStart} onCheckedChange={onAutoStartChange} aria-label="Auto-start downloads"/>
                </label>
              </section>
            </div>
          )}


          {activeTab === "appearance" && (
            <div className="settings-tab-pane">
              <section className="settings-field-group">
                <span className="field-title">Interface theme</span>
                <p className="field-desc">Choose whether to follow your operating system theme or force light/dark.</p>
                <div className="theme-options" role="radiogroup" aria-label="Theme selection">
                  <button type="button" role="radio" aria-checked={themePreference === "system"} className={`theme-card ${themePreference === "system" ? "is-selected" : ""}`} onClick={() => onThemeChange("system")}>
                    <span className="theme-card-title">System default</span>
                    <span className="theme-card-sub">Follows OS dark/light mode</span>
                  </button>
                  <button type="button" role="radio" aria-checked={themePreference === "dark"} className={`theme-card ${themePreference === "dark" ? "is-selected" : ""}`} onClick={() => onThemeChange("dark")}>
                    <span className="theme-card-title">Dark mode</span>
                    <span className="theme-card-sub">Deep neutral dark surfaces</span>
                  </button>
                  <button type="button" role="radio" aria-checked={themePreference === "light"} className={`theme-card ${themePreference === "light" ? "is-selected" : ""}`} onClick={() => onThemeChange("light")}>
                    <span className="theme-card-title">Light mode</span>
                    <span className="theme-card-sub">Crisp high-contrast paper</span>
                  </button>
                </div>
              </section>
            </div>
          )}



          {activeTab === "advanced" && (
            <div className="settings-tab-pane">
              <section className="settings-field-group">
                <label className="switch-row">
                  <div className="switch-text">
                    <span className="field-title">Show advanced options</span>
                    <span className="field-desc">Exposes audio bitrate, browser sessions, and fallback endpoints.</span>
                  </div>
                  <Switch checked={showAdvanced} onCheckedChange={onShowAdvancedChange} aria-label="Show advanced options"/>
                </label>
              </section>

              {showAdvanced && (
                <>
                  <section className="settings-field-group">
                    <span className="field-title">Site sign-in</span>
                    <p className="field-desc">Use browser cookies for private or age-restricted links.</p>
                    <label className="switch-row inset-switch">
                      <div className="switch-text">
                        <span>Use browser session</span>
                        <span className="field-desc">Cookies never leave this device.</span>
                      </div>
                      <Switch checked={cookiesFromBrowser} onCheckedChange={onCookiesFromBrowserChange} aria-label="Use browser session"/>
                    </label>

                    {cookiesFromBrowser && (
                      <div className="cookie-browser-inputs">
                        <label className="select-field">
                          <span className="option-label">Browser</span>
                          <Select value={cookieBrowser} onChange={(event) => onCookieBrowserChange(event.currentTarget.value as CookieBrowser) }>
                            <option value="firefox">Mozilla Firefox (recommended)</option>
                            <option value="edge">Microsoft Edge</option>
                            <option value="chrome">Google Chrome</option>
                            <option value="brave">Brave</option>
                            <option value="vivaldi">Vivaldi</option>
                            <option value="opera">Opera</option>
                          </Select>
                        </label>

                        <label className="text-field">
                          <span className="option-label">Profile (optional)</span>
                          <Input value={cookieBrowserProfile} onChange={(event) => onCookieBrowserProfileChange(event.currentTarget.value)} placeholder="Default profile" autoComplete="off"/>
                        </label>
                      </div>
                    )}

                    <div className="cookie-file-box">
                      <div className="cookie-file-text">
                        <span className="cookie-file-name">Netscape cookies.txt</span>
                        <span className="cookie-file-help">Alternative cookie file export</span>
                        {cookieFile && <span className="cookie-file-path">{cookieFile}</span>}
                      </div>
                      <div className="cookie-file-actions">
                        <button type="button" className="secondary-button compact-btn" onClick={onChooseCookieFile} >
                          Choose file
                        </button>
                        {cookieFile && (
                          <button type="button" className="ghost-button compact-btn" onClick={onRemoveCookieFile}>
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="settings-field-group">
                    <span className="field-title">Authorized Cobalt pool</span>
                    <p className="field-desc">Self-hosted or owner-authorized v11 instances.</p>
                    <textarea
                      className="mono-textarea"
                      value={apiProvider.baseUrl}
                      onChange={(event) =>
                        onApiProviderChange({
                          ...apiProvider,
                          baseUrl: event.currentTarget.value,
                          enabled: Boolean(event.currentTarget.value.trim()),
                        })
                      }
                      placeholder={"https://cobalt-one.example\nhttps://cobalt-two.example"}
                      rows={2}
                    />
                    <div className="cobalt-sub-grid">
                      <label className="select-field">
                        <span className="option-label">Authentication</span>
                        <Select
                          value={apiProvider.authType}
                          onChange={(event) =>
                            onApiProviderChange({
                              ...apiProvider,
                              authType: event.currentTarget.value as ApiProviderSettings["authType"],
                            })
                          }
                        >
                          <option value="none">None</option>
                          <option value="api-key">Api-Key</option>
                          <option value="bearer">Bearer</option>
                        </Select>
                      </label>
                      <label className="text-field">
                        <span className="option-label">Session token</span>
                        <Input
                          type="password"
                          value={apiProvider.token}
                          onChange={(event) => onApiProviderChange({ ...apiProvider, token: event.currentTarget.value }) }
                          placeholder="Not saved to disk"
                          autoComplete="off"
                        />
                      </label>
                    </div>
                  </section>

                  <section className="settings-field-group">
                    <span className="field-title">External fallbacks</span>
                    <label className="switch-row">
                      <div className="switch-text">
                        <span>Community fallback servers</span>
                        <span className="field-desc">Legacy opt-in directory.</span>
                      </div>
                      <Switch checked={communityFallback} onCheckedChange={onCommunityFallbackChange} aria-label="Community fallback servers"/>
                    </label>
                    <label className="switch-row">
                      <div className="switch-text">
                        <span>Instagram embed fallback</span>
                        <span className="field-desc">Last-attempt embed proxy for public Instagram posts.</span>
                      </div>
                      <Switch checked={instagramProxyFallback} onCheckedChange={onInstagramProxyFallbackChange} aria-label="Instagram embed fallback"/>
                    </label>
                  </section>
                </>
              )}

              <section className="settings-field-group engine-status-group">
                <span className="field-title">Engine status</span>
                <div className="engine-tools-list">
                  <div className="engine-tool-item">
                    <span className="tool-name">yt-dlp:</span>
                    <span className="tool-version">{toolSummary(tools?.ytDlp, isDesktop)}</span>
                  </div>
                  <div className="engine-tool-item">
                    <span className="tool-name">gallery-dl:</span>
                    <span className="tool-version">{toolSummary(tools?.galleryDl, isDesktop)}</span>
                  </div>
                  <div className="engine-tool-item">
                    <span className="tool-name">Deno:</span>
                    <span className="tool-version">{toolSummary(tools?.deno, isDesktop)}</span>
                  </div>
                  <div className="engine-tool-item">
                    <span className="tool-name">FFmpeg:</span>
                    <span className="tool-version">{toolSummary(tools?.ffmpeg, isDesktop)}</span>
                  </div>
                </div>
                <div className="engine-actions">
                  <button type="button" className="secondary-button compact-btn" onClick={onCheckUpdates} disabled={checkingUpdates || checkingTools}>
                    <ArrowClockwiseIcon size={16} weight="regular" className={checkingUpdates ? "spin" : undefined} aria-hidden="true" />
                    {checkingUpdates ? "Checking" : "Check updates"}
                  </button>
                  <button type="button" className="ghost-button compact-btn" onClick={onRepairTools} disabled={checkingTools}>
                    {checkingTools ? "Repairing" : "Repair engine"}
                  </button>
                </div>
              </section>
            </div>
          )}



          {activeTab === "about" && (
            <div className="settings-tab-pane">
              <section className="settings-field-group">
                <span className="field-title">MediaFilez Desktop</span>
                <p className="field-desc mono-text">Version {version}</p>
                <p className="field-desc">A calm, local-first media downloader designed for privacy and precision.</p>
              </section>

              <section className="settings-field-group">
                <span className="field-title">Privacy & Telemetry</span>
                <p className="field-desc">
                  MediaFilez contains zero trackers, analytics, or telemetry. All media extraction, cookies,
                  and downloaded files stay strictly on your computer.
                </p>
              </section>

              <section className="settings-field-group">
                <span className="field-title">License & Source</span>
                <p className="field-desc">Released under the MIT License.</p>
                <button type="button" className="secondary-button compact-btn" onClick={onOpenSource}>
                  <ArrowSquareOutIcon size={16} weight="regular" aria-hidden="true" />
                  View source on GitHub
                </button>
              </section>
            </div>
          )}
        </div>

        <footer className="modal-footer">
          <button type="button" className="ghost-button" onClick={onClose}>Close</button>
          <button type="button" className="primary-button" onClick={onSave}>Save settings</button>
        </footer>
      </div>
    </dialog>
  );
}
