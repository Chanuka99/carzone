"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Search, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Guarantor } from "@/types";
import { createGuarantor, updateGuarantor, deleteGuarantor } from "@/app/actions/suppliers";
import PasswordConfirmModal from "@/components/shared/PasswordConfirmModal";
import StatusBadge from "@/components/shared/StatusBadge";

export default function GuarantorsClient({
  guarantors,
  total,
  currentPage,
}: {
  guarantors: Guarantor[];
  total: number;
  currentPage: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [editGuarantor, setEditGuarantor] = useState<Guarantor | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function applySearch() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = editGuarantor
        ? await updateGuarantor(editGuarantor.id, fd)
        : await createGuarantor(fd);
      if ("error" in result && result.error) { setError(result.error); return; }
      setShowForm(false);
      setEditGuarantor(null);
      router.refresh();
    });
  }

  async function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      await deleteGuarantor(deleteId);
      setDeleteId(null);
      router.refresh();
    });
  }

  return (
    <div className="section-card">
      <div className="px-5 py-4 border-b border-gray-100 flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="form-input pl-9"
            placeholder="Search name, NIC, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && applySearch()}
          />
        </div>
        {isPending && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
        <button onClick={() => { setEditGuarantor(null); setShowForm(true); }} className="btn-primary ml-auto">
          <Plus className="w-4 h-4" /> Add Guarantor
        </button>
      </div>

      {/* Inline Form */}
      {(showForm || editGuarantor) && (
        <div className="border-b border-gray-100 p-5 bg-blue-50/30">
          <h3 className="text-sm font-semibold mb-4">{editGuarantor ? "Edit Guarantor" : "Add Guarantor"}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { name: "name", label: "Full Name", required: true, defaultValue: editGuarantor?.name },
              { name: "nic", label: "NIC", defaultValue: editGuarantor?.nic },
              { name: "phone", label: "Phone", defaultValue: editGuarantor?.phone },
              { name: "phone2", label: "Phone 2", defaultValue: editGuarantor?.phone2 },
              { name: "address", label: "Address", defaultValue: editGuarantor?.address },
              { name: "notes", label: "Notes", defaultValue: editGuarantor?.notes },
            ].map(f => (
              <div key={f.name}>
                <label className="form-label text-xs">{f.label}{f.required && <span className="text-red-500">*</span>}</label>
                <input name={f.name} required={f.required} defaultValue={f.defaultValue ?? ""} className="form-input text-sm" />
              </div>
            ))}
            {/* NIC front/back upload */}
            <div>
              <label className="form-label text-xs">NIC — Front</label>
              <input name="nic_front" type="file" accept="image/*,.pdf" className="form-input text-sm h-auto py-1.5" />
            </div>
            <div>
              <label className="form-label text-xs">NIC — Back</label>
              <input name="nic_back" type="file" accept="image/*,.pdf" className="form-input text-sm h-auto py-1.5" />
            </div>
            {/* Photo */}
            <div>
              <label className="form-label text-xs">Photo</label>
              <input name="photo" type="file" accept="image/*" className="form-input text-sm h-auto py-1.5" />
            </div>
            {error && <p className="col-span-3 text-sm text-red-600">{error}</p>}
            <div className="col-span-3 flex gap-3 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditGuarantor(null); }} className="btn-secondary text-sm">Cancel</button>
              <button type="submit" disabled={isPending} className="btn-primary text-sm">Save</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead><tr><th>Actions</th><th>Name</th><th>NIC</th><th>Phone</th><th>Address</th><th>Linked To</th></tr></thead>
          <tbody>
            {guarantors.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">No guarantors found</td></tr>
            )}
            {guarantors.map(g => (
              <tr key={g.id}>
                <td>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditGuarantor(g); setShowForm(false); }} className="text-blue-500 hover:text-blue-700">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteId(g.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
                <td><p className="font-medium text-gray-900">{g.name}</p></td>
                <td className="text-gray-500">{g.nic ?? "—"}</td>
                <td>{g.phone ?? "—"}</td>
                <td className="text-gray-500 max-w-[150px] truncate">{g.address ?? "—"}</td>
                <td>
                  {g.customer ? (
                    <span className="text-xs text-gray-500">{g.customer.name}</span>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-sm text-gray-500">Showing {guarantors.length} of {total}</span>
        {currentPage * 10 < total && (
          <Link href={`${pathname}?page=${currentPage + 1}`} className="btn-secondary text-sm">Load More</Link>
        )}
      </div>

      <PasswordConfirmModal
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Guarantor"
        description="Remove this guarantor record."
        onConfirm={handleDelete}
      />
    </div>
  );
}
