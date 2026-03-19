'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function getCustomers(params?: { search?: string; page?: number; pageSize?: number }) {
  await requireAuth();

  let query = supabaseAdmin
    .from('customers')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (params?.search) {
    query = query.or(`name.ilike.%${params.search}%,nic.ilike.%${params.search}%,phone.ilike.%${params.search}%`);
  }

  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return { data: data ?? [], count: count ?? 0 };
}

export async function getCustomerById(id: string) {
  await requireAuth();
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('*, guarantors(*)')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

export async function createCustomer(formData: FormData) {
  await requireAuth();

  const { data, error } = await supabaseAdmin.from('customers').insert({
    name: formData.get('name') as string,
    nic: formData.get('nic') as string || null,
    phone: formData.get('phone') as string || null,
    phone2: formData.get('phone2') as string || null,
    email: formData.get('email') as string || null,
    address: formData.get('address') as string || null,
    license_number: formData.get('license_number') as string || null,
    license_expiry: formData.get('license_expiry') as string || null,
    notes: formData.get('notes') as string || null,
  }).select().single();

  if (error) return { error: error.message };
  revalidatePath('/customers');
  return { data };
}

export async function updateCustomer(id: string, formData: FormData) {
  await requireAuth();

  const { error } = await supabaseAdmin.from('customers').update({
    name: formData.get('name') as string,
    nic: formData.get('nic') as string || null,
    phone: formData.get('phone') as string || null,
    phone2: formData.get('phone2') as string || null,
    email: formData.get('email') as string || null,
    address: formData.get('address') as string || null,
    license_number: formData.get('license_number') as string || null,
    license_expiry: formData.get('license_expiry') as string || null,
    notes: formData.get('notes') as string || null,
  }).eq('id', id);

  if (error) return { error: error.message };
  revalidatePath('/customers');
  return { success: true };
}

export async function deleteCustomer(id: string) {
  await requireAuth();
  await supabaseAdmin.from('customers').update({ is_active: false }).eq('id', id);
  revalidatePath('/customers');
  return { success: true };
}

export async function getCustomerByNic(nic: string) {
  await requireAuth();
  if (!nic?.trim()) return null;
  const { data } = await supabaseAdmin
    .from('customers')
    .select('*')
    .ilike('nic', nic.trim())
    .eq('is_active', true)
    .limit(1)
    .single();
  return data ?? null;
}
