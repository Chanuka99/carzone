import { getDashboardStats, getTopVehicles, getTopCustomers, getUpcomingRentals, getCalendarEvents } from "@/app/actions/dashboard";
import { getSession } from "@/lib/auth";
import { formatCurrency, formatDate, isOverdue } from "@/lib/utils";
import {
  Car, Users, CalendarDays, Wrench, DollarSign, Package, TrendingUp, AlertTriangle,
  Plus, CheckCircle2, Circle, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import StatusBadge from "@/components/shared/StatusBadge";
import CalendarWidget from "@/components/dashboard/CalendarWidget";

export default async function DashboardPage() {
  const [session, stats, topVehicles, topCustomers, upcoming, calendarData] = await Promise.all([
    getSession(),
    getDashboardStats(),
    getTopVehicles(10),
    getTopCustomers(10),
    getUpcomingRentals(),
    getCalendarEvents(),
  ]);

  const today = upcoming.filter((r: { end_date: string; start_date: string }) => r.end_date === new Date().toISOString().substring(0, 10) || r.start_date === new Date().toISOString().substring(0, 10));
  const overdue = upcoming.filter((r: { end_date: string; status: string }) => isOverdue(r.end_date) && r.status !== 'returned');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white shadow-md">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold">Welcome back, {session?.full_name?.split(" ")[0]} 👋</h1>
            <p className="text-blue-100 text-sm mt-0.5">{new Date().toLocaleDateString("en-LK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/rentals" className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
              All Rentals
            </Link>
            <Link href="/vehicles" className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
              Manage Fleet
            </Link>
            <Link href="/rentals/new" className="px-4 py-2 bg-white text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors shadow-sm">
              + New Rental
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
        <KpiCard icon={<Car className="w-5 h-5 text-blue-600" />} label="Active Rentals" value={stats.activeRentals} color="blue" />
        <KpiCard icon={<CheckCircle2 className="w-5 h-5 text-green-600" />} label="Available" value={stats.availableVehicles} color="green" />
        <KpiCard icon={<CalendarDays className="w-5 h-5 text-amber-600" />} label="Booked" value={stats.bookedVehicles} color="amber" />
        <KpiCard icon={<Wrench className="w-5 h-5 text-purple-600" />} label="In Garage" value={stats.inGarageVehicles} color="purple" />
        <KpiCard icon={<AlertTriangle className="w-5 h-5 text-red-600" />} label="Service Overdue" value={stats.overdueRentals} color="red" />
        <KpiCard icon={<DollarSign className="w-5 h-5 text-emerald-600" />} label="Today Revenue" value={formatCurrency(stats.todayRevenue)} color="emerald" small />
        <KpiCard icon={<Package className="w-5 h-5 text-indigo-600" />} label="Total Deposit" value={formatCurrency(stats.totalDeposit)} color="indigo" small />
      </div>

      {/* Status summary row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="section-card">
          <div className="section-card-header">
            <h3 className="section-card-title">Rental Status</h3>
          </div>
          <div className="flex items-center gap-6 px-6 py-4">
            <StatusPill label="Active" count={stats.activeRentals} color="bg-blue-500" />
            <StatusPill label="Booked" count={stats.bookedVehicles} color="bg-amber-500" />
            <StatusPill label="Service Overdue" count={stats.overdueRentals} color="bg-red-500" />
          </div>
        </div>
        <div className="section-card">
          <div className="section-card-header">
            <h3 className="section-card-title">Fleet Status</h3>
          </div>
          <div className="flex items-center gap-6 px-6 py-4">
            <StatusPill label="Total" count={stats.totalVehicles} color="bg-gray-500" />
            <StatusPill label="Available" count={stats.availableVehicles} color="bg-green-500" />
            <StatusPill label="In Garage" count={stats.inGarageVehicles} color="bg-purple-500" />
          </div>
        </div>
      </div>

      {/* Top 10 + Schedule */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Top Vehicles */}
        <div className="section-card">
          <div className="section-card-header">
            <h3 className="section-card-title flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-500" /> Top Vehicles</h3>
            <Link href="/vehicles" className="text-xs text-blue-600 hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {topVehicles.slice(0, 5).map((v, i) => (
              <div key={v.vehicle_id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{v.brand} {v.model}</p>
                  <p className="text-xs text-gray-500">{v.reg_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{v.rental_count}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(v.total_revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div className="section-card">
          <div className="section-card-header">
            <h3 className="section-card-title flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> Top Customers</h3>
            <Link href="/customers" className="text-xs text-blue-600 hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {topCustomers.slice(0, 5).map((c, i) => (
              <div key={c.customer_id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{c.rental_count}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(c.total_spent)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Schedule / Upcoming */}
      <div className="section-card">
        <div className="section-card-header">
          <h3 className="section-card-title">Schedule — Upcoming Pickups & Returns</h3>
          <Link href="/calendar" className="text-xs text-blue-600 hover:underline flex items-center gap-1">Full Calendar <ArrowRight className="w-3 h-3" /></Link>
        </div>
        <div className="p-5 space-y-4">
          {/* Today */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-sm font-medium text-gray-700">Today</span>
            </div>
            {today.length === 0 ? (
              <p className="text-sm text-gray-400 ml-4">Nothing scheduled today</p>
            ) : today.map((r: any) => (
              <div key={r.id} className="ml-4 flex items-center gap-3 py-1.5">
                <span className="text-sm font-medium text-blue-600">{r.rental_number}</span>
                <span className="text-sm text-gray-600">{Array.isArray(r.customers) ? r.customers[0]?.name : r.customers?.name}</span>
                <span className="text-xs text-gray-400">{Array.isArray(r.vehicles) ? r.vehicles[0]?.reg_number : r.vehicles?.reg_number}</span>
              </div>
            ))}
          </div>

          {/* Overdue */}
          {overdue.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-sm font-medium text-gray-700">Service Overdue</span>
                <span className="text-xs bg-red-100 text-red-700 rounded-full px-2">{overdue.length}</span>
              </div>
              {overdue.map((r: any) => (
                <Link key={r.id} href={`/rentals/${r.id}`} className="ml-4 flex items-center gap-3 py-1.5 hover:bg-red-50 rounded px-2 -mx-2 transition-colors">
                  <span className="text-sm font-medium text-blue-600">{r.rental_number}</span>
                  <span className="text-sm text-gray-600">{Array.isArray(r.customers) ? r.customers[0]?.name : r.customers?.name}</span>
                  <span className="text-xs text-red-600 ml-auto font-medium">
                    {Math.ceil((new Date().getTime() - new Date(r.end_date).getTime()) / 86400000)}d late
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Calendar — full width */}
      <CalendarWidget rentals={calendarData.rentals} vehicles={calendarData.vehicles} />

      {/* Quick Actions */}
      <div className="section-card">
        <div className="section-card-header">
          <h3 className="section-card-title">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5">
          {[
            { href: "/rentals/new", icon: Plus, label: "New Rental", desc: "Create a booking" },
            { href: "/vehicles", icon: Car, label: "Manage Fleet", desc: "View vehicles" },
            { href: "/customers", icon: Users, label: "Customers", desc: "View records" },
            { href: "/suppliers", icon: Package, label: "Suppliers", desc: "Manage suppliers" },
          ].map((action) => (
            <Link key={action.href} href={action.href}
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50 transition-all group">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <action.icon className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{action.label}</p>
                <p className="text-xs text-gray-500">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, color, small }: {
  icon: React.ReactNode; label: string; value: string | number; color: string; small?: boolean;
}) {
  return (
    <div className="kpi-card">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 rounded-lg bg-${color}-50 flex items-center justify-center`}>{icon}</div>
      </div>
      <p className={`font-bold text-gray-900 ${small ? "text-base" : "text-2xl"}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function StatusPill({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <div>
        <p className="text-xl font-bold text-gray-900">{count}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}
