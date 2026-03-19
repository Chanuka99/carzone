import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, differenceInDays, isPast, isToday, addDays } from 'date-fns';
import { RateTier } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'LKR'): string {
  return `${currency} ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return '—';
  try {
    return format(new Date(date), 'dd MMM yyyy');
  } catch {
    return '—';
  }
}

export function formatDateShort(date: string | Date | undefined | null): string {
  if (!date) return '—';
  try {
    return format(new Date(date), 'yyyy-MM-dd');
  } catch {
    return '—';
  }
}

export function daysBetween(start: string | Date, end: string | Date): number {
  return differenceInDays(new Date(end), new Date(start));
}

export function isOverdue(endDate: string): boolean {
  return isPast(new Date(endDate)) && !isToday(new Date(endDate));
}

export function isDueToday(date: string): boolean {
  return isToday(new Date(date));
}

export function isDueSoon(date: string, days = 3): boolean {
  const target = new Date(date);
  const soon = addDays(new Date(), days);
  return target <= soon && !isPast(target);
}

export function calculateRentalAmount(
  startDate: string,
  endDate: string,
  dailyRate: number,
  rateTiers?: RateTier[]
): { days: number; rateUsed: number; subtotal: number } {
  const days = daysBetween(startDate, endDate);
  
  let rateUsed = dailyRate;
  
  if (rateTiers && rateTiers.length > 0) {
    // Find applicable tier
    const sortedTiers = [...rateTiers].sort((a, b) => a.days_from - b.days_from);
    for (const tier of sortedTiers) {
      if (days >= tier.days_from && (tier.days_to === null || tier.days_to === undefined || days <= tier.days_to)) {
        rateUsed = tier.rate_per_day;
        break;
      }
    }
  }
  
  return { days, rateUsed, subtotal: days * rateUsed };
}

export function isServiceDue(vehicle: { current_km: number; next_service_km: number; next_service_date?: string | null }): boolean {
  if (vehicle.current_km >= vehicle.next_service_km) return true;
  if (vehicle.next_service_date && isPast(new Date(vehicle.next_service_date))) return true;
  return false;
}

export function isServiceSoon(vehicle: { current_km: number; next_service_km: number; next_service_date?: string | null }, kmThreshold = 500, dayThreshold = 7): boolean {
  if (vehicle.current_km >= vehicle.next_service_km - kmThreshold) return true;
  if (vehicle.next_service_date && isDueSoon(vehicle.next_service_date, dayThreshold)) return true;
  return false;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    available: 'badge-available',
    rented: 'badge-rented',
    active: 'badge-active',
    booked: 'badge-booked',
    in_garage: 'badge-in-garage',
    returned: 'badge-returned',
    overdue: 'badge-overdue',
    cancelled: 'badge-cancelled',
  };
  return map[status] ?? 'badge-returned';
}

export function getStatusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function truncate(text: string, length = 30): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}
