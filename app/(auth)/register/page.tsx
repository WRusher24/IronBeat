import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-4xl font-black leading-tight tracking-tight">Your soundtrack.<br />Your vault.</h1>
      <p className="mb-8 mt-3 text-muted">Sign up and start playing instantly. No approval, no waiting.</p>
      <AuthForm mode="register" />
    </>
  );
}
