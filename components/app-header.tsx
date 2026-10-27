import { ThemeDropdown } from "@/components/theme-switcher";
import { Wordmark } from "@/components/logo";

export function AppHeader({ title }: { title?: string }) {
  return (
    <header className="flex items-center justify-between pb-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
      {title ? <h1 className="text-3xl font-black tracking-tight">{title}</h1> : <Wordmark />}
      <ThemeDropdown />
    </header>
  );
}
