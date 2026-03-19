"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, ToggleLeft, ToggleRight } from "lucide-react";
import { createUser, updateUser, toggleUserActive } from "@/app/actions/users";
import PasswordConfirmModal from "@/components/shared/PasswordConfirmModal";
import StatusBadge from "@/components/shared/StatusBadge";
import { User } from "@/types";

export default function UsersClient({ users: initialUsers }: { users: User[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<User | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = editUser ? await updateUser(editUser.id, fd) : await createUser(fd);
      if ("error" in result && result.error) { setError(result.error); return; }
      setShowForm(false); setEditUser(null); router.refresh();
    });
  }

  async function handleToggle() {
    if (!confirmToggle) return;
    startTransition(async () => {
      await toggleUserActive(confirmToggle.id, !confirmToggle.is_active);
      setConfirmToggle(null);
      router.refresh();
    });
  }

  return (
    <div className="section-card">
      <div className="section-card-header">
        <h2 className="section-card-title">Staff Accounts</h2>
        <button onClick={() => { setEditUser(null); setShowForm(true); }} className="btn-primary text-sm"><Plus className="w-4 h-4" /> Add User</button>
      </div>

      {(showForm || editUser) && (
        <div className="border-b border-gray-100 p-5 bg-blue-50/30">
          <h3 className="text-sm font-semibold mb-4">{editUser ? "Edit User" : "New User"}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="form-label text-xs">Username <span className="text-red-500">*</span></label>
              <input name="username" required defaultValue={editUser?.username ?? ""} className="form-input text-sm" disabled={!!editUser} />
            </div>
            <div>
              <label className="form-label text-xs">Full Name <span className="text-red-500">*</span></label>
              <input name="full_name" required defaultValue={editUser?.full_name ?? ""} className="form-input text-sm" />
            </div>
            <div>
              <label className="form-label text-xs">Email</label>
              <input name="email" type="email" defaultValue={editUser?.email ?? ""} className="form-input text-sm" />
            </div>
            <div>
              <label className="form-label text-xs">Password {!editUser && <span className="text-red-500">*</span>} {editUser && <span className="text-gray-400">(leave blank to keep)</span>}</label>
              <input name="password" type="password" required={!editUser} className="form-input text-sm" />
            </div>
            <div>
              <label className="form-label text-xs">Role</label>
              <select name="role" defaultValue={editUser?.role ?? "employee"} className="form-select text-sm">
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {error && <p className="col-span-3 text-sm text-red-600">{error}</p>}
            <div className="col-span-3 flex gap-3 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditUser(null); setError(null); }} className="btn-secondary text-sm">Cancel</button>
              <button type="submit" disabled={isPending} className="btn-primary text-sm">{isPending ? "Saving..." : "Save User"}</button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead><tr><th>Actions</th><th>Username</th><th>Full Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td><div className="flex gap-2">
                  <button onClick={() => { setEditUser(u); setShowForm(false); }} className="text-blue-500"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => setConfirmToggle(u)} className="text-gray-500">
                    {u.is_active ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-gray-300" />}
                  </button>
                </div></td>
                <td><code className="text-sm bg-gray-100 px-1.5 py-0.5 rounded">{u.username}</code></td>
                <td className="font-medium">{u.full_name}</td>
                <td className="text-gray-500">{u.email ?? "—"}</td>
                <td><StatusBadge status={u.role} /></td>
                <td><StatusBadge status={u.is_active ? "available" : "cancelled"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PasswordConfirmModal
        open={!!confirmToggle}
        onOpenChange={() => setConfirmToggle(null)}
        title={confirmToggle?.is_active ? "Deactivate User" : "Activate User"}
        description={`Toggle active status for ${confirmToggle?.full_name}?`}
        onConfirm={handleToggle}
      />
    </div>
  );
}
