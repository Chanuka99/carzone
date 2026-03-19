import { getCalendarEvents } from "@/app/actions/dashboard";
import CalendarWidget from "@/components/dashboard/CalendarWidget";
import { getRentals } from "@/app/actions/rentals";
import { formatDate, formatCurrency } from "@/lib/utils";
import StatusBadge from "@/components/shared/StatusBadge";
import Link from "next/link";
import { CalendarDays, Eye } from "lucide-react";

export default async function CalendarPage() {
  const [{ rentals, vehicles }, { data: upcoming }] = await Promise.all([
    getCalendarEvents(),
    getRentals({ status: "active", pageSize: 50 }),
  ]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-subtitle">Rental schedule and service alerts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-1">
          <CalendarWidget rentals={rentals} vehicles={vehicles} />
        </div>

        <div className="xl:col-span-2 section-card">
          <div className="section-card-header">
            <h3 className="section-card-title flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-500" /> Active Rentals
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Rental #</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Pickup</th>
                  <th>Return</th>
                  <th>Daily Rate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map(r => (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/rentals/${r.id}`} className="text-blue-500 hover:text-blue-700">
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                    <td><span className="font-semibold text-blue-600">{r.rental_number}</span></td>
                    <td>{r.customer?.name}</td>
                    <td>{r.vehicle?.reg_number}</td>
                    <td className="text-sm">{formatDate(r.start_date)}</td>
                    <td className="text-sm">{formatDate(r.end_date)}</td>
                    <td>{formatCurrency(r.daily_rate)}</td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
                {upcoming.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400">No active rentals</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
