'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, requireAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function getUsers() {
  await requireAdmin();
  const { data, error } = await supabaseAdmin.from('users').select('id, username, full_name, email, role, is_active, created_at').order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createUser(formData: FormData) {
  await requireAdmin();

  const password = formData.get('password') as string;
  const hash = await bcrypt.hash(password, 10);

  const { data, error } = await supabaseAdmin.from('users').insert({
    username: (formData.get('username') as string).toLowerCase().trim(),
    full_name: formData.get('full_name') as string,
    email: formData.get('email') as string || null,
    password_hash: hash,
    role: formData.get('role') as string || 'employee',
  }).select('id, username, full_name, email, role, is_active, created_at').single();

  if (error) return { error: error.message };
  revalidatePath('/users');
  return { data };
}

export async function updateUser(id: string, formData: FormData) {
  await requireAdmin();

  const updates: Record<string, unknown> = {
    full_name: formData.get('full_name') as string,
    email: formData.get('email') as string || null,
    role: formData.get('role') as string,
  };

  const newPassword = formData.get('password') as string;
  if (newPassword) {
    updates.password_hash = await bcrypt.hash(newPassword, 10);
  }

  const { error } = await supabaseAdmin.from('users').update(updates).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/users');
  return { success: true };
}

export async function toggleUserActive(id: string, isActive: boolean) {
  await requireAdmin();
  await supabaseAdmin.from('users').update({ is_active: isActive }).eq('id', id);
  revalidatePath('/users');
  return { success: true };
}

// Todo actions
export async function getTodos() {
  await requireAuth();
  const { data } = await supabaseAdmin.from('todos').select('*').order('due_date', { ascending: true, nullsFirst: false });
  return data ?? [];
}

export async function createTodo(title: string, dueDate?: string, description?: string) {
  const session = await requireAuth();
  const { data, error } = await supabaseAdmin.from('todos').insert({
    title,
    description: description ?? null,
    due_date: dueDate ?? null,
    type: 'custom',
    created_by: session.id,
  }).select().single();
  if (error) return { error: error.message };
  revalidatePath('/dashboard');
  return { data };
}

export async function toggleTodo(id: string, isDone: boolean) {
  await requireAuth();
  await supabaseAdmin.from('todos').update({ is_done: isDone }).eq('id', id);
  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteTodo(id: string) {
  await requireAuth();
  await supabaseAdmin.from('todos').delete().eq('id', id);
  revalidatePath('/dashboard');
  return { success: true };
}

// Company settings
export async function getCompanySettings() {
  await requireAuth();
  const { data } = await supabaseAdmin.from('company_settings').select('*').single();
  return data;
}

export async function updateCompanySettings(formData: FormData) {
  await requireAdmin();

  const { data: existing } = await supabaseAdmin.from('company_settings').select('id').single();

  const payload = {
    company_name: formData.get('company_name') as string,
    address: formData.get('address') as string || null,
    phone: formData.get('phone') as string || null,
    email: formData.get('email') as string || null,
    service_interval_km: parseInt(formData.get('service_interval_km') as string) || 5000,
  };

  if (existing) {
    await supabaseAdmin.from('company_settings').update(payload).eq('id', existing.id);
  } else {
    await supabaseAdmin.from('company_settings').insert(payload);
  }

  revalidatePath('/settings');
  return { success: true };
}
