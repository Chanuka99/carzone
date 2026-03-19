"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Search, Plus, Edit, Trash2, Loader2, UserSearch } from "lucide-react";
import { Customer } from "@/types";
import { formatDate } from "@/lib/utils";
import { createCustomer, updateCustomer, deleteCustomer, getCustomerByNic } from "@/app/actions/customers";
import PasswordConfirmModal from "@/components/shared/PasswordConfirmModal";

interface CustomersClientProps {
  customers: Customer[];
  total: number;
  currentPage: number;
}

export default function CustomersClient({ customers, total, currentPage }: CustomersClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // NIC auto-fill state
  const [nicSearch, setNicSearch] = useState("");
  const [nicLookup, setNicLookup] = useState<Customer | null>(null);
  const [nicSearching, setNicSearching] = useState(false);

  function applySearch() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  async function handleNicSearch() {
    if (!nicSearch) return;
    setNicSearching(true);
    try {
      const result = await getCustomerByNic(nicSearch);
      setNicLookup(result ?? null);
      if (result) {
        // Auto-fill by opening edit form
        setEditCustomer(result);
        setShowForm(false);
      }
    } finally {
      setNicSearching(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = editCustomer ? await updateCustomer(editCustomer.id, fd) : await createCustomer(fd);
      if ("error" in result && result.error) { setError(result.error); return; }
      setShowForm(false);
      setEditCustomer(null);
      router.refresh();
    });
  }

  async function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      await deleteCustomer(deleteId);
      setDeleteId(null);
      router.refresh();
    });
  }

  return (
    <div className="section-card">
      <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
        {/* NIC auto-search */}
        <div className="flex gap-2 items-center">
          <div className="relative">
            <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="form-input pl-9 w-44"
              placeholder="NIC lookup..."
              value={nicSearch}
              onChange={e => setNicSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleNicSearch()}
            />
          </div>
          <button onClick={handleNicSearch} disabled={nicSearching} className="btn-secondary text-xs h-9 px-3">
            {nicSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : "Find"}
          </button>
          {nicLookup === null && nicSearch && !nicSearching && (
            <span className="text-xs text-gray-400">Not found</span>
          )}
        </div>

        <div className="w-px h-6 bg-gray-200" />

        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="form-input pl-9" placeholder="Search name, NIC, phone..." value={search}
            onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && applySearch()} />
        </div>
        {isPending && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
        <button onClick={() => { setEditCustomer(null); setShowForm(true); }} className="btn-primary ml-auto">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Inline form */}
      {(showForm || editCustomer) && (
        <div className="border-b border-gray-100 p-5 bg-blue-50/30">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">{editCustomer ? "Edit Customer" : "Add New Customer"}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { name: "name", label: "Full Name", required: true, defaultValue: editCustomer?.name },
              { name: "nic", label: "NIC", defaultValue: editCustomer?.nic },
              { name: "phone", label: "Phone", defaultValue: editCustomer?.phone },
              { name: "phone2", label: "Phone 2", defaultValue: editCustomer?.phone2 },
              { name: "email", label: "Email", type: "email", defaultValue: editCustomer?.email },
              { name: "address", label: "Address", defaultValue: editCustomer?.address },
              { name: "license_number", label: "License Number", defaultValue: editCustomer?.license_number },
              { name: "license_expiry", label: "License Expiry", type: "date", defaultValue: editCustomer?.license_expiry },
              { name: "notes", label: "Notes", defaultValue: editCustomer?.notes },
            ].map(f => (
              <div key={f.name}>
                <label className="form-label text-xs">{f.label}{f.required && <span className="text-red-500">*</span>}</label>
                <input name={f.name} type={f.type ?? "text"} required={f.required} defaultValue={f.defaultValue ?? ""} className="form-input text-sm" />
              </div>
            ))}

            {/* Document uploads */}
            <div>
              <label className="form-label text-xs">NIC — Front</label>
              <input name="nic_front" type="file" accept="image/*,.pdf" className="form-input text-sm h-auto py-1.5" />
            </div>
            <div>
              <label className="form-label text-xs">NIC — Back</label>
              <input name="nic_back" type="file" accept="image/*,.pdf" className="form-input text-sm h-auto py-1.5" />
            </div>
            <div>
              <label className="form-label text-xs">Photo</label>
              <input name="photo" type="file" accept="image/*" className="form-input text-sm h-auto py-1.5" />
            </div>

            {error && <p className="col-span-3 text-sm text-red-600">{error}</p>}
            <div className="col-span-3 flex gap-3 justify-end mt-1">
              <button type="button" onClick={() => { setShowForm(false); setEditCustomer(null); setError(null); }} className="btn-secondary text-sm">Cancel</button>
              <button type="submit" disabled={isPending} className="btn-primary text-sm">{isPending ? "Saving..." : "Save"}</button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead><tr><th>Actions</th><th>Name</th><th>NIC</th><th>Phone</th><th>Phone 2</th><th>License</th><th>License Expiry</th><th>Address</th></tr></thead>
          <tbody>
            {customers.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-gray-400">No customers found</td></tr>}
            {customers.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditCustomer(c); setShowForm(false); }} className="text-blue-500 hover:text-blue-700"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteId(c.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
                <td><p className="font-medium text-gray-900">{c.name}</p></td>
                <td className="text-gray-500">{c.nic ?? "—"}</td>
                <td>{c.phone ?? "—"}</td>
                <td className="text-gray-400">{c.phone2 ?? "—"}</td>
                <td className="text-gray-500">{c.license_number ?? "—"}</td>
                <td className="text-gray-500">{formatDate(c.license_expiry)}</td>
                <td className="text-gray-500 max-w-[150px] truncate">{c.address ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-sm text-gray-500">Showing {customers.length} of {total}</span>
        {currentPage * 10 < total && (
          <Link href={`${pathname}?page=${currentPage + 1}`} className="btn-secondary text-sm">Load More</Link>
        )}
      </div>

      <PasswordConfirmModal open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Delete Customer" description="This will deactivate this customer record." onConfirm={handleDelete} />
    </div>
  );
}
