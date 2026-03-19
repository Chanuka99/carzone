import { AlertTriangle, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceAlertBadgeProps {
  currentKm: number;
  nextServiceKm: number;
  nextServiceDate?: string | null;
  showOk?: boolean;
}

export default function ServiceAlertBadge({ currentKm, nextServiceKm, nextServiceDate, showOk = false }: ServiceAlertBadgeProps) {
  const kmOverdue = currentKm >= nextServiceKm;
  const dateOverdue = nextServiceDate && new Date(nextServiceDate) < new Date();
  const kmSoon = !kmOverdue && currentKm >= nextServiceKm - 500;
  const dateSoon = !dateOverdue && nextServiceDate && new Date(nextServiceDate) <= new Date(Date.now() + 7 * 86400000);

  if (kmOverdue || dateOverdue) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
        <AlertTriangle className="w-3 h-3" />
        Service Overdue
      </span>
    );
  }

  if (kmSoon || dateSoon) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
        <Wrench className="w-3 h-3" />
        Service Soon
      </span>
    );
  }

  if (showOk) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
        <Wrench className="w-3 h-3" />
        OK
      </span>
    );
  }

  return null;
}
