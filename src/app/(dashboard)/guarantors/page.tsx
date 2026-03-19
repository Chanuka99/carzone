import { getGuarantors } from "@/app/actions/suppliers";
import GuarantorsClient from "./GuarantorsClient";

export default async function GuarantorsPage({ searchParams }: { searchParams: Promise<{ search?: string; page?: string }> }) {
  const sp = await searchParams;
  const page = parseInt(sp.page ?? "1");
  const { data: guarantors, count } = await getGuarantors({ search: sp.search, page, pageSize: 10 });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Guarantors</h1>
          <p className="page-subtitle">Manage rental guarantors — {count} total</p>
        </div>
      </div>
      <GuarantorsClient guarantors={guarantors} total={count} currentPage={page} />
    </div>
  );
}
