import type { ReactNode } from "react";
import { Wordmark } from "@/components/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      <div className="mb-8">
        <Wordmark className="text-3xl" />
      </div>
      {children}
    </main>
  );
}
