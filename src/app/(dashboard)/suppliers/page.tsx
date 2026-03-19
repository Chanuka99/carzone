import { getSuppliers } from "@/app/actions/suppliers";
import SuppliersClient from "./SuppliersClient";

export default async function SuppliersPage({ searchParams }: { searchParams: Promise<{ search?: string; page?: string }> }) {
  const sp = await searchParams;
  const page = parseInt(sp.page ?? "1");
  const { data: suppliers, count } = await getSuppliers({ search: sp.search, page, pageSize: 10 });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Suppliers</h1>
          <p className="page-subtitle">Manage vehicle suppliers — {count} total</p>
        </div>
      </div>
      <SuppliersClient suppliers={suppliers} total={count} currentPage={page} />
    </div>
  );
}
