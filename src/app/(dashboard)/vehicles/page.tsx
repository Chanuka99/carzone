import { getVehicles } from "@/app/actions/vehicles";
import { getSuppliers } from "@/app/actions/suppliers";
import Link from "next/link";
import { Plus, Search, Eye } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import ServiceAlertBadge from "@/components/shared/ServiceAlertBadge";
import VehiclesClient from "./VehiclesClient";

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; status?: string; source?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = parseInt(sp.page ?? "1");
  const { data: vehicles, count } = await getVehicles({
    search: sp.search,
    type: sp.type,
    status: sp.status,
    source: sp.source,
    page,
    pageSize: 10,
  });

  const { data: suppliers } = await getSuppliers({ pageSize: 100 });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vehicles</h1>
          <p className="page-subtitle">Manage vehicle fleet — {count} total</p>
        </div>
        <Link href="/vehicles/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Add Vehicle
        </Link>
      </div>

      <VehiclesClient vehicles={vehicles} suppliers={suppliers} total={count} currentPage={page} />
    </div>
  );
}
