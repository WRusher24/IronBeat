import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base(children: ReactNode, { size = 24, ...props }: IconProps, fill = false) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? "currentColor" : "none"}
      stroke={fill ? "none" : "currentColor"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconPlay = (p: IconProps) => base(<path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11-6.86a1 1 0 0 0 0-1.7l-11-6.86A1 1 0 0 0 8 5.14Z" />, p, true);
export const IconPause = (p: IconProps) => base(<><rect x="6" y="4.5" width="4.2" height="15" rx="1.2" /><rect x="13.8" y="4.5" width="4.2" height="15" rx="1.2" /></>, p, true);
export const IconNext = (p: IconProps) => base(<><path d="M5 5.6v12.8a.9.9 0 0 0 1.4.75l9-6.4a.9.9 0 0 0 0-1.5l-9-6.4A.9.9 0 0 0 5 5.6Z" /><rect x="16.5" y="5" width="2.5" height="14" rx="1" /></>, p, true);
export const IconPrev = (p: IconProps) => base(<><path d="M19 5.6v12.8a.9.9 0 0 1-1.4.75l-9-6.4a.9.9 0 0 1 0-1.5l9-6.4A.9.9 0 0 1 19 5.6Z" /><rect x="5" y="5" width="2.5" height="14" rx="1" /></>, p, true);
export const IconSearch = (p: IconProps) => base(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>, p);
export const IconHome = (p: IconProps) => base(<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" /></>, p);
export const IconGrid = (p: IconProps) => base(<><rect x="3" y="3" width="7.5" height="7.5" rx="2" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="2" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="2" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" /></>, p);
export const IconList = (p: IconProps) => base(<><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="3.5" cy="6" r="1" /><circle cx="3.5" cy="12" r="1" /><circle cx="3.5" cy="18" r="1" /></>, p);
export const IconSettings = (p: IconProps) => base(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.2.62.8 1.03 1.56 1.03H21a2 2 0 1 1 0 4h-.09c-.76 0-1.36.41-1.51 1Z" /></>, p);
export const IconHeart = ({ filled, ...p }: IconProps & { filled?: boolean }) =>
  base(<path d="M12 20.5s-7.5-4.6-9.2-9.4C1.7 7.9 3.6 4.5 7 4.5c2 0 3.5 1.1 5 3 1.5-1.9 3-3 5-3 3.4 0 5.3 3.4 4.2 6.6-1.7 4.8-9.2 9.4-9.2 9.4Z" />, p, Boolean(filled));
export const IconPlus = (p: IconProps) => base(<path d="M12 5v14M5 12h14" />, p);
export const IconMore = (p: IconProps) => base(<><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></>, p, true);
export const IconChevronDown = (p: IconProps) => base(<path d="m6 9 6 6 6-6" />, p);
export const IconChevronRight = (p: IconProps) => base(<path d="m9 6 6 6-6 6" />, p);
export const IconClose = (p: IconProps) => base(<path d="M6 6l12 12M18 6 6 18" />, p);
export const IconTrash = (p: IconProps) => base(<><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></>, p);
export const IconEdit = (p: IconProps) => base(<><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></>, p);
export const IconShuffle = (p: IconProps) => base(<><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></>, p);
export const IconRepeat = (p: IconProps) => base(<><path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" /></>, p);
export const IconPalette = (p: IconProps) => base(<><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.5-1.9-.3-1 .4-2.1 1.5-2.1H17a4 4 0 0 0 4-4c0-5-4-10-9-10Z" /><circle cx="7.5" cy="11" r="1" fill="currentColor" /><circle cx="10.5" cy="7" r="1" fill="currentColor" /><circle cx="15" cy="7.5" r="1" fill="currentColor" /></>, p);
export const IconQueue = (p: IconProps) => base(<><path d="M3 6h13M3 12h13M3 18h8" /><path d="m17 15 5 3-5 3v-6Z" fill="currentColor" /></>, p);
export const IconCheck = (p: IconProps) => base(<path d="m5 12.5 4.5 4.5L19 7.5" />, p);
export const IconLogout = (p: IconProps) => base(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>, p);
export const IconBolt = (p: IconProps) => base(<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />, p, true);

export function Equalizer({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex h-4 items-end gap-[2px] ${className}`} aria-hidden="true">
      {[0, 0.3, 0.6].map((d) => (
        <span key={d} className="w-[3px] h-full origin-bottom rounded-full bg-current animate-eq" style={{ animationDelay: `${d}s` }} />
      ))}
    </span>
  );
}
