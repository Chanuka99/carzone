import { getRefundableDeposits, getTotalDeposit } from "@/app/actions/deposits";
import DepositsClient from "./DepositsClient";
import { formatCurrency } from "@/lib/utils";
import { Banknote } from "lucide-react";

export default async function RefundableDepositsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = parseInt(sp.page ?? "1");

  const [{ data: deposits, count }, totalDeposit] = await Promise.all([
    getRefundableDeposits({ page, pageSize: 10 }),
    getTotalDeposit(),
  ]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Refundable Deposits</h1>
          <p className="page-subtitle">Security deposits held against active and booked rentals</p>
        </div>
      </div>

      {/* Summary KPI */}
      <div className="section-card p-5 flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <Banknote className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Total Deposits Held (Active &amp; Booked)</p>
          <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalDeposit)}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-gray-400 mb-0.5">Total Records</p>
          <p className="text-xl font-bold text-gray-900">{count}</p>
        </div>
      </div>

      <DepositsClient deposits={deposits} total={count} currentPage={page} />
    </div>
  );
}
