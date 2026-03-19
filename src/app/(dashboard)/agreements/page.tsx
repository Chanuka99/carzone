import { getRentals } from "@/app/actions/rentals";
import Link from "next/link";
import { FileText, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";
import StatusBadge from "@/components/shared/StatusBadge";

export default async function AgreementsListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const sp = await searchParams;
  const page = parseInt(sp.page ?? "1");
  const { data: rentals, count } = await getRentals({
    search: sp.search,
    page,
    pageSize: 15,
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Rental Agreements</h1>
          <p className="page-subtitle">Print or view agreements for any rental</p>
        </div>
      </div>

      <div className="section-card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rental #</th>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Period</th>
                <th>Status</th>
                <th>Agreement</th>
              </tr>
            </thead>
            <tbody>
              {rentals.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No rentals found</td></tr>
              )}
              {rentals.map(r => (
                <tr key={r.id}>
                  <td><span className="font-semibold text-blue-600">{r.rental_number}</span></td>
                  <td><p className="font-medium">{r.customer?.name}</p></td>
                  <td>
                    <p className="font-medium">{r.vehicle?.brand} {r.vehicle?.model}</p>
                    <p className="text-xs text-gray-400">{r.vehicle?.reg_number}</p>
                  </td>
                  <td className="text-sm text-gray-600">
                    {formatDate(r.start_date)} → {formatDate(r.end_date)}
                  </td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>
                    <div className="flex gap-2">
                      <Link href={`/rentals/${r.id}`} className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 text-xs">
                        <Eye className="w-3 h-3" /> Rental
                      </Link>
                      <a
                        href={`/agreements/${r.id}`}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs font-medium"
                      >
                        <FileText className="w-3 h-3" /> Print
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">Showing {rentals.length} of {count}</span>
          {page * 15 < count && (
            <Link href={`/agreements?page=${page + 1}`} className="btn-secondary text-sm">Load More</Link>
          )}
        </div>
      </div>
    </div>
  );
}
