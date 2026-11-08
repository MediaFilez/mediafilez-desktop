import { Tooltip } from "./Tooltip";

export type PlatformInfo = {
  id: string;
  name: string;
  hint: string;
  domains: string[];
  icon: string;
};

export const SUPPORTED_PLATFORMS: PlatformInfo[] = [
  {
    id: "youtube",
    name: "YouTube",
    hint: "Videos, Shorts, Playlists, Audio",
    domains: ["youtube.com", "youtu.be"],
    icon: "/icons/platforms/youtube.png",
  },
  {
    id: "tiktok",
    name: "TikTok",
    hint: "Videos, Slides, Sounds",
    domains: ["tiktok.com"],
    icon: "/icons/platforms/tik-tok.png",
  },
  {
    id: "instagram",
    name: "Instagram",
    hint: "Reels, Posts, Stories",
    domains: ["instagram.com"],
    icon: "/icons/platforms/instagram.png",
  },
  {
    id: "facebook",
    name: "Facebook",
    hint: "Reels, Watch, Video posts",
    domains: ["facebook.com", "fb.watch"],
    icon: "/icons/platforms/facebook.png",
  },
  {
    id: "snapchat",
    name: "Snapchat",
    hint: "Spotlight, Public Stories",
    domains: ["snapchat.com"],
    icon: "/icons/platforms/snapchat.png",
  },
  {
    id: "x",
    name: "X (Twitter)",
    hint: "Videos, GIFs, Clips",
    domains: ["twitter.com", "x.com"],
    icon: "/icons/platforms/twitter.png",
  },
  {
    id: "reddit",
    name: "Reddit",
    hint: "Video posts, Audio, Media",
    domains: ["reddit.com"],
    icon: "/icons/platforms/reddit.png",
  },
  {
    id: "pinterest",
    name: "Pinterest",
    hint: "Video pins, Idea pins, Images",
    domains: ["pinterest.com", "pin.it"],
    icon: "/icons/platforms/pinterest.png",
  },
  {
    id: "discord",
    name: "Discord",
    hint: "Shared media attachments",
    domains: ["discord.com", "discordapp.com"],
    icon: "/icons/platforms/discord.png",
  },
  {
    id: "threads",
    name: "Threads",
    hint: "Videos, Images, Clips",
    domains: ["threads.net"],
    icon: "/icons/platforms/threads.png",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    hint: "Video updates, Posts",
    domains: ["linkedin.com"],
    icon: "/icons/platforms/linkedin.png",
  },
  {
    id: "twitch",
    name: "Twitch",
    hint: "Clips, Highlights, VODs",
    domains: ["twitch.tv"],
    icon: "/icons/platforms/twitch.png",
  },
  {
    id: "vimeo",
    name: "Vimeo",
    hint: "HD video, Original audio",
    domains: ["vimeo.com"],
    icon: "/icons/platforms/vimeo.png",
  },
];

type SupportedPlatformsProps = {
  currentUrl?: string;
  onSelectPlatform?: (platform: PlatformInfo) => void;
};

export function SupportedPlatforms({ currentUrl = "", onSelectPlatform }: SupportedPlatformsProps) {
  const normalizedUrl = currentUrl.toLowerCase();

  const isPlatformActive = (domains: string[]) => {
    return domains.some((domain) => normalizedUrl.includes(domain));
  };

  return (
    <div className="supported-platforms-container" aria-label="Supported platforms">
      <div className="supported-platforms-header">
        <span className="supported-platforms-title">Supported platforms</span>
        <span className="supported-platforms-subtitle">Public media & direct posts</span>
      </div>
      <div className="supported-platforms-grid" role="list">
        {SUPPORTED_PLATFORMS.map((platform) => {
          const active = isPlatformActive(platform.domains);
          return (
            <Tooltip key={platform.id} content={`${platform.name} · ${platform.hint}`} side="top" >
              <button type="button" className={`platform-chip ${active ? "is-active" : ""}`} aria-label={`${platform.name}: ${platform.hint}`} onClick={() => onSelectPlatform?.(platform)} >
                <img src={platform.icon} alt="" width={20} height={20} className="platform-chip-icon" draggable={false} />
                <span className="platform-chip-label">{platform.name}</span>
              </button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
