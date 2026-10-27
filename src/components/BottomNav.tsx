"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconGrid, IconHome, IconList, IconSettings } from "./icons";

const ITEMS = [
  { href: "/", label: "Home", Icon: IconHome },
  { href: "/moods", label: "Moods", Icon: IconGrid },
  { href: "/playlists", label: "Playlists", Icon: IconList },
  { href: "/settings", label: "Settings", Icon: IconSettings },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-fg/10 bg-bg pb-safe"
    >
      <ul className="mx-auto flex h-[4.25rem] max-w-xl items-stretch justify-around px-2">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href) || (href === "/playlists" && pathname.startsWith("/favorites"));
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 text-[11px] font-semibold ${active ? "text-fg" : "text-muted"}`}
              >
                <span className={`grid h-7 w-14 place-items-center rounded-full transition ${active ? "bg-accent text-accent-fg" : ""}`}>
                  <Icon size={21} />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
