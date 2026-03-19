import { getUsers } from "@/app/actions/users";
import { requireAdmin } from "@/lib/auth";
import UsersClient from "./UsersClient";

export default async function UsersPage() {
  await requireAdmin();
  const users = await getUsers();
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage staff access and roles</p>
        </div>
      </div>
      <UsersClient users={users as any} />
    </div>
  );
}
