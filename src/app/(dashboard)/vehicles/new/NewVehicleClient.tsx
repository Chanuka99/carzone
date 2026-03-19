"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Check } from "lucide-react";
import { createVehicle } from "@/app/actions/vehicles";
import { Supplier } from "@/types";
import {
  BRANDS, COLORS, FUEL_TYPES, VEHICLE_TYPES, TRANSMISSION_TYPES, PAYMENT_TYPES, YEARS,
  getModels, calcTiersFromMonthly,
} from "@/lib/vehicleData";

type Tier = { label: string; days_from: number; days_to: number | null; rate_per_day: number };

export default function NewVehicleClient({ suppliers }: { suppliers: Supplier[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Brand / model
  const [brand, setBrand] = useState("Toyota");
  const [model, setModel] = useState("Corolla");
  const [models, setModels] = useState<string[]>(getModels("Toyota"));
  const [fuelType, setFuelType] = useState("Petrol");

  // Rate tiers
  const [monthlyRate, setMonthlyRate] = useState(30000);
  const [tiers, setTiers] = useState<Tier[]>(calcTiersFromMonthly(30000));
  const [editingTier, setEditingTier] = useState<number | null>(null);

  function handleBrandChange(b: string) {
    setBrand(b);
    const m = getModels(b);
    setModels(m);
    setModel(m[0]);
  }

  function handleMonthlyChange(val: number) {
    setMonthlyRate(val);
    setTiers(calcTiersFromMonthly(val));
  }

  function handleTierEdit(i: number, rate: number) {
    setTiers(prev => prev.map((t, j) => j === i ? { ...t, rate_per_day: rate } : t));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    // Override brand/model from state (controlled)
    fd.set("brand", brand);
    fd.set("model", model);
    fd.set("rate_tiers", JSON.stringify(tiers));
    startTransition(async () => {
      const result = await createVehicle(fd);
      if (result.error) { setError(result.error); return; }
      router.push(`/vehicles/${result.data.id}`);
    });
  }

  const needsEcoTest = fuelType === "Petrol" || fuelType === "Diesel";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Section: Basic Details */}
      <div className="section-card">
        <div className="section-card-header">
          <h2 className="section-card-title">Vehicle Details</h2>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* Reg Number */}
          <div>
            <label className="form-label">Registration Number <span className="text-red-500">*</span></label>
            <input name="reg_number" required placeholder="e.g. ABC-1234" className="form-input uppercase" />
          </div>

          {/* Brand */}
          <div>
            <label className="form-label">Brand <span className="text-red-500">*</span></label>
            <select name="brand" className="form-select" value={brand} onChange={e => handleBrandChange(e.target.value)}>
              {BRANDS.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
            </select>
          </div>

          {/* Model (dependent) */}
          <div>
            <label className="form-label">Model <span className="text-red-500">*</span></label>
            <select name="model" className="form-select" value={model} onChange={e => setModel(e.target.value)}>
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="form-label">Year</label>
            <select name="year" className="form-select">
              <option value="">— Select Year —</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="form-label">Color</label>
            <select name="color" className="form-select">
              <option value="">— Select Color —</option>
              {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="form-label">Vehicle Type</label>
            <select name="type" className="form-select">
              {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Fuel Type */}
          <div>
            <label className="form-label">Fuel Type</label>
            <select name="fuel_type" className="form-select" value={fuelType} onChange={e => setFuelType(e.target.value)}>
              {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* Transmission */}
          <div>
            <label className="form-label">Transmission</label>
            <select name="transmission" className="form-select">
              <option value="">— Select —</option>
              {TRANSMISSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Source */}
          <div>
            <label className="form-label">Source</label>
            <select name="source" className="form-select">
              <option value="Company">Company</option>
              <option value="Supplier">Supplier</option>
            </select>
          </div>

          {/* Supplier */}
          <div>
            <label className="form-label">Supplier</label>
            <select name="supplier_id" className="form-select">
              <option value="">— No Supplier —</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Payment Type */}
          <div>
            <label className="form-label">Payment Type</label>
            <select name="payment_type" className="form-select">
              <option value="">— Select —</option>
              {PAYMENT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* KM Fields */}
          <div>
            <label className="form-label">Current KM</label>
            <input name="current_km" type="number" defaultValue="0" className="form-input" />
          </div>
          <div>
            <label className="form-label">Next Service KM</label>
            <input name="next_service_km" type="number" defaultValue="5000" className="form-input" />
          </div>

          {/* Dates */}
          <div>
            <label className="form-label">Next Service Date</label>
            <input name="next_service_date" type="date" className="form-input" />
          </div>
          <div>
            <label className="form-label">Insurance Expiry</label>
            <input name="insurance_expiry" type="date" className="form-input" />
          </div>
          <div>
            <label className="form-label">Revenue License Expiry</label>
            <input name="revenue_license_expiry" type="date" className="form-input" />
          </div>
          <div>
            <label className="form-label">Handover Date</label>
            <input name="handover_date" type="date" className="form-input" />
          </div>
          <div>
            <label className="form-label">Agreement End Date</label>
            <input name="agreement_end_date" type="date" className="form-input" />
          </div>

          {/* Eco Test — conditional on Petrol/Diesel */}
          {needsEcoTest && (
            <div>
              <label className="form-label">Eco Test Expiry</label>
              <input name="eco_test_expiry" type="date" className="form-input" />
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="px-5 pb-5">
          <label className="form-label">Notes</label>
          <textarea name="notes" rows={2} className="form-input resize-none" />
        </div>
      </div>

      {/* Section: Rate Tiers */}
      <div className="section-card">
        <div className="section-card-header">
          <h2 className="section-card-title">Rate Tiers</h2>
        </div>
        <div className="p-5">
          <div className="flex items-end gap-3 mb-5">
            <div className="flex-1 max-w-[200px]">
              <label className="form-label">Monthly Rate (LKR)</label>
              <input
                type="number"
                value={monthlyRate}
                onChange={e => handleMonthlyChange(+e.target.value)}
                className="form-input text-lg font-semibold"
                placeholder="e.g. 60000"
              />
            </div>
            <p className="text-xs text-gray-400 pb-2">Auto-calculates all 4 tiers below</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tiers.map((tier, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 mb-0.5">{tier.label}</p>
                  <p className="text-xs text-gray-400">
                    Days {tier.days_from}{tier.days_to ? `–${tier.days_to}` : "+"}
                  </p>
                </div>
                {editingTier === i ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={tier.rate_per_day}
                      onChange={e => handleTierEdit(i, +e.target.value)}
                      className="form-input w-24 text-sm"
                      autoFocus
                    />
                    <button type="button" onClick={() => setEditingTier(null)} className="text-green-600">
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">
                      LKR {tier.rate_per_day.toLocaleString()}/day
                    </span>
                    <button type="button" onClick={() => setEditingTier(i)} className="text-gray-400 hover:text-blue-500">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 px-1">{error}</p>}

      <div className="flex justify-end gap-3">
        <Link href="/vehicles" className="btn-secondary">Cancel</Link>
        <button type="submit" className="btn-primary" disabled={isPending}>
          {isPending ? "Saving..." : "Add Vehicle"}
        </button>
      </div>
    </form>
  );
}
