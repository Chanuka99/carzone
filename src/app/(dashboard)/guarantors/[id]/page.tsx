import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";
import GuarantorDetailClient from "./GuarantorDetailClient";

async function getGuarantorById(id: string) {
  await requireAuth();
  const { data, error } = await supabaseAdmin
    .from("guarantors")
    .select("*, customer:customers(id, name, phone, nic, email)")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

async function getGuarantorRentals(guarantorId: string) {
  await requireAuth();
  const { data } = await supabaseAdmin
    .from("rentals")
    .select("*, vehicle:vehicles(id, reg_number, brand, model), customer:customers(id, name, phone)")
    .eq("guarantor_id", guarantorId)
    .order("start_date", { ascending: false });
  return data ?? [];
}

export default async function GuarantorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const [guarantor, rentals] = await Promise.all([
    getGuarantorById(p.id),
    getGuarantorRentals(p.id),
  ]);

  if (!guarantor) notFound();

  return <GuarantorDetailClient guarantor={guarantor} rentals={rentals} />;
}
