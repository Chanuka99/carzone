"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Search, Plus, Edit, Trash2, Loader2, Eye, Upload, X } from "lucide-react";
import { Guarantor } from "@/types";
import { createGuarantor, updateGuarantor, deleteGuarantor } from "@/app/actions/suppliers";
import PasswordConfirmModal from "@/components/shared/PasswordConfirmModal";
import StatusBadge from "@/components/shared/StatusBadge";
import FileUploader from "@/components/shared/FileUploader";

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
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function applySearch() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  // Handle form submission for 'Add Guarantor' only
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createGuarantor(fd);
      if (result && "error" in result && result.error) { setError(result.error); return; }
      setShowForm(false);
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
        <button onClick={() => setShowForm(true)} className="btn-primary ml-auto">
          <Plus className="w-4 h-4" /> Add Guarantor
        </button>
      </div>

      {/* Inline Form for "Add New" Only */}
      {showForm && (
        <div className="border-b border-gray-100 p-5 bg-blue-50/30">
          <h3 className="text-sm font-semibold mb-4">Add Guarantor</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { name: "name", label: "Full Name", required: true },
              { name: "nic", label: "NIC" },
              { name: "phone", label: "Phone" },
              { name: "phone2", label: "Phone 2" },
              { name: "address", label: "Address" },
              { name: "notes", label: "Notes" },
            ].map(f => (
              <div key={f.name}>
                <label className="form-label text-xs">{f.label}{f.required && <span className="text-red-500">*</span>}</label>
                <input name={f.name} required={f.required} className="form-input text-sm" />
              </div>
            ))}
            {/* Consistent file upload UI using generic FileUploader */}
            <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-gray-100 pt-5 mt-2">
              <FileUploader
                label="NIC Front"
                bucket="guarantors"
                folder="temp"
                maxFiles={1}
              />
              <FileUploader
                label="NIC Back"
                bucket="guarantors"
                folder="temp"
                maxFiles={1}
              />
              <FileUploader
                label="Photo"
                bucket="guarantors"
                folder="temp"
                maxFiles={1}
              />
            </div>
            {error && <p className="col-span-3 text-sm text-red-600">{error}</p>}
            <div className="col-span-3 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
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
                    <Link href={`/guarantors/${g.id}`} className="text-blue-500 hover:text-blue-700">
                      <Eye className="w-4 h-4" />
                    </Link>
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
    </div>
  );
}
