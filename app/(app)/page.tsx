import { getCurrentUser } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { SearchHome } from "@/components/search-home";

export default async function HomePage() {
  const user = await getCurrentUser();
  return (
    <>
      <AppHeader />
      <SearchHome displayName={user?.displayName ?? "Athlete"} />
    </>
  );
}
