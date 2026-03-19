import { getVehicles } from "@/app/actions/vehicles";
import { getCustomers } from "@/app/actions/customers";
import { getGuarantors } from "@/app/actions/suppliers";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import NewRentalClient from "./NewRentalClient";

export default async function NewRentalPage() {
  const [{ data: vehicles }, { data: customers }, { data: guarantors }] = await Promise.all([
    getVehicles({ status: "available", pageSize: 200 }),
    getCustomers({ pageSize: 200 }),
    getGuarantors({ pageSize: 200 }),
  ]);

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/rentals" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div>
          <h1 className="page-title">New Rental</h1>
          <p className="page-subtitle">Create a new vehicle rental booking</p>
        </div>
      </div>
      <NewRentalClient vehicles={vehicles} customers={customers} guarantors={guarantors} />
    </div>
  );
}
