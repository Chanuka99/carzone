import { getRentals } from "@/app/actions/rentals";
import Link from "next/link";
import { Plus } from "lucide-react";
import RentalsClient from "./RentalsClient";

export default async function RentalsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; vehicleReg?: string; customerId?: string; dateFrom?: string; dateTo?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = parseInt(sp.page ?? "1");
  const { data: rentals, count } = await getRentals({
    search: sp.search,
    status: sp.status,
    vehicleReg: sp.vehicleReg,
    customerId: sp.customerId,
    dateFrom: sp.dateFrom,
    dateTo: sp.dateTo,
    page,
    pageSize: 10,
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Rentals</h1>
          <p className="page-subtitle">Manage vehicle rentals — {count} total</p>
        </div>
        <Link href="/rentals/new" className="btn-primary">
          <Plus className="w-4 h-4" /> New Rental
        </Link>
      </div>
      <RentalsClient rentals={rentals} total={count} currentPage={page} />
    </div>
  );
}
