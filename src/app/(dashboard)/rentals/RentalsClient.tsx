"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Eye, Search, Loader2 } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import { Rental } from "@/types";
import { formatCurrency, formatDate, isOverdue } from "@/lib/utils";

interface RentalsClientProps {
  rentals: Rental[];
  total: number;
  currentPage: number;
}

export default function RentalsClient({ rentals, total, currentPage }: RentalsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [vehicleReg, setVehicleReg] = useState("");
  const [isPending, startTransition] = useTransition();

  function applyFilters(overrides?: Record<string, string>) {
    const params = new URLSearchParams();
    const s = overrides?.search ?? search;
    const st = overrides?.status ?? status;
    const vr = overrides?.vehicleReg ?? vehicleReg;
    if (s) params.set("search", s);
    if (st !== "all") params.set("status", st);
    if (vr) params.set("vehicleReg", vr);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  const hasMore = currentPage * 10 < total;

  return (
    <div className="section-card">
      {/* Filters */}
      <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px] max-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="form-input pl-9" placeholder="Rental number..." value={search}
            onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && applyFilters()} />
        </div>
        <div className="relative min-w-[150px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="form-input pl-9" placeholder="Reg number..." value={vehicleReg}
            onChange={(e) => setVehicleReg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && applyFilters()} />
        </div>
        <select className="form-select w-auto" value={status}
          onChange={(e) => { setStatus(e.target.value); applyFilters({ status: e.target.value }); }}>
          <option value="all">All Statuses</option>
          {["active","booked","returned","overdue","cancelled"].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
          ))}
        </select>
        {isPending && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Actions</th>
              <th>Rental #</th>
              <th>Customer</th>
              <th>Vehicle</th>
              <th>Pickup</th>
              <th>Return</th>
              <th>Days</th>
              <th>Daily Rate</th>
              <th>Total</th>
              <th>Deposit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rentals.length === 0 && (
              <tr><td colSpan={11} className="text-center py-12 text-gray-400">No rentals found</td></tr>
            )}
            {rentals.map((r) => {
              const overdue = r.status === "active" && isOverdue(r.end_date);
              return (
                <tr key={r.id} className={overdue ? "bg-red-50/30" : ""}>
                  <td>
                    <Link href={`/rentals/${r.id}`} className="text-blue-500 hover:text-blue-700">
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                  <td><span className="font-semibold text-blue-600">{r.rental_number}</span></td>
                  <td>
                    <p className="font-medium text-gray-900">{r.customer?.name}</p>
                    <p className="text-xs text-gray-400">{r.customer?.phone}</p>
                  </td>
                  <td>
                    <p className="font-medium">{r.vehicle?.brand} {r.vehicle?.model}</p>
                    <p className="text-xs text-gray-400">{r.vehicle?.reg_number}</p>
                  </td>
                  <td className="text-sm">{formatDate(r.start_date)}</td>
                  <td className="text-sm">{formatDate(r.end_date)}</td>
                  <td>{r.total_days}d</td>
                  <td>{formatCurrency(r.daily_rate)}</td>
                  <td className="font-semibold">{formatCurrency(r.total_amount ?? 0)}</td>
                  <td>{formatCurrency(r.deposit)}</td>
                  <td><StatusBadge status={overdue ? "overdue" : r.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-sm text-gray-500">Showing {rentals.length} of {total}</span>
        {hasMore && (
          <Link href={`${pathname}?page=${currentPage + 1}`} className="btn-secondary text-sm">Load More</Link>
        )}
      </div>
    </div>
  );
}
