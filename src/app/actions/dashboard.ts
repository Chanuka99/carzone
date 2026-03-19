'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';
import { DashboardStats, TopVehicle, TopCustomer } from '@/types';

export async function getDashboardStats(): Promise<DashboardStats> {
  await requireAuth();

  const [
    vehiclesRes,
    rentalsRes,
    todayRentalsRes,
  ] = await Promise.all([
    supabaseAdmin.from('vehicles').select('id, status').eq('is_active', true),
    supabaseAdmin.from('rentals').select('id, status, deposit, total_amount, start_date, end_date'),
    supabaseAdmin.from('rentals').select('id, total_amount, deposit').gte('created_at', new Date().toISOString().substring(0, 10)),
  ]);

  const vehicles = vehiclesRes.data ?? [];
  const rentals = rentalsRes.data ?? [];

  const activeRentals = rentals.filter(r => r.status === 'active').length;
  const availableVehicles = vehicles.filter(v => v.status === 'available').length;
  const bookedVehicles = vehicles.filter(v => v.status === 'booked').length;
  const inGarageVehicles = vehicles.filter(v => v.status === 'in_garage').length;
  const totalVehicles = vehicles.length;

  const today = new Date().toISOString().substring(0, 10);
  const overdueRentals = rentals.filter(r =>
    (r.status === 'active' || r.status === 'overdue') && r.end_date < today
  ).length;

  const todayRevenue = (todayRentalsRes.data ?? []).reduce((sum, r) => sum + (r.total_amount ?? 0), 0);
  const totalDeposit = rentals
    .filter(r => r.status === 'active' || r.status === 'booked')
    .reduce((sum, r) => sum + (r.deposit ?? 0), 0);

  const completedToday = rentals.filter(r => r.status === 'returned' && r.end_date === today).length;

  return {
    activeRentals,
    availableVehicles,
    bookedVehicles,
    inGarageVehicles,
    totalVehicles,
    todayRevenue,
    totalDeposit,
    overdueRentals,
    completedToday,
  };
}

export async function getTopVehicles(limit = 10): Promise<TopVehicle[]> {
  await requireAuth();

  const { data: rentals } = await supabaseAdmin
    .from('rentals')
    .select('vehicle_id, total_amount, vehicles(id, reg_number, brand, model)')
    .not('status', 'eq', 'cancelled');

  if (!rentals) return [];

  const vehicleMap = new Map<string, TopVehicle>();

  for (const rental of rentals) {
    const v = (rental.vehicles as unknown) as { id: string; reg_number: string; brand: string; model: string } | { id: string; reg_number: string; brand: string; model: string }[] | null;
    const vObj = Array.isArray(v) ? v[0] : v;
    if (!vObj) continue;

    const existing = vehicleMap.get(rental.vehicle_id);
    if (existing) {
      existing.rental_count += 1;
      existing.total_revenue += rental.total_amount ?? 0;
    } else {
      vehicleMap.set(rental.vehicle_id, {
        vehicle_id: rental.vehicle_id,
        reg_number: vObj.reg_number,
        brand: vObj.brand,
        model: vObj.model,
        rental_count: 1,
        total_revenue: rental.total_amount ?? 0,
      });
    }
  }

  return Array.from(vehicleMap.values())
    .sort((a, b) => b.rental_count - a.rental_count)
    .slice(0, limit);
}

export async function getTopCustomers(limit = 10): Promise<TopCustomer[]> {
  await requireAuth();

  const { data: rentals } = await supabaseAdmin
    .from('rentals')
    .select('customer_id, total_amount, customers(id, name, phone)')
    .not('status', 'eq', 'cancelled');

  if (!rentals) return [];

  const customerMap = new Map<string, TopCustomer>();

  for (const rental of rentals) {
    const cRaw = (rental.customers as unknown) as { id: string; name: string; phone: string } | { id: string; name: string; phone: string }[] | null;
    const c = Array.isArray(cRaw) ? cRaw[0] : cRaw;
    if (!c) continue;

    const existing = customerMap.get(rental.customer_id);
    if (existing) {
      existing.rental_count += 1;
      existing.total_spent += rental.total_amount ?? 0;
    } else {
      customerMap.set(rental.customer_id, {
        customer_id: rental.customer_id,
        name: c.name,
        phone: c.phone,
        rental_count: 1,
        total_spent: rental.total_amount ?? 0,
      });
    }
  }

  return Array.from(customerMap.values())
    .sort((a, b) => b.rental_count - a.rental_count)
    .slice(0, limit);
}

export async function getUpcomingRentals() {
  await requireAuth();
  const today = new Date().toISOString().substring(0, 10);
  const in7days = new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10);

  const { data } = await supabaseAdmin
    .from('rentals')
    .select('id, rental_number, start_date, end_date, status, customers(name), vehicles(reg_number, brand, model)')
    .in('status', ['active', 'booked'])
    .lte('end_date', in7days)
    .order('end_date', { ascending: true });

  return data ?? [];
}

export async function getCalendarEvents() {
  await requireAuth();

  const { data: rentals } = await supabaseAdmin
    .from('rentals')
    .select('id, rental_number, start_date, end_date, status, customers(name), vehicles(reg_number)')
    .in('status', ['active', 'booked'])
    .order('start_date', { ascending: true });

  const { data: vehicles } = await supabaseAdmin
    .from('vehicles')
    .select('id, reg_number, brand, model, next_service_date, next_service_km, current_km, status')
    .eq('is_active', true);

  return { rentals: rentals ?? [], vehicles: vehicles ?? [] };
}
