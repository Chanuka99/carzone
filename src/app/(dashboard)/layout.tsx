import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar user={session} />
      <main className="flex-1 ml-[256px] overflow-y-auto">
        <div className="min-h-screen p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
