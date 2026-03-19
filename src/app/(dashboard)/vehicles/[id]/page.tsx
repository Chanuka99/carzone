import { getVehicleById } from "@/app/actions/vehicles";
import { getSuppliers } from "@/app/actions/suppliers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import ServiceAlertBadge from "@/components/shared/ServiceAlertBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import VehicleDetailClient from "./VehicleDetailClient";

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const vehicle = await getVehicleById(p.id);
  if (!vehicle) notFound();

  const { data: suppliers } = await getSuppliers({ pageSize: 100 });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/vehicles" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="page-title">{vehicle.reg_number}</h1>
          <p className="page-subtitle">{vehicle.brand} {vehicle.model} {vehicle.year}</p>
        </div>
        <ServiceAlertBadge currentKm={vehicle.current_km} nextServiceKm={vehicle.next_service_km} nextServiceDate={vehicle.next_service_date} />
        <StatusBadge status={vehicle.status} />
      </div>

      <VehicleDetailClient vehicle={vehicle} suppliers={suppliers} />
    </div>
  );
}
