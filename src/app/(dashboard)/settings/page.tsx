import { getCompanySettings } from "@/app/actions/users";
import { requireAdmin } from "@/lib/auth";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  await requireAdmin();
  const settings = await getCompanySettings();
  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Company Settings</h1>
          <p className="page-subtitle">Configure company information and defaults</p>
        </div>
      </div>
      <SettingsClient settings={settings} />
    </div>
  );
}
