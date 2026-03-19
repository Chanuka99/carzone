"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Vehicle, Supplier } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { updateVehicle, deleteVehicle, uploadVehiclePhoto, deleteVehiclePhoto } from "@/app/actions/vehicles";
import PasswordConfirmModal from "@/components/shared/PasswordConfirmModal";
import StatusBadge from "@/components/shared/StatusBadge";
import { Edit, Trash2, Upload, X, Plus, Minus, Camera, CheckCircle } from "lucide-react";
import Image from "next/image";

interface VehicleDetailClientProps {
  vehicle: Vehicle;
  suppliers: Supplier[];
}

export default function VehicleDetailClient({ vehicle: initial, suppliers }: VehicleDetailClientProps) {
  const router = useRouter();
  const [vehicle, setVehicle] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmEdit, setConfirmEdit] = useState(false);
  const [editFormData, setEditFormData] = useState<FormData | null>(null);
  const [rateTiers, setRateTiers] = useState(vehicle.rate_tiers ?? []);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("rate_tiers", JSON.stringify(rateTiers.map(t => ({ days_from: t.days_from, days_to: t.days_to, rate_per_day: t.rate_per_day }))));
    setEditFormData(fd);
    setConfirmEdit(true);
  }

  async function performEdit() {
    if (!editFormData) return;
    startTransition(async () => {
      const result = await updateVehicle(vehicle.id, editFormData);
      if (result.error) { setError(result.error); return; }
      setEditing(false);
      router.refresh();
    });
  }

  async function performDelete() {
    startTransition(async () => {
      await deleteVehicle(vehicle.id);
      router.push("/vehicles");
    });
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    startTransition(async () => {
      await uploadVehiclePhoto(vehicle.id, file, (vehicle.photos ?? []).length === 0);
      router.refresh();
    });
  }

  async function handleDeletePhoto(photoId: string, storagePath: string) {
    startTransition(async () => {
      await deleteVehiclePhoto(photoId, storagePath, vehicle.id);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <div className="section-card">
        <div className="section-card-header">
          <h2 className="section-card-title">Edit Vehicle</h2>
          <button onClick={() => setEditing(false)} className="btn-secondary text-sm">Cancel</button>
        </div>
        <form onSubmit={handleEditSubmit} className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {[
              { name: "brand", label: "Brand", defaultValue: vehicle.brand, required: true },
              { name: "model", label: "Model", defaultValue: vehicle.model, required: true },
              { name: "year", label: "Year", defaultValue: vehicle.year?.toString() ?? "", type: "number" },
              { name: "color", label: "Color", defaultValue: vehicle.color ?? "" },
              { name: "daily_rate", label: "Daily Rate (LKR)", defaultValue: vehicle.daily_rate.toString(), type: "number", required: true },
              { name: "fuel_type", label: "Fuel Type", defaultValue: vehicle.fuel_type ?? "" },
              { name: "transmission", label: "Transmission", defaultValue: vehicle.transmission ?? "" },
              { name: "current_km", label: "Current KM", defaultValue: vehicle.current_km.toString(), type: "number" },
              { name: "next_service_km", label: "Next Service KM", defaultValue: vehicle.next_service_km.toString(), type: "number" },
              { name: "next_service_date", label: "Next Service Date", defaultValue: vehicle.next_service_date ?? "", type: "date" },
              { name: "insurance_expiry", label: "Insurance Expiry", defaultValue: vehicle.insurance_expiry ?? "", type: "date" },
              { name: "revenue_license_expiry", label: "Revenue License Expiry", defaultValue: vehicle.revenue_license_expiry ?? "", type: "date" },
              { name: "eco_test_expiry", label: "Eco Test Expiry", defaultValue: vehicle.eco_test_expiry ?? "", type: "date" },
              { name: "handover_date", label: "Handover Date", defaultValue: vehicle.handover_date ?? "", type: "date" },
              { name: "agreement_end_date", label: "Agreement End Date", defaultValue: vehicle.agreement_end_date ?? "", type: "date" },
              { name: "payment_type", label: "Payment Type", defaultValue: vehicle.payment_type ?? "" },
            ].map(f => (
              <div key={f.name}>
                <label className="form-label">{f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}</label>
                <input name={f.name} type={f.type ?? "text"} defaultValue={f.defaultValue} required={f.required} className="form-input" />
              </div>
            ))}

            <div>
              <label className="form-label">Type</label>
              <select name="type" defaultValue={vehicle.type} className="form-select">
                {["Sedan","Hatchback","SUV","Van","Pickup","Bus","Other"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="form-label">Source</label>
              <select name="source" defaultValue={vehicle.source} className="form-select">
                <option>Company</option>
                <option>Supplier</option>
              </select>
            </div>

            <div>
              <label className="form-label">Supplier</label>
              <select name="supplier_id" defaultValue={vehicle.supplier_id ?? ""} className="form-select">
                <option value="">— No Supplier —</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label">Notes</label>
            <textarea name="notes" defaultValue={vehicle.notes ?? ""} rows={2} className="form-input resize-none" />
          </div>

          {/* Rate Tiers */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="form-label mb-0">Rate Tiers</label>
              <button type="button" onClick={() => setRateTiers(prev => [...prev, { id: "", vehicle_id: vehicle.id, days_from: 1, days_to: undefined, rate_per_day: 0 }])}
                className="text-xs text-blue-600 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Tier</button>
            </div>
            {rateTiers.length === 0 && <p className="text-sm text-gray-400">No tiers. Vehicle uses flat daily rate.</p>}
            {rateTiers.map((tier, i) => (
              <div key={i} className="flex gap-2 mb-2 items-end">
                <div className="flex-1"><label className="text-xs text-gray-500">Days From</label>
                  <input type="number" value={tier.days_from} onChange={e => setRateTiers(prev => prev.map((t, j) => j === i ? {...t, days_from: +e.target.value} : t))} className="form-input text-sm" /></div>
                <div className="flex-1"><label className="text-xs text-gray-500">Days To</label>
                  <input type="number" value={tier.days_to ?? ""} placeholder="Open" onChange={e => setRateTiers(prev => prev.map((t, j) => j === i ? {...t, days_to: e.target.value ? +e.target.value : undefined} : t))} className="form-input text-sm" /></div>
                <div className="flex-1"><label className="text-xs text-gray-500">Rate/Day (LKR)</label>
                  <input type="number" value={tier.rate_per_day} onChange={e => setRateTiers(prev => prev.map((t, j) => j === i ? {...t, rate_per_day: +e.target.value} : t))} className="form-input text-sm" /></div>
                <button type="button" onClick={() => setRateTiers(prev => prev.filter((_, j) => j !== i))} className="pb-0.5 text-red-400 hover:text-red-600"><Minus className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{isPending ? "Saving..." : "Save Changes"}</button>
          </div>
        </form>

        <PasswordConfirmModal open={confirmEdit} onOpenChange={setConfirmEdit} title="Confirm Edit" description="Enter your password to save changes." onConfirm={performEdit} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      {/* Details */}
      <div className="xl:col-span-2 space-y-4">
        <div className="section-card">
          <div className="section-card-header">
            <h2 className="section-card-title">Vehicle Details</h2>
            <div className="flex gap-2">
              <button onClick={() => setEditing(true)} className="btn-secondary text-sm"><Edit className="w-3.5 h-3.5" /> Edit</button>
              <button onClick={() => setConfirmDelete(true)} className="btn-danger text-sm"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
            </div>
          </div>
          <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Brand", value: vehicle.brand },
              { label: "Model", value: vehicle.model },
              { label: "Year", value: vehicle.year?.toString() ?? "—" },
              { label: "Color", value: vehicle.color ?? "—" },
              { label: "Type", value: <StatusBadge status={vehicle.type.toLowerCase()} /> },
              { label: "Source", value: <StatusBadge status={vehicle.source.toLowerCase()} /> },
              { label: "Supplier", value: vehicle.supplier?.name ?? "—" },
              { label: "Fuel Type", value: vehicle.fuel_type ?? "—" },
              { label: "Transmission", value: vehicle.transmission ?? "—" },
              { label: "Daily Rate", value: formatCurrency(vehicle.daily_rate) },
              { label: "Current KM", value: vehicle.current_km.toLocaleString() + " km" },
              { label: "Next Service KM", value: vehicle.next_service_km.toLocaleString() + " km" },
              { label: "Next Service Date", value: formatDate(vehicle.next_service_date) },
              { label: "Insurance Expiry", value: formatDate(vehicle.insurance_expiry) },
              { label: "Revenue License Expiry", value: formatDate(vehicle.revenue_license_expiry) },
              { label: "Eco Test Expiry", value: vehicle.eco_test_expiry ? formatDate(vehicle.eco_test_expiry) : "—" },
              { label: "Handover Date", value: vehicle.handover_date ? formatDate(vehicle.handover_date) : "—" },
              { label: "Agreement End Date", value: vehicle.agreement_end_date ? formatDate(vehicle.agreement_end_date) : "—" },
              { label: "Payment Type", value: vehicle.payment_type ?? "—" },
            ].map(f => (
              <div key={f.label}>
                <p className="text-xs text-gray-400 mb-0.5">{f.label}</p>
                <div className="text-sm font-medium text-gray-900">{f.value}</div>
              </div>
            ))}
          </div>

          {vehicle.notes && (
            <div className="px-5 pb-5">
              <p className="text-xs text-gray-400 mb-1">Notes</p>
              <p className="text-sm text-gray-600">{vehicle.notes}</p>
            </div>
          )}
        </div>

        {/* Rate Tiers */}
        {(vehicle.rate_tiers ?? []).length > 0 && (
          <div className="section-card">
            <div className="section-card-header"><h2 className="section-card-title">Rate Tiers</h2></div>
            <table className="data-table">
              <thead><tr><th>Days From</th><th>Days To</th><th>Rate / Day</th></tr></thead>
              <tbody>
                {vehicle.rate_tiers?.map((t, i) => (
                  <tr key={i}>
                    <td>{t.days_from}</td>
                    <td>{t.days_to ?? "Open"}</td>
                    <td className="font-medium">{formatCurrency(t.rate_per_day)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Photos */}
      <div className="space-y-4">
        <div className="section-card">
          <div className="section-card-header">
            <h2 className="section-card-title">Photos</h2>
            <label className="btn-secondary text-xs cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> Upload
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>
          <div className="p-4 grid grid-cols-2 gap-2">
            {(vehicle.photos ?? []).length === 0 && (
              <div className="col-span-2 py-10 flex flex-col items-center text-gray-300">
                <Camera className="w-10 h-10 mb-2" />
                <p className="text-sm">No photos yet</p>
              </div>
            )}
            {vehicle.photos?.map(photo => (
              <div key={photo.id} className="relative group rounded-lg overflow-hidden aspect-square bg-gray-100">
                <Image src={photo.url} alt="Vehicle" fill className="object-cover" />
                {photo.is_primary && (
                  <div className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded">Primary</div>
                )}
                <button onClick={() => handleDeletePhoto(photo.id, photo.storage_path)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <PasswordConfirmModal open={confirmDelete} onOpenChange={setConfirmDelete} title="Delete Vehicle" description="This will permanently deactivate this vehicle." onConfirm={performDelete} />
    </div>
  );
}
