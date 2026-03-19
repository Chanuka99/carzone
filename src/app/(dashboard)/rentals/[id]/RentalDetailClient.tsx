"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Rental, Vehicle } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { activateRental, returnRental, exchangeVehicle, cancelRental } from "@/app/actions/rentals";
import PasswordConfirmModal from "@/components/shared/PasswordConfirmModal";
import StatusBadge from "@/components/shared/StatusBadge";
import { CheckCircle, ArrowLeftRight, RotateCcw, XCircle } from "lucide-react";

interface RentalDetailClientProps {
  rental: Rental;
  availableVehicles: Vehicle[];
}

export default function RentalDetailClient({ rental: initial, availableVehicles }: RentalDetailClientProps) {
  const router = useRouter();
  const [rental] = useState(initial);
  const [showActivate, setShowActivate] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [showExchange, setShowExchange] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | string>(null);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Return form state
  const [returnKm, setReturnKm] = useState("");
  const [returnDate, setReturnDate] = useState(new Date().toISOString().substring(0, 10));
  const [returnCharges, setReturnCharges] = useState("0");
  const [returnNotes, setReturnNotes] = useState("");

  // Activate form state
  const [pickupKm, setPickupKm] = useState(rental.pickup_km?.toString() ?? "0");

  // Exchange form state
  const [exchangeVehicleId, setExchangeVehicleId] = useState("");
  const [exchangeDate, setExchangeDate] = useState(new Date().toISOString().substring(0, 10));
  const [exchangeReason, setExchangeReason] = useState("");
  const [exchangeCharge, setExchangeCharge] = useState("0");

  function confirmWithPassword(action: () => Promise<void>, label: string) {
    setPendingAction(() => action);
    setConfirmAction(label);
  }

  async function handleActivate() {
    confirmWithPassword(async () => {
      await activateRental(rental.id, parseInt(pickupKm));
      router.refresh();
    }, "Activate Rental");
  }

  async function handleReturn() {
    confirmWithPassword(async () => {
      await returnRental(rental.id, {
        return_km: parseInt(returnKm),
        actual_return_date: returnDate,
        additional_charges: parseFloat(returnCharges) || 0,
        return_notes: returnNotes,
      });
      router.refresh();
    }, "Return Vehicle");
  }

  async function handleCancel() {
    confirmWithPassword(async () => {
      await cancelRental(rental.id);
      router.refresh();
    }, "Cancel Rental");
  }

  async function handleExchange() {
    if (!exchangeVehicleId) { setError("Please select a vehicle to exchange to."); return; }
    setError(null);
    confirmWithPassword(async () => {
      const result = await exchangeVehicle({
        rental_id: rental.id,
        old_vehicle_id: rental.vehicle_id,
        new_vehicle_id: exchangeVehicleId,
        exchange_date: exchangeDate,
        reason: exchangeReason || undefined,
        additional_charge: parseFloat(exchangeCharge) || 0,
      }) as any;
      if (result?.error) { setError(result.error); return; }
      setShowExchange(false);
      router.refresh();
    }, "Exchange Vehicle");
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      {/* Main details */}
      <div className="xl:col-span-2 space-y-4">
        {/* Rental Info */}
        <div className="section-card">
          <div className="section-card-header">
            <h2 className="section-card-title">Rental Information</h2>
            <div className="flex gap-2 flex-wrap">
              {rental.status === "booked" && (
                <button onClick={() => setShowActivate(true)} className="btn-primary text-xs"><CheckCircle className="w-3.5 h-3.5" /> Activate</button>
              )}
              {rental.status === "active" && (
                <>
                  <button onClick={() => setShowExchange(true)} className="btn-secondary text-xs"><ArrowLeftRight className="w-3.5 h-3.5" /> Exchange</button>
                  <button onClick={() => setShowReturn(true)} className="btn-primary text-xs"><RotateCcw className="w-3.5 h-3.5" /> Return</button>
                </>
              )}
              {(rental.status === "booked" || rental.status === "active") && (
                <button onClick={handleCancel} className="btn-danger text-xs"><XCircle className="w-3.5 h-3.5" /> Cancel</button>
              )}
            </div>
          </div>
          <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Rental #", value: rental.rental_number },
              { label: "Status", value: <StatusBadge status={rental.status} /> },
              { label: "Start Date", value: formatDate(rental.start_date) },
              { label: "End Date", value: formatDate(rental.end_date) },
              { label: "Return Date", value: formatDate(rental.actual_return_date) },
              { label: "Total Days", value: `${rental.total_days} days` },
              { label: "Daily Rate", value: formatCurrency(rental.daily_rate) },
              { label: "Subtotal", value: formatCurrency(rental.subtotal ?? 0) },
              { label: "Extra Charges", value: formatCurrency(rental.additional_charges) },
              { label: "Discount", value: formatCurrency(rental.discount) },
              { label: "Total Amount", value: <span className="font-bold text-lg text-gray-900">{formatCurrency(rental.total_amount ?? 0)}</span> },
              { label: "Deposit", value: formatCurrency(rental.deposit) },
              { label: "Pickup KM", value: `${rental.pickup_km?.toLocaleString() ?? 0} km` },
              { label: "Return KM", value: rental.return_km ? `${rental.return_km.toLocaleString()} km` : "—" },
            ].map(f => (
              <div key={f.label}>
                <p className="text-xs text-gray-400 mb-0.5">{f.label}</p>
                <div className="text-sm font-medium text-gray-900">{f.value}</div>
              </div>
            ))}
          </div>
          {rental.notes && <div className="px-5 pb-5"><p className="text-xs text-gray-400 mb-1">Notes</p><p className="text-sm">{rental.notes}</p></div>}
        </div>

        {/* Exchange history — latest first */}
        {(rental.exchanges ?? []).length > 0 && (
          <div className="section-card">
            <div className="section-card-header"><h2 className="section-card-title">Vehicle Exchanges</h2></div>
            {[...(rental.exchanges ?? [])]
              .sort((a, b) => new Date(b.exchange_date).getTime() - new Date(a.exchange_date).getTime())
              .map((ex, idx) => (
              <div key={ex.id} className="px-5 py-4 border-b border-gray-50 last:border-0">
                {idx === 0 && <span className="text-[10px] uppercase tracking-widest text-blue-500 font-semibold mb-1 block">Current Vehicle</span>}
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-0.5">New Vehicle</p>
                    <p className="text-sm font-bold text-gray-900">{ex.new_vehicle?.reg_number ?? "?"}</p>
                    <p className="text-xs text-gray-500">{ex.new_vehicle?.brand} {ex.new_vehicle?.model}</p>
                  </div>
                  <ArrowLeftRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-0.5">Previous</p>
                    <p className="text-sm text-gray-500">{ex.old_vehicle?.reg_number ?? "?"}</p>
                  </div>
                  <span className="text-xs text-gray-400 ml-auto">{formatDate(ex.exchange_date)}</span>
                </div>
                {ex.reason && <p className="text-xs text-gray-400 mt-1">Reason: {ex.reason}</p>}
                {ex.additional_charge > 0 && <p className="text-xs text-amber-600">+{formatCurrency(ex.additional_charge)}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar: Customer & Vehicle */}
      <div className="space-y-4">
        <div className="section-card p-5">
          <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wide">Customer</p>
          <p className="font-semibold text-gray-900">{rental.customer?.name}</p>
          <p className="text-sm text-gray-500">{rental.customer?.phone}</p>
          <p className="text-sm text-gray-500">{rental.customer?.nic}</p>
          <p className="text-sm text-gray-500 mt-1">{rental.customer?.address}</p>
          {rental.customer?.license_number && <p className="text-xs text-gray-400 mt-1">License: {rental.customer.license_number}</p>}
        </div>

        {rental.guarantor && (
          <div className="section-card p-5">
            <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wide">Guarantor</p>
            <p className="font-semibold text-gray-900">{rental.guarantor.name}</p>
            <p className="text-sm text-gray-500">{rental.guarantor.phone}</p>
            <p className="text-sm text-gray-500">{rental.guarantor.nic}</p>
          </div>
        )}

        <div className="section-card p-5">
          <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wide">Vehicle</p>
          <p className="font-semibold text-gray-900">{rental.vehicle?.brand} {rental.vehicle?.model}</p>
          <p className="text-sm text-blue-600">{rental.vehicle?.reg_number}</p>
          <StatusBadge status={rental.vehicle?.status ?? "available"} className="mt-1" />
        </div>

        {/* Agreement link */}
        <div className="section-card p-4">
          <a href={`/agreements/${rental.id}`} target="_blank" rel="noopener"
            className="btn-secondary w-full justify-center text-sm">
            📄 View Agreement
          </a>
        </div>
      </div>

      {/* Activate modal */}
      {showActivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Activate Rental</h3>
            <label className="form-label">Pickup KM</label>
            <input type="number" className="form-input mb-4" value={pickupKm} onChange={e => setPickupKm(e.target.value)} />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowActivate(false)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={() => { setShowActivate(false); handleActivate(); }} className="btn-primary text-sm">Activate</button>
            </div>
          </div>
        </div>
      )}

      {/* Return modal */}
      {showReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-3">
            <h3 className="font-semibold text-gray-900">Return Vehicle</h3>
            <div><label className="form-label">Return KM</label><input type="number" className="form-input" value={returnKm} onChange={e => setReturnKm(e.target.value)} /></div>
            <div><label className="form-label">Return Date</label><input type="date" className="form-input" value={returnDate} onChange={e => setReturnDate(e.target.value)} /></div>
            <div><label className="form-label">Additional Charges (LKR)</label><input type="number" className="form-input" value={returnCharges} onChange={e => setReturnCharges(e.target.value)} /></div>
            <div><label className="form-label">Notes</label><textarea className="form-input resize-none" rows={2} value={returnNotes} onChange={e => setReturnNotes(e.target.value)} /></div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setShowReturn(false)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={() => { setShowReturn(false); handleReturn(); }} className="btn-primary text-sm">Confirm Return</button>
            </div>
          </div>
        </div>
      )}

      {/* Exchange modal */}
      {showExchange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-semibold text-gray-900">Exchange Vehicle</h3>
            <p className="text-xs text-gray-500">
              Current vehicle: <strong>{rental.vehicle?.reg_number}</strong> — {rental.vehicle?.brand} {rental.vehicle?.model}
            </p>

            <div>
              <label className="form-label">New Vehicle <span className="text-red-500">*</span></label>
              <select
                className="form-select"
                value={exchangeVehicleId}
                onChange={e => setExchangeVehicleId(e.target.value)}
              >
                <option value="">— Select available vehicle —</option>
                {availableVehicles
                  .filter(v => v.id !== rental.vehicle_id)
                  .map(v => (
                    <option key={v.id} value={v.id}>
                      {v.reg_number} — {v.brand} {v.model} ({v.type})
                    </option>
                  ))
                }
              </select>
            </div>

            <div>
              <label className="form-label">Exchange Date</label>
              <input type="date" className="form-input" value={exchangeDate} onChange={e => setExchangeDate(e.target.value)} />
            </div>

            <div>
              <label className="form-label">Reason (optional)</label>
              <input type="text" className="form-input" value={exchangeReason} onChange={e => setExchangeReason(e.target.value)} placeholder="e.g. Mechanical issue" />
            </div>

            <div>
              <label className="form-label">Additional Charge (LKR)</label>
              <input type="number" className="form-input" value={exchangeCharge} onChange={e => setExchangeCharge(e.target.value)} />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3 justify-end pt-1">
              <button onClick={() => { setShowExchange(false); setError(null); }} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleExchange} disabled={isPending} className="btn-primary text-sm">
                <ArrowLeftRight className="w-3.5 h-3.5" /> Confirm Exchange
              </button>
            </div>
          </div>
        </div>
      )}

      <PasswordConfirmModal
        open={!!confirmAction}
        onOpenChange={() => { setConfirmAction(null); setPendingAction(null); }}
        title={confirmAction ?? "Confirm"}
        description="Enter your password to confirm this action."
        onConfirm={async () => { if (pendingAction) await pendingAction(); }}
      />
    </div>
  );
}
