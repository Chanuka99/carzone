"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Search, Plus, Edit, Trash2, Loader2, Car, Eye } from "lucide-react";
import { Supplier } from "@/types";
import { createSupplier, updateSupplier, deleteSupplier } from "@/app/actions/suppliers";
import PasswordConfirmModal from "@/components/shared/PasswordConfirmModal";
import { BANKS } from "@/lib/vehicleData";

export default function SuppliersClient({
  suppliers,
  total,
  currentPage,
}: {
  suppliers: Supplier[];
  total: number;
  currentPage: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function applySearch() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  async function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      await deleteSupplier(deleteId);
      setDeleteId(null);
      router.refresh();
    });
  }

  // Split existing supplier name into first + last
  function splitName(name?: string): [string, string] {
    if (!name) return ["", ""];
    const parts = name.trim().split(" ");
    if (parts.length === 1) return [parts[0], ""];
    return [parts[0], parts.slice(1).join(" ")];
  }

  return (
    <div className="section-card">
      <div className="px-5 py-4 border-b border-gray-100 flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="form-input pl-9"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && applySearch()}
          />
        </div>
        {isPending && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
        <Link href="/suppliers/new" className="btn-primary ml-auto">
          <Plus className="w-4 h-4" /> Add Supplier
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr><th>Actions</th><th>Name</th><th>Phone</th><th>Email</th><th>NIC</th><th>Address</th><th>Vehicles</th></tr>
          </thead>
          <tbody>
            {suppliers.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">No suppliers found</td></tr>
            )}
            {suppliers.map(s => (
              <tr key={s.id}>
                <td>
                  <div className="flex gap-2">
                    <Link href={`/suppliers/${s.id}`} className="text-green-600 hover:text-green-700" title="View">
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button onClick={() => setDeleteId(s.id)} className="text-red-400 hover:text-red-600" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
                <td><p className="font-medium text-gray-900">{s.name}</p></td>
                <td>{s.phone ?? "—"}</td>
                <td className="text-gray-500">{s.email ?? "—"}</td>
                <td className="text-gray-500">{s.nic ?? "—"}</td>
                <td className="text-gray-500 max-w-[150px] truncate">{s.address ?? "—"}</td>
                <td>
                  <Link href={`/vehicles?supplier=${s.id}`} className="inline-flex items-center gap-1 text-blue-500 text-xs hover:underline">
                    <Car className="w-3 h-3" /> Vehicles
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-sm text-gray-500">Showing {suppliers.length} of {total}</span>
        {currentPage * 10 < total && (
          <Link href={`${pathname}?page=${currentPage + 1}`} className="btn-secondary text-sm">Load More</Link>
        )}
      </div>

      <PasswordConfirmModal
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Supplier"
        description="This will deactivate this supplier."
        onConfirm={handleDelete}
      />
    </div>
  );
}
