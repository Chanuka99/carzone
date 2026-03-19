import { getCustomers } from "@/app/actions/customers";
import Link from "next/link";
import { Plus } from "lucide-react";
import CustomersClient from "./CustomersClient";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ search?: string; page?: string }> }) {
  const sp = await searchParams;
  const page = parseInt(sp.page ?? "1");
  const { data: customers, count } = await getCustomers({ search: sp.search, page, pageSize: 10 });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Manage customer records — {count} total</p>
        </div>
      </div>
      <CustomersClient customers={customers} total={count} currentPage={page} />
    </div>
  );
}
