"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client-api";
import { Button } from "@/components/ui";

const fieldClass =
  "min-h-14 w-full rounded-2xl border border-line bg-transparent px-4 text-[16px] outline-none transition focus:border-fg";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isRegister = mode === "register";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      await api(`/api/auth/${mode}`, {
        method: "POST",
        json: {
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
          ...(isRegister ? { displayName: String(form.get("displayName") ?? "") } : {}),
        },
      });
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      {isRegister && (
        <input name="displayName" placeholder="Your name" autoComplete="name" required maxLength={60} className={fieldClass} aria-label="Your name" />
      )}
      <input name="email" type="email" inputMode="email" placeholder="Email" autoComplete="email" autoCapitalize="none" required className={fieldClass} aria-label="Email" />
      <input
        name="password"
        type="password"
        placeholder={isRegister ? "Password (8+ characters)" : "Password"}
        autoComplete={isRegister ? "new-password" : "current-password"}
        minLength={isRegister ? 8 : undefined}
        required
        className={fieldClass}
        aria-label="Password"
      />
      {error && (
        <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <Button type="submit" loading={loading} className="w-full min-h-14 text-base">
        {isRegister ? "Create account & start" : "Sign in"}
      </Button>
      <p className="pt-2 text-center text-sm text-muted">
        {isRegister ? "Already lifting with us?" : "New to IronBeat?"}{" "}
        <Link href={isRegister ? "/login" : "/register"} className="font-bold text-fg underline underline-offset-4">
          {isRegister ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
