'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function getSuppliers(params?: { search?: string; page?: number; pageSize?: number }) {
  await requireAuth();

  let query = supabaseAdmin
    .from('suppliers')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (params?.search) {
    query = query.or(`name.ilike.%${params.search}%,phone.ilike.%${params.search}%,nic.ilike.%${params.search}%`);
  }

  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { data: data ?? [], count: count ?? 0 };
}

export async function createSupplier(formData: FormData) {
  await requireAuth();

  const { data, error } = await supabaseAdmin.from('suppliers').insert({
    name: formData.get('name') as string,
    phone: formData.get('phone') as string || null,
    phone2: formData.get('phone2') as string || null,
    email: formData.get('email') as string || null,
    address: formData.get('address') as string || null,
    nic: formData.get('nic') as string || null,
    notes: formData.get('notes') as string || null,
  }).select().single();

  if (error) return { error: error.message };
  revalidatePath('/suppliers');
  return { data };
}

export async function updateSupplier(id: string, formData: FormData) {
  await requireAuth();

  const { error } = await supabaseAdmin.from('suppliers').update({
    name: formData.get('name') as string,
    phone: formData.get('phone') as string || null,
    phone2: formData.get('phone2') as string || null,
    email: formData.get('email') as string || null,
    address: formData.get('address') as string || null,
    nic: formData.get('nic') as string || null,
    notes: formData.get('notes') as string || null,
  }).eq('id', id);

  if (error) return { error: error.message };
  revalidatePath('/suppliers');
  return { success: true };
}

export async function deleteSupplier(id: string) {
  await requireAuth();
  await supabaseAdmin.from('suppliers').update({ is_active: false }).eq('id', id);
  revalidatePath('/suppliers');
  return { success: true };
}

// Guarantors
export async function getGuarantors(params?: { search?: string; customerId?: string; page?: number; pageSize?: number }) {
  await requireAuth();

  let query = supabaseAdmin
    .from('guarantors')
    .select('*, customer:customers(id, name, phone)', { count: 'exact' })
    .order('name', { ascending: true });

  if (params?.search) {
    query = query.or(`name.ilike.%${params.search}%,nic.ilike.%${params.search}%,phone.ilike.%${params.search}%`);
  }
  if (params?.customerId) query = query.eq('customer_id', params.customerId);

  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { data: data ?? [], count: count ?? 0 };
}

export async function createGuarantor(formData: FormData) {
  await requireAuth();

  const { data, error } = await supabaseAdmin.from('guarantors').insert({
    customer_id: formData.get('customer_id') as string || null,
    name: formData.get('name') as string,
    nic: formData.get('nic') as string || null,
    phone: formData.get('phone') as string || null,
    phone2: formData.get('phone2') as string || null,
    address: formData.get('address') as string || null,
    relationship: formData.get('relationship') as string || null,
    notes: formData.get('notes') as string || null,
  }).select().single();

  if (error) return { error: error.message };
  revalidatePath('/guarantors');
  return { data };
}

export async function updateGuarantor(id: string, formData: FormData) {
  await requireAuth();

  const { error } = await supabaseAdmin.from('guarantors').update({
    customer_id: formData.get('customer_id') as string || null,
    name: formData.get('name') as string,
    nic: formData.get('nic') as string || null,
    phone: formData.get('phone') as string || null,
    phone2: formData.get('phone2') as string || null,
    address: formData.get('address') as string || null,
    relationship: formData.get('relationship') as string || null,
    notes: formData.get('notes') as string || null,
  }).eq('id', id);

  if (error) return { error: error.message };
  revalidatePath('/guarantors');
  return { success: true };
}

export async function deleteGuarantor(id: string) {
  await requireAuth();
  await supabaseAdmin.from('guarantors').delete().eq('id', id);
  revalidatePath('/guarantors');
  return { success: true };
}
