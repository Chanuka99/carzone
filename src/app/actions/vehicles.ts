'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';
import { Vehicle } from '@/types';

export async function getVehicles(params?: {
  search?: string;
  type?: string;
  status?: string;
  source?: string;
  page?: number;
  pageSize?: number;
}) {
  await requireAuth();

  let query = supabaseAdmin
    .from('vehicles')
    .select('*, supplier:suppliers(id, name), photos:vehicle_photos(*), rate_tiers(*)', { count: 'exact' })
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (params?.search) {
    query = query.or(`reg_number.ilike.%${params.search}%,brand.ilike.%${params.search}%,model.ilike.%${params.search}%`);
  }
  if (params?.type && params.type !== 'all') query = query.eq('type', params.type);
  if (params?.status && params.status !== 'all') query = query.eq('status', params.status);
  if (params?.source && params.source !== 'all') query = query.eq('source', params.source);

  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return { data: data as Vehicle[], count: count ?? 0 };
}

export async function getVehicleById(id: string): Promise<Vehicle | null> {
  await requireAuth();

  const { data, error } = await supabaseAdmin
    .from('vehicles')
    .select('*, supplier:suppliers(id, name), photos:vehicle_photos(*), rate_tiers(*)')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as Vehicle;
}

function parseVehicleFields(formData: FormData) {
  return {
    reg_number: (formData.get('reg_number') as string)?.toUpperCase(),
    brand: formData.get('brand') as string,
    model: formData.get('model') as string,
    year: formData.get('year') ? parseInt(formData.get('year') as string) : null,
    color: formData.get('color') as string || null,
    type: formData.get('type') as string,
    fuel_type: formData.get('fuel_type') as string || null,
    transmission: formData.get('transmission') as string || null,
    source: formData.get('source') as string,
    supplier_id: formData.get('supplier_id') as string || null,
    current_km: parseInt(formData.get('current_km') as string) || 0,
    next_service_km: parseInt(formData.get('next_service_km') as string) || 5000,
    next_service_date: formData.get('next_service_date') as string || null,
    insurance_expiry: formData.get('insurance_expiry') as string || null,
    revenue_license_expiry: formData.get('revenue_license_expiry') as string || null,
    eco_test_expiry: formData.get('eco_test_expiry') as string || null,
    handover_date: formData.get('handover_date') as string || null,
    agreement_end_date: formData.get('agreement_end_date') as string || null,
    payment_type: formData.get('payment_type') as string || null,
    notes: formData.get('notes') as string || null,
  };
}

export async function createVehicle(formData: FormData) {
  await requireAuth();

  const tiersJson = formData.get('rate_tiers') as string;
  const tiers = tiersJson ? JSON.parse(tiersJson) : [];

  // Use the lowest tier rate (Below 1 Week) as daily_rate fallback
  const dailyRate = tiers.length > 0 ? tiers[0].rate_per_day : 0;

  const vehicleData = {
    ...parseVehicleFields(formData),
    daily_rate: dailyRate,
  };

  const { data, error } = await supabaseAdmin
    .from('vehicles')
    .insert(vehicleData)
    .select()
    .single();

  if (error) return { error: error.message };

  // Insert rate tiers
  if (tiers.length > 0) {
    await supabaseAdmin.from('rate_tiers').insert(
      tiers.map((t: { days_from: number; days_to?: number | null; rate_per_day: number; label?: string }) => ({
        vehicle_id: data.id,
        days_from: t.days_from,
        days_to: t.days_to ?? null,
        rate_per_day: t.rate_per_day,
      }))
    );
  }

  revalidatePath('/vehicles');
  return { data };
}

export async function updateVehicle(id: string, formData: FormData) {
  await requireAuth();

  const tiersJson = formData.get('rate_tiers') as string;
  const tiers = tiersJson ? JSON.parse(tiersJson) : null;

  const vehicleData = {
    ...parseVehicleFields(formData),
    daily_rate: tiers && tiers.length > 0 ? tiers[0].rate_per_day : 0,
  };

  // Remove reg_number from update (shouldn't change)
  const { reg_number, ...updateData } = vehicleData;

  const { error } = await supabaseAdmin.from('vehicles').update(updateData).eq('id', id);
  if (error) return { error: error.message };

  // Update rate tiers
  if (tiers !== null) {
    await supabaseAdmin.from('rate_tiers').delete().eq('vehicle_id', id);
    if (tiers.length > 0) {
      await supabaseAdmin.from('rate_tiers').insert(
        tiers.map((t: { days_from: number; days_to?: number | null; rate_per_day: number }) => ({
          vehicle_id: id,
          days_from: t.days_from,
          days_to: t.days_to ?? null,
          rate_per_day: t.rate_per_day,
        }))
      );
    }
  }

  revalidatePath('/vehicles');
  revalidatePath(`/vehicles/${id}`);
  return { success: true };
}

export async function deleteVehicle(id: string) {
  await requireAuth();
  const { error } = await supabaseAdmin.from('vehicles').update({ is_active: false }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/vehicles');
  return { success: true };
}

export async function updateVehicleStatus(id: string, status: Vehicle['status']) {
  await requireAuth();
  const { error } = await supabaseAdmin.from('vehicles').update({ status }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/vehicles');
  return { success: true };
}

export async function uploadVehiclePhoto(vehicleId: string, file: File, isPrimary = false) {
  await requireAuth();

  const ext = file.name.split('.').pop();
  const path = `${vehicleId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('vehicle-photos')
    .upload(path, file);

  if (uploadError) return { error: uploadError.message };

  const { data: urlData } = supabaseAdmin.storage.from('vehicle-photos').getPublicUrl(path);

  const { error } = await supabaseAdmin.from('vehicle_photos').insert({
    vehicle_id: vehicleId,
    url: urlData.publicUrl,
    storage_path: path,
    is_primary: isPrimary,
  });

  if (error) return { error: error.message };

  revalidatePath(`/vehicles/${vehicleId}`);
  return { success: true, url: urlData.publicUrl };
}

export async function deleteVehiclePhoto(photoId: string, storagePath: string, vehicleId: string) {
  await requireAuth();
  await supabaseAdmin.storage.from('vehicle-photos').remove([storagePath]);
  await supabaseAdmin.from('vehicle_photos').delete().eq('id', photoId);
  revalidatePath(`/vehicles/${vehicleId}`);
  return { success: true };
}
