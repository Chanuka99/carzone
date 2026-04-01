'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/app/actions/activity';
import { buildDiff } from '@/lib/diff';
import { Vehicle } from '@/types';

const VEHICLE_FIELDS: Record<string, string> = {
  brand: 'Brand', model: 'Model', year: 'Year', color: 'Color',
  type: 'Type', status: 'Status', current_km: 'Current KM',
  next_service_km: 'Next Service KM', daily_rate: 'Daily Rate', notes: 'Notes',
};

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
    source: formData.get('source') as string,
    supplier_id: formData.get('supplier_id') as string || null,
    current_km: parseInt(formData.get('current_km') as string) || 0,
    next_service_km: parseInt(formData.get('next_service_km') as string) || 5000,
    next_service_date: formData.get('next_service_date') as string || null,
    insurance_expiry: formData.get('insurance_expiry') as string || null,
    revenue_license_expiry: formData.get('revenue_license_expiry') as string || null,
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

  // Insert photos if any were uploaded during creation
  const photoUrls = formData.getAll('vehicle_photos_url') as string[];
  const photoPaths = formData.getAll('vehicle_photos_path') as string[];
  if (photoUrls.length > 0 && photoUrls.length === photoPaths.length) {
    const photoInserts = photoUrls.map((url, i) => ({
      vehicle_id: data.id,
      url,
      storage_path: photoPaths[i],
      is_primary: i === 0, // first photo is primary
    }));
    await supabaseAdmin.from('vehicle_photos').insert(photoInserts);
  }

  revalidatePath('/vehicles');
  await logActivity({ action: 'created', module: 'Vehicles', entity_id: data.id, entity_label: `${data.brand} ${data.model} (${data.reg_number})` });
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

  // Fetch current record for diff before updating
  const { data: current } = await supabaseAdmin.from('vehicles')
    .select('brand, model, year, color, type, status, current_km, next_service_km, daily_rate, notes, reg_number')
    .eq('id', id).single();

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
  const label = current ? `${current.brand} ${current.model} (${current.reg_number})` : id;
  const diff = current ? buildDiff(current as Record<string, unknown>, updateData as Record<string, unknown>, VEHICLE_FIELDS) : { details: '', old_value: '', new_value: '' };
  await logActivity({ action: 'updated', module: 'Vehicles', entity_id: id, entity_label: label, ...diff });
  return { success: true };
}

export async function deleteVehicle(id: string) {
  await requireAuth();
  const { data: v } = await supabaseAdmin.from('vehicles').select('brand, model, reg_number').eq('id', id).single();
  const { error } = await supabaseAdmin.from('vehicles').update({ is_active: false }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/vehicles');
  await logActivity({ action: 'deleted', module: 'Vehicles', entity_id: id, entity_label: v ? `${v.brand} ${v.model} (${v.reg_number})` : id });
  return { success: true };
}

export async function updateVehicleStatus(id: string, status: Vehicle['status']) {
  await requireAuth();
  const { error } = await supabaseAdmin.from('vehicles').update({ status }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/vehicles');
  const { data: v } = await supabaseAdmin.from('vehicles').select('brand, model, reg_number').eq('id', id).single();
  await logActivity({ action: 'status_changed', module: 'Vehicles', entity_id: id, entity_label: v ? `${v.brand} ${v.model} (${v.reg_number})` : id, details: `Status → ${status}` });
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

  const { data: inserted, error } = await supabaseAdmin.from('vehicle_photos').insert({
    vehicle_id: vehicleId,
    url: urlData.publicUrl,
    storage_path: path,
    is_primary: isPrimary,
  }).select('id').single();

  if (error) return { error: error.message };

  revalidatePath(`/vehicles/${vehicleId}`);
  return { success: true, url: urlData.publicUrl, path, id: inserted.id };
}

export async function deleteVehiclePhoto(photoId: string, storagePath: string, vehicleId: string) {
  await requireAuth();
  await supabaseAdmin.storage.from('vehicle-photos').remove([storagePath]);
  await supabaseAdmin.from('vehicle_photos').delete().eq('id', photoId);
  revalidatePath(`/vehicles/${vehicleId}`);
  return { success: true };
}
