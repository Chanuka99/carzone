import { getCustomerById } from "@/app/actions/customers";
import { getRentals } from "@/app/actions/rentals";
import { notFound } from "next/navigation";
import CustomerDetailClient from "./CustomerDetailClient";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const [customer, { data: allRentals }] = await Promise.all([
    getCustomerById(p.id),
    getRentals({ customerId: p.id, pageSize: 100 }),
  ]);
  
  if (!customer) notFound();

  return <CustomerDetailClient customer={customer} rentals={allRentals ?? []} />;
}
