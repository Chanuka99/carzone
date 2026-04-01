export type UserRole = 'admin' | 'employee';
export type VehicleStatus = 'available' | 'rented' | 'booked' | 'in_garage';
export type VehicleType = 'Sedan' | 'Hatchback' | 'SUV' | 'Van' | 'Pickup' | 'Bus' | 'Other';
export type VehicleSource = 'Company' | 'Supplier';
export type RentalStatus = 'booked' | 'active' | 'returned' | 'cancelled' | 'overdue';
export type PaymentStatus = 'pending' | 'partial' | 'paid';
export type TodoType = 'rental_end' | 'service_due' | 'service_overdue' | 'booked_pickup' | 'custom';

export interface User {
  id: string;
  username: string;
  full_name: string;
  email?: string;
  role: UserRole;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanySettings {
  id: string;
  company_name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  service_interval_km: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  phone2?: string;
  email?: string;
  address?: string;
  nic?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  reg_number: string;
  brand: string;
  model: string;
  year?: number;
  color?: string;
  type: VehicleType;
  fuel_type?: string;
  transmission?: string;
  source: VehicleSource;
  supplier_id?: string;
  supplier?: Supplier;
  status: VehicleStatus;
  daily_rate: number;
  current_km: number;
  next_service_km: number;
  next_service_date?: string;
  last_service_date?: string;
  last_service_km?: number;
  insurance_expiry?: string;
  revenue_license_expiry?: string;
  eco_test_expiry?: string;
  handover_date?: string;
  agreement_end_date?: string;
  payment_type?: string;
  notes?: string;
  is_active: boolean;
  photos?: VehiclePhoto[];
  rate_tiers?: RateTier[];
  created_at: string;
  updated_at: string;
}

export interface VehiclePhoto {
  id: string;
  vehicle_id: string;
  url: string;
  storage_path: string;
  is_primary: boolean;
  created_at: string;
}

export interface RateTier {
  id: string;
  vehicle_id: string;
  days_from: number;
  days_to?: number;
  rate_per_day: number;
}

export interface Customer {
  id: string;
  name: string;
  nic?: string;
  phone?: string;
  phone2?: string;
  email?: string;
  address?: string;
  license_number?: string;
  license_expiry?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Guarantor {
  id: string;
  customer_id?: string;
  customer?: Customer;
  name: string;
  nic?: string;
  phone?: string;
  phone2?: string;
  address?: string;
  relationship?: string;
  notes?: string;
  nic_front_url?: string;
  nic_back_url?: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Rental {
  id: string;
  rental_number: string;
  vehicle_id: string;
  vehicle?: Vehicle;
  customer_id: string;
  customer?: Customer;
  guarantor_id?: string;
  guarantor?: Guarantor;
  created_by?: string;
  created_by_user?: User;
  start_date: string;
  end_date: string;
  actual_return_date?: string;
  pickup_km: number;
  return_km?: number;
  daily_rate: number;
  total_days: number;
  subtotal?: number;
  additional_charges: number;
  discount: number;
  total_amount?: number;
  deposit: number;
  status: RentalStatus;
  payment_status: PaymentStatus;
  pickup_notes?: string;
  return_notes?: string;
  notes?: string;
  exchanges?: VehicleExchange[];
  created_at: string;
  updated_at: string;
}

export interface VehicleExchange {
  id: string;
  rental_id: string;
  old_vehicle_id: string;
  old_vehicle?: Vehicle;
  new_vehicle_id: string;
  new_vehicle?: Vehicle;
  exchange_date: string;
  reason?: string;
  additional_charge: number;
  old_vehicle_km?: number;
  new_vehicle_km?: number;
  approved_by?: string;
  notes?: string;
  created_at: string;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  type: TodoType;
  reference_id?: string;
  is_done: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Dashboard types
export interface DashboardStats {
  activeRentals: number;
  availableVehicles: number;
  bookedVehicles: number;
  inGarageVehicles: number;
  totalVehicles: number;
  todayRevenue: number;
  totalDeposit: number;
  overdueRentals: number;
  completedToday: number;
}

export interface TopVehicle {
  vehicle_id: string;
  reg_number: string;
  brand: string;
  model: string;
  rental_count: number;
  total_revenue: number;
}

export interface TopCustomer {
  customer_id: string;
  name: string;
  phone: string;
  rental_count: number;
  total_spent: number;
}

// Auth
export interface SessionUser {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  email?: string;
}
