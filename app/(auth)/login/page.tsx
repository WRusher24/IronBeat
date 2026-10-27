import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <>
      <h1 className="text-4xl font-black leading-tight tracking-tight">Welcome back.<br />Time to lift.</h1>
      <p className="mb-8 mt-3 text-muted">Sign in to your private music vault.</p>
      <AuthForm mode="login" />
    </>
  );
}
