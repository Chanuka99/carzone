"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Rental, Vehicle } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { activateRental, returnRental, exchangeVehicle, cancelRental } from "@/app/actions/rentals";
import PasswordConfirmModal from "@/components/shared/PasswordConfirmModal";
import StatusBadge from "@/components/shared/StatusBadge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CheckCircle, ArrowLeftRight, RotateCcw, XCircle,
  User, Car, FileText, ClipboardList, Activity, Shield,
  Upload, X, Camera
} from "lucide-react";

interface Props {
  rental: Rental;
  availableVehicles: Vehicle[];
}

type InspectionCheck = {
  body_damage: boolean;
  interior: boolean;
  tyres: boolean;
  engine: boolean;
};

export default function RentalDetailClient({ rental: initial, availableVehicles }: Props) {
  const router = useRouter();
  const [rental] = useState(initial);
  const [showActivate, setShowActivate] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [showExchange, setShowExchange] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Return form
  const [returnKm, setReturnKm] = useState("");
  const [returnDate, setReturnDate] = useState(new Date().toISOString().substring(0, 10));
  const [returnCharges, setReturnCharges] = useState("0");
  const [returnNotes, setReturnNotes] = useState("");

  // Activate form
  const [pickupKm, setPickupKm] = useState(rental.pickup_km?.toString() ?? "0");

  // Exchange form
  const [exchangeVehicleId, setExchangeVehicleId] = useState("");
  const [exchangeDate, setExchangeDate] = useState(new Date().toISOString().substring(0, 10));
  const [exchangeReason, setExchangeReason] = useState("");
  const [exchangeCharge, setExchangeCharge] = useState("0");

  // Inspection state
  const [inspection, setInspection] = useState<InspectionCheck>({
    body_damage: false, interior: false, tyres: false, engine: false,
  });
  const [inspectionFeedback, setInspectionFeedback] = useState("");
  const [inspectionImages, setInspectionImages] = useState<{ name: string; url: string }[]>([]);
  const [inspectionSaved, setInspectionSaved] = useState(false);
  const [inspectionInputKey, setInspectionInputKey] = useState(0);

  function confirmWithPassword(action: () => Promise<void>, label: string) {
    setPendingAction(() => action);
    setConfirmAction(label);
  }

  function handleActivate() {
    confirmWithPassword(async () => {
      await activateRental(rental.id, parseInt(pickupKm));
      router.refresh();
    }, "Activate Rental");
  }

  function handleReturn() {
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

  function handleCancel() {
    confirmWithPassword(async () => {
      await cancelRental(rental.id);
      router.refresh();
    }, "Cancel Rental");
  }

  async function handleExchange() {
    if (!exchangeVehicleId) { setError("Please select a replacement vehicle."); return; }
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

  function handleInspectionImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (inspectionImages.length >= 2) return;
    const url = URL.createObjectURL(file);
    setInspectionImages(prev => [...prev, { name: file.name, url }]);
    // Reset the input so same file can be re-selected after deleting
    setInspectionInputKey(k => k + 1);
  }

  function removeInspectionImage(i: number) {
    setInspectionImages(prev => prev.filter((_, j) => j !== i));
    setInspectionInputKey(k => k + 1);
  }

  function saveInspection() {
    // For now, store in local state (cloud storage integration pending)
    setInspectionSaved(true);
    setTimeout(() => setInspectionSaved(false), 3000);
  }

  // Action buttons for header
  const actionButtons = (
    <div className="flex gap-2 flex-wrap">
      {rental.status === "booked" && (
        <button onClick={() => setShowActivate(true)} className="btn-primary text-xs">
          <CheckCircle className="w-3.5 h-3.5" /> Activate
        </button>
      )}
      {rental.status === "active" && (
        <>
          <button onClick={() => setShowExchange(true)} className="btn-secondary text-xs">
            <ArrowLeftRight className="w-3.5 h-3.5" /> Exchange
          </button>
          <button onClick={() => setShowReturn(true)} className="btn-primary text-xs">
            <RotateCcw className="w-3.5 h-3.5" /> Return
          </button>
        </>
      )}
      {(rental.status === "booked" || rental.status === "active") && (
        <button onClick={handleCancel} className="btn-danger text-xs">
          <XCircle className="w-3.5 h-3.5" /> Cancel
        </button>
      )}
    </div>
  );

  return (
    <div>
      <Tabs defaultValue="details">
        <div className="section-card overflow-hidden">
          <div className="px-5 pt-4 flex items-center justify-between gap-4 flex-wrap border-b border-gray-100 pb-0">
            <TabsList className="border-b-0">
              <TabsTrigger value="details"><FileText className="w-3.5 h-3.5 mr-1.5 inline" />Details</TabsTrigger>
              <TabsTrigger value="inspection"><ClipboardList className="w-3.5 h-3.5 mr-1.5 inline" />Inspection</TabsTrigger>
              <TabsTrigger value="guarantor"><Shield className="w-3.5 h-3.5 mr-1.5 inline" />Guarantor</TabsTrigger>
              <TabsTrigger value="documents"><FileText className="w-3.5 h-3.5 mr-1.5 inline" />Documents</TabsTrigger>
              <TabsTrigger value="activity"><Activity className="w-3.5 h-3.5 mr-1.5 inline" />Activity Log</TabsTrigger>
            </TabsList>
            <div className="mb-2">{actionButtons}</div>
          </div>

          {/* ── DETAILS TAB ── */}
          <TabsContent value="details" className="mt-0">
            <div className="p-5 space-y-6">
              {/* Rental Info */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Rental Information</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Rental #", value: rental.rental_number },
                    { label: "Status", value: <StatusBadge status={rental.status} /> },
                    { label: "Payment", value: <StatusBadge status={rental.payment_status} /> },
                    { label: "Rate Type", value: (rental as any).rate_type ?? "Daily" },
                    { label: "Pickup Date", value: formatDate(rental.start_date) },
                    { label: "Expected Return", value: formatDate(rental.end_date) },
                    { label: "Actual Return", value: formatDate(rental.actual_return_date) },
                    { label: "Total Days", value: `${rental.total_days} days` },
                    { label: "Pickup KM", value: `${rental.pickup_km?.toLocaleString() ?? 0} km` },
                    { label: "Return KM", value: rental.return_km ? `${rental.return_km.toLocaleString()} km` : "—" },
                  ].map(f => (
                    <div key={f.label}>
                      <p className="text-xs text-gray-400 mb-0.5">{f.label}</p>
                      <div className="text-sm font-medium text-gray-900">{f.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              {rental.notes && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Conditions & Notes</p>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{rental.notes}</p>
                </div>
              )}

              {/* Pricing */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Pricing & Payment</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: "Daily Rate", value: formatCurrency(rental.daily_rate) },
                    { label: "Subtotal", value: formatCurrency(rental.subtotal ?? 0) },
                    { label: "Extra Charges", value: formatCurrency(rental.additional_charges) },
                    { label: "Discount", value: formatCurrency(rental.discount) },
                    { label: "Deposit", value: formatCurrency(rental.deposit) },
                    { label: "Total Amount", value: <span className="font-bold text-blue-600 text-base">{formatCurrency(rental.total_amount ?? 0)}</span> },
                  ].map(f => (
                    <div key={f.label}>
                      <p className="text-xs text-gray-400 mb-0.5">{f.label}</p>
                      <div className="text-sm font-medium text-gray-900">{f.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Vehicle summary */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Car className="w-4 h-4 text-blue-500" />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vehicle</p>
                  </div>
                  <p className="font-semibold text-gray-900">{rental.vehicle?.brand} {rental.vehicle?.model}</p>
                  <p className="text-sm text-blue-600 font-medium">{rental.vehicle?.reg_number}</p>
                  <p className="text-xs text-gray-500 mt-1">{rental.vehicle?.type} · {rental.vehicle?.color}</p>
                  <StatusBadge status={rental.vehicle?.status ?? "available"} className="mt-2" />
                </div>

                {/* Customer summary */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-blue-500" />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</p>
                  </div>
                  <p className="font-semibold text-gray-900">{rental.customer?.name}</p>
                  <p className="text-sm text-gray-600">{rental.customer?.phone}</p>
                  <p className="text-xs text-gray-400 mt-1">NIC: {rental.customer?.nic ?? "—"}</p>
                  <p className="text-xs text-gray-400">License: {rental.customer?.license_number ?? "—"}</p>
                </div>
              </div>

              {/* Exchange History */}
              {(rental.exchanges ?? []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Vehicle Exchanges</p>
                  <div className="space-y-2">
                    {[...(rental.exchanges ?? [])]
                      .sort((a, b) => new Date(b.exchange_date).getTime() - new Date(a.exchange_date).getTime())
                      .map((ex, idx) => (
                        <div key={ex.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
                          {idx === 0 && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-semibold">Current</span>}
                          <span className="text-sm text-gray-500">{ex.old_vehicle?.reg_number}</span>
                          <ArrowLeftRight className="w-3.5 h-3.5 text-gray-300" />
                          <span className="text-sm font-medium text-gray-900">{ex.new_vehicle?.reg_number}</span>
                          <span className="text-xs text-gray-400 ml-auto">{formatDate(ex.exchange_date)}</span>
                          {ex.reason && <span className="text-xs text-gray-400">· {ex.reason}</span>}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Agreement Summary */}
              <div className="border border-dashed border-blue-200 rounded-xl p-4 bg-blue-50/40">
                <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-2">Agreement</p>
                <p className="text-sm text-gray-700">
                  Rental <strong>{rental.rental_number}</strong> for <strong>{rental.customer?.name}</strong> —
                  vehicle <strong>{rental.vehicle?.reg_number}</strong> from{" "}
                  <strong>{formatDate(rental.start_date)}</strong> to <strong>{formatDate(rental.end_date)}</strong>.
                  Total payable: <strong>{formatCurrency(rental.total_amount ?? 0)}</strong>.
                  Deposit held: <strong>{formatCurrency(rental.deposit)}</strong>.
                </p>
                <a href={`/agreements/${rental.id}`} target="_blank" rel="noopener"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs text-blue-600 hover:underline font-medium">
                  <FileText className="w-3.5 h-3.5" /> View Full Agreement
                </a>
              </div>
            </div>
          </TabsContent>

          {/* ── INSPECTION TAB ── */}
          <TabsContent value="inspection" className="mt-0">
            <div className="p-5 space-y-6">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Vehicle Condition Checks</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {([
                    { key: "body_damage", label: "Body Damage Check", desc: "Scratches, dents, paint issues" },
                    { key: "interior", label: "Interior Check", desc: "Seats, dashboard, cleanliness" },
                    { key: "tyres", label: "Tyres Check", desc: "Tread depth, pressure, spare" },
                    { key: "engine", label: "Engine Compartment", desc: "Oil, coolant, belts, leaks" },
                  ] as { key: keyof InspectionCheck; label: string; desc: string }[]).map(item => (
                    <label key={item.key}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        inspection[item.key]
                          ? "border-green-400 bg-green-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}>
                      <div className="mt-0.5">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          inspection[item.key] ? "bg-green-500 border-green-500" : "border-gray-300"
                        }`}>
                          {inspection[item.key] && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={inspection[item.key]}
                        onChange={e => setInspection(prev => ({ ...prev, [item.key]: e.target.checked }))}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label">Inspection Feedback / Remarks</label>
                <textarea
                  className="form-input resize-none"
                  rows={4}
                  placeholder="Describe any damage, issues, or notes from the inspection..."
                  value={inspectionFeedback}
                  onChange={e => setInspectionFeedback(e.target.value)}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="form-label mb-0">Inspection Media</p>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{inspectionImages.length}/2 files</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {inspectionImages.map((img, i) => (
                    <div key={i} className="relative rounded-lg overflow-hidden bg-gray-100 group border border-gray-200">
                      {img.name.toLowerCase().endsWith(".pdf") ? (
                        <div className="flex flex-col items-center justify-center py-6 px-3">
                          <span className="text-3xl mb-1">📄</span>
                          <p className="text-xs text-gray-600 text-center truncate w-full">{img.name}</p>
                        </div>
                      ) : (
                        <img src={img.url} alt={`Inspection ${i + 1}`} className="w-full aspect-video object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => removeInspectionImage(i)}
                        className="absolute top-1.5 right-1.5 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {inspectionImages.length < 2 && (
                    <label className="rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors py-8">
                      <Camera className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-500 font-medium">Add Photo / PDF</span>
                      <span className="text-[10px] text-gray-400">Max 2 files</span>
                      <input key={inspectionInputKey} type="file" accept="image/*,.pdf" className="hidden" onChange={handleInspectionImageUpload} />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                {inspectionSaved && (
                  <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Saved!
                  </span>
                )}
                <button type="button" onClick={saveInspection} className="btn-primary text-sm">
                  <CheckCircle className="w-4 h-4" /> Save Inspection Report
                </button>
              </div>
            </div>
          </TabsContent>

          {/* ── GUARANTOR TAB ── */}
          <TabsContent value="guarantor" className="mt-0">
            <div className="p-5">
              {rental.guarantor ? (
                <div className="max-w-lg space-y-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Guarantor Details</p>
                  <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{rental.guarantor.name}</p>
                          <p className="text-xs text-gray-500">{rental.guarantor.relationship ?? "Guarantor"}</p>
                        </div>
                      </div>
                      <a href="/guarantors" className="text-xs text-blue-600 hover:underline font-medium">View All Guarantors →</a>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "NIC", value: rental.guarantor.nic ?? "—" },
                        { label: "Phone", value: rental.guarantor.phone ?? "—" },
                        { label: "Alt. Phone", value: rental.guarantor.phone2 ?? "—" },
                        { label: "Address", value: rental.guarantor.address ?? "—" },
                        { label: "Relationship", value: rental.guarantor.relationship ?? "—" },
                        { label: "Since", value: formatDate(rental.guarantor.created_at) },
                      ].map(f => (
                        <div key={f.label}>
                          <p className="text-xs text-gray-400 mb-0.5">{f.label}</p>
                          <p className="text-sm font-medium text-gray-900">{f.value}</p>
                        </div>
                      ))}
                    </div>
                    {rental.guarantor.notes && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Notes</p>
                        <p className="text-sm text-gray-600">{rental.guarantor.notes}</p>
                      </div>
                    )}
                  </div>
                  {/* Customer link */}
                  {rental.customer && (
                    <div className="bg-blue-50/40 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400">Guaranteed for Customer</p>
                        <p className="font-semibold text-gray-900">{rental.customer.name}</p>
                        <p className="text-xs text-gray-500">{rental.customer.phone}</p>
                      </div>
                      <a href={`/customers/${rental.customer_id}`} className="btn-secondary text-xs">View Customer →</a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center py-16 text-gray-300">
                  <Shield className="w-10 h-10 mb-3" />
                  <p className="text-sm text-gray-400">No guarantor assigned to this rental.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── DOCUMENTS TAB ── */}
          <TabsContent value="documents" className="mt-0">
            <div className="p-5 space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Documents</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Rental Agreement */}
                <div className="border border-gray-200 rounded-xl p-4 flex items-start gap-4 hover:border-blue-300 transition-colors">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">Rental Agreement</p>
                    <p className="text-xs text-gray-400 mt-0.5">{rental.rental_number}</p>
                    <a href={`/agreements/${rental.id}`} target="_blank" rel="noopener"
                      className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:underline font-medium">
                      View / Print →
                    </a>
                  </div>
                </div>

                {/* Inspection Report */}
                <div className="border border-gray-200 rounded-xl p-4 flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">Inspection Report</p>
                    <p className="text-xs text-gray-400 mt-0.5">Vehicle condition at handover</p>
                    <p className="text-xs text-gray-400 mt-2">Complete inspection tab first</p>
                  </div>
                </div>

                {/* Upload area */}
                <label className="border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
                  <Upload className="w-6 h-6 text-gray-300" />
                  <p className="text-sm text-gray-500 font-medium">Upload Document</p>
                  <p className="text-xs text-gray-400">PDF, JPG, PNG up to 10MB</p>
                  <input type="file" className="hidden" accept=".pdf,image/*" />
                </label>
              </div>
            </div>
          </TabsContent>

          {/* ── ACTIVITY LOG TAB ── */}
          <TabsContent value="activity" className="mt-0">
            <div className="p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Activity History</p>
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-200" />
                <div className="space-y-4 pl-8">
                  {/* Derived activity from rental data */}
                  {[
                    {
                      date: rental.created_at,
                      title: "Rental Created",
                      desc: `Rental ${rental.rental_number} created with status: ${rental.status}`,
                      color: "bg-blue-500",
                    },
                    rental.status === "active" ? {
                      date: rental.start_date,
                      title: "Vehicle Activated",
                      desc: `Vehicle ${rental.vehicle?.reg_number} picked up at ${rental.pickup_km?.toLocaleString() ?? 0} km`,
                      color: "bg-green-500",
                    } : null,
                    ...(rental.exchanges ?? []).map(ex => ({
                      date: ex.exchange_date,
                      title: "Vehicle Exchanged",
                      desc: `${ex.old_vehicle?.reg_number} → ${ex.new_vehicle?.reg_number}${ex.reason ? ` (${ex.reason})` : ""}`,
                      color: "bg-amber-500",
                    })),
                    rental.status === "returned" ? {
                      date: rental.actual_return_date ?? rental.end_date,
                      title: "Vehicle Returned",
                      desc: `Returned at ${rental.return_km?.toLocaleString() ?? "—"} km. ${rental.return_notes ?? ""}`,
                      color: "bg-purple-500",
                    } : null,
                    rental.status === "cancelled" ? {
                      date: rental.updated_at,
                      title: "Rental Cancelled",
                      desc: "Rental was cancelled.",
                      color: "bg-red-500",
                    } : null,
                  ]
                    .filter(Boolean)
                    .sort((a, b) => new Date(b!.date ?? 0).getTime() - new Date(a!.date ?? 0).getTime())
                    .map((item, i) => (
                      <div key={i} className="relative">
                        <div className={`absolute -left-5 w-2.5 h-2.5 rounded-full ${item!.color} ring-2 ring-white`} />
                        <div className="bg-gray-50 rounded-lg px-4 py-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900">{item!.title}</p>
                            <p className="text-xs text-gray-400 flex-shrink-0">{formatDate(item!.date)}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{item!.desc}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* ── MODALS ── */}
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

      {showExchange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-semibold text-gray-900">Exchange Vehicle</h3>
            <p className="text-xs text-gray-500">Current: <strong>{rental.vehicle?.reg_number}</strong> — {rental.vehicle?.brand} {rental.vehicle?.model}</p>
            <div>
              <label className="form-label">New Vehicle <span className="text-red-500">*</span></label>
              <select className="form-select" value={exchangeVehicleId} onChange={e => setExchangeVehicleId(e.target.value)}>
                <option value="">— Select available vehicle —</option>
                {availableVehicles.filter(v => v.id !== rental.vehicle_id).map(v => (
                  <option key={v.id} value={v.id}>{v.reg_number} — {v.brand} {v.model} ({v.type})</option>
                ))}
              </select>
            </div>
            <div><label className="form-label">Exchange Date</label><input type="date" className="form-input" value={exchangeDate} onChange={e => setExchangeDate(e.target.value)} /></div>
            <div><label className="form-label">Reason (optional)</label><input type="text" className="form-input" value={exchangeReason} onChange={e => setExchangeReason(e.target.value)} placeholder="e.g. Mechanical issue" /></div>
            <div><label className="form-label">Additional Charge (LKR)</label><input type="number" className="form-input" value={exchangeCharge} onChange={e => setExchangeCharge(e.target.value)} /></div>
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
