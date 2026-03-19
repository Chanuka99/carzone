import { getRentalById } from "@/app/actions/rentals";
import { getVehicles } from "@/app/actions/vehicles";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import RentalDetailClient from "./RentalDetailClient";

export default async function RentalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const [rental, { data: availableVehicles }] = await Promise.all([
    getRentalById(p.id),
    getVehicles({ status: "available", pageSize: 100 }),
  ]);
  if (!rental) notFound();

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/rentals" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="page-title">{rental.rental_number}</h1>
          <p className="page-subtitle">{rental.customer?.name} — {rental.vehicle?.brand} {rental.vehicle?.model} ({rental.vehicle?.reg_number})</p>
        </div>
        <StatusBadge status={rental.status} />
      </div>

      <RentalDetailClient rental={rental} availableVehicles={availableVehicles ?? []} />
    </div>
  );
}
