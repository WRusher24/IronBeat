"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { fetchJson, jsonBody } from "@/lib/client-api";
import { Logo } from "./Logo";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isRegister = mode === "register";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await fetchJson(`/api/auth/${mode}`, {
        method: "POST",
        ...jsonBody({
          email: form.get("email"),
          password: form.get("password"),
          ...(isRegister ? { displayName: form.get("displayName") } : {}),
        }),
      });
      const next = params.get("next");
      router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-10 pt-safe pb-safe">
      <div className="mb-8 flex flex-col items-center text-center">
        <Logo size={72} />
        <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight">IronBeat</h1>
        <p className="mt-2 text-muted">
          {isRegister ? "Create your private music vault. No waiting, no approval." : "Welcome back. Time to lift."}
        </p>
      </div>

      <form onSubmit={onSubmit} className="card-surface space-y-4 p-6" noValidate>
        {isRegister && (
          <label className="block">
            <span className="mb-1.5 block text-sm text-card-muted">Name</span>
            <input name="displayName" autoComplete="name" required maxLength={40} placeholder="Your name" className="field !bg-card-fg/10 !border-card-fg/20 !text-card-fg placeholder:!text-card-muted" />
          </label>
        )}
        <label className="block">
          <span className="mb-1.5 block text-sm text-card-muted">Email</span>
          <input name="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" required placeholder="you@example.com" className="field !bg-card-fg/10 !border-card-fg/20 !text-card-fg placeholder:!text-card-muted" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-card-muted">Password</span>
          <input name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} required minLength={isRegister ? 8 : 1} maxLength={72} placeholder={isRegister ? "At least 8 characters" : "Your password"} className="field !bg-card-fg/10 !border-card-fg/20 !text-card-fg placeholder:!text-card-muted" />
        </label>

        {error && (
          <p role="alert" className="rounded-2xl bg-red-500/15 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-accent w-full">
          {busy ? "One moment…" : isRegister ? "Create account" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {isRegister ? "Already have an account?" : "New to IronBeat?"}{" "}
        <Link href={isRegister ? "/login" : "/register"} className="font-semibold text-fg underline underline-offset-4">
          {isRegister ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </main>
  );
}
