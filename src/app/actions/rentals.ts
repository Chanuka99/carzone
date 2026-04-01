'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/app/actions/activity';
import { Rental } from '@/types';

export async function getRentals(params?: {
  search?: string;
  status?: string;
  vehicleReg?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}) {
  await requireAuth();

  let query = supabaseAdmin
    .from('rentals')
    .select(
      `*, 
      vehicle:vehicles(id, reg_number, brand, model, type),
      customer:customers(id, name, phone),
      guarantor:guarantors(id, name, phone)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false });

  if (params?.search) query = query.ilike('rental_number', `%${params.search}%`);
  if (params?.status && params.status !== 'all') query = query.eq('status', params.status);
  if (params?.customerId) query = query.eq('customer_id', params.customerId);
  if (params?.vehicleReg) {
    const { data: v } = await supabaseAdmin.from('vehicles').select('id').ilike('reg_number', `%${params.vehicleReg}%`);
    const ids = (v ?? []).map(x => x.id);
    if (ids.length > 0) query = query.in('vehicle_id', ids);
  }
  if (params?.dateFrom) query = query.gte('start_date', params.dateFrom);
  if (params?.dateTo) query = query.lte('end_date', params.dateTo);

  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return { data: (data ?? []) as Rental[], count: count ?? 0 };
}

export async function getRentalById(id: string): Promise<Rental | null> {
  await requireAuth();

  const { data, error } = await supabaseAdmin
    .from('rentals')
    .select(`
      *,
      vehicle:vehicles(*, supplier:suppliers(id, name)),
      customer:customers(*),
      guarantor:guarantors(*),
      exchanges:vehicle_exchanges(*, old_vehicle:vehicles!vehicle_exchanges_old_vehicle_id_fkey(id, reg_number, brand, model), new_vehicle:vehicles!vehicle_exchanges_new_vehicle_id_fkey(id, reg_number, brand, model))
    `)
    .eq('id', id)
    .single();

  if (error) return null;
  return data as Rental;
}

export async function checkVehicleOverlap(
  vehicleId: string,
  startDate: string,
  endDate: string,
  excludeRentalId?: string
): Promise<boolean> {
  await requireAuth();

  let query = supabaseAdmin
    .from('rentals')
    .select('id')
    .eq('vehicle_id', vehicleId)
    .in('status', ['active', 'booked'])
    .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

  if (excludeRentalId) query = query.neq('id', excludeRentalId);

  const { data } = await query;
  return (data?.length ?? 0) > 0;
}

export async function createRental(data: {
  vehicle_id: string;
  customer_id: string;
  guarantor_id?: string;
  start_date: string;
  end_date: string;
  daily_rate: number;
  deposit: number;
  additional_charges?: number;
  discount?: number;
  pickup_km?: number;
  notes?: string;
  status?: 'booked' | 'active';
}) {
  const session = await requireAuth();

  // Check overlap
  const overlaps = await checkVehicleOverlap(data.vehicle_id, data.start_date, data.end_date);
  if (overlaps) return { error: 'Vehicle is already booked for the selected dates.' };

  const days = Math.max(1, Math.ceil((new Date(data.end_date).getTime() - new Date(data.start_date).getTime()) / 86400000));
  const subtotal = days * data.daily_rate;
  const additional = data.additional_charges ?? 0;
  const discount = data.discount ?? 0;
  const total_amount = subtotal + additional - discount;

  const { data: rental, error } = await supabaseAdmin
    .from('rentals')
    .insert({
      vehicle_id: data.vehicle_id,
      customer_id: data.customer_id,
      guarantor_id: data.guarantor_id ?? null,
      created_by: session.id,
      start_date: data.start_date,
      end_date: data.end_date,
      daily_rate: data.daily_rate,
      subtotal,
      additional_charges: additional,
      discount,
      total_amount,
      deposit: data.deposit,
      pickup_km: data.pickup_km ?? 0,
      status: data.status ?? 'booked',
      rental_number: '',
      notes: data.notes ?? null,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // Update vehicle status
  await supabaseAdmin.from('vehicles').update({
    status: data.status === 'active' ? 'rented' : 'booked',
  }).eq('id', data.vehicle_id);

  revalidatePath('/rentals');
  revalidatePath('/dashboard');
  await logActivity({
    action: 'created',
    module: 'Rentals',
    entity_id: rental.id,
    entity_label: rental.rental_number || `Rental #${rental.id.slice(0,8)}`,
    details: `Status: ${rental.status}`,
  });
  return { data: rental };
}

export async function activateRental(rentalId: string, pickupKm: number) {
  await requireAuth();

  const { data: rental } = await supabaseAdmin.from('rentals').select('vehicle_id, rental_number').eq('id', rentalId).single();
  if (!rental) return { error: 'Rental not found' };

  await supabaseAdmin.from('rentals').update({ status: 'active', pickup_km: pickupKm }).eq('id', rentalId);
  await supabaseAdmin.from('vehicles').update({ status: 'rented', current_km: pickupKm }).eq('id', rental.vehicle_id);

  revalidatePath('/rentals');
  revalidatePath('/dashboard');
  await logActivity({
    action: 'activated',
    module: 'Rentals',
    entity_id: rentalId,
    entity_label: rental.rental_number,
    details: `Pickup KM: ${pickupKm}`,
  });
  return { success: true };
}

export async function returnRental(rentalId: string, data: {
  return_km: number;
  actual_return_date: string;
  additional_charges?: number;
  return_notes?: string;
}) {
  await requireAuth();

  const { data: rental } = await supabaseAdmin.from('rentals').select('vehicle_id, rental_number, daily_rate, subtotal, additional_charges, discount').eq('id', rentalId).single();
  if (!rental) return { error: 'Rental not found' };

  const extra = data.additional_charges ?? 0;
  const newTotal = (rental.subtotal ?? 0) + (rental.additional_charges ?? 0) + extra - (rental.discount ?? 0);

  await supabaseAdmin.from('rentals').update({
    status: 'returned',
    return_km: data.return_km,
    actual_return_date: data.actual_return_date,
    additional_charges: (rental.additional_charges ?? 0) + extra,
    total_amount: newTotal,
    return_notes: data.return_notes ?? null,
  }).eq('id', rentalId);

  const { data: settings } = await supabaseAdmin.from('company_settings').select('service_interval_km').single();
  const interval = settings?.service_interval_km ?? 5000;

  await supabaseAdmin.from('vehicles').update({
    status: 'available',
    current_km: data.return_km,
    next_service_km: data.return_km + interval,
  }).eq('id', rental.vehicle_id);

  revalidatePath('/rentals');
  revalidatePath('/dashboard');
  await logActivity({
    action: 'returned',
    module: 'Rentals',
    entity_id: rentalId,
    entity_label: rental.rental_number,
    details: `Return KM: ${data.return_km}`,
  });
  return { success: true };
}

export async function exchangeVehicle(data: {
  rental_id: string;
  old_vehicle_id: string;
  new_vehicle_id: string;
  exchange_date: string;
  reason?: string;
  additional_charge?: number;
  old_vehicle_km?: number;
  new_vehicle_km?: number;
}) {
  const session = await requireAuth();

  // Check new vehicle availability
  const overlaps = await checkVehicleOverlap(data.new_vehicle_id, data.exchange_date, '2099-12-31', data.rental_id);
  if (overlaps) return { error: 'New vehicle is not available.' };

  await supabaseAdmin.from('vehicle_exchanges').insert({
    ...data,
    additional_charge: data.additional_charge ?? 0,
    approved_by: session.id,
  });

  // Update rental vehicle
  const addl = data.additional_charge ?? 0;
  await supabaseAdmin.from('rentals').update({
    vehicle_id: data.new_vehicle_id,
    additional_charges: addl,
  }).eq('id', data.rental_id);

  // Update vehicle statuses
  await supabaseAdmin.from('vehicles').update({ status: 'available' }).eq('id', data.old_vehicle_id);
  await supabaseAdmin.from('vehicles').update({ status: 'rented' }).eq('id', data.new_vehicle_id);

  // Fetch rental number for log
  const { data: r } = await supabaseAdmin.from('rentals').select('rental_number').eq('id', data.rental_id).single();

  revalidatePath('/rentals');
  await logActivity({
    action: 'exchanged',
    module: 'Rentals',
    entity_id: data.rental_id,
    entity_label: r?.rental_number ?? data.rental_id,
    details: `Vehicle exchanged${data.reason ? ': ' + data.reason : ''}`,
  });
  return { success: true };
}

export async function cancelRental(rentalId: string) {
  await requireAuth();

  const { data: rental } = await supabaseAdmin.from('rentals').select('vehicle_id, rental_number').eq('id', rentalId).single();
  if (!rental) return { error: 'Rental not found' };

  await supabaseAdmin.from('rentals').update({ status: 'cancelled' }).eq('id', rentalId);
  await supabaseAdmin.from('vehicles').update({ status: 'available' }).eq('id', rental.vehicle_id);

  revalidatePath('/rentals');
  revalidatePath('/dashboard');
  await logActivity({
    action: 'cancelled',
    module: 'Rentals',
    entity_id: rentalId,
    entity_label: rental.rental_number,
  });
  return { success: true };
}
