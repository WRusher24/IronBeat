import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { SettingsView } from "@/components/settings-view";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  return (
    <>
      <AppHeader title="Settings" />
      <SettingsView displayName={user?.displayName ?? ""} email={user?.email ?? ""} />
    </>
  );
}
