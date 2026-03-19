import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusColorMap: Record<string, string> = {
  available: "bg-green-50 text-green-700 border border-green-100",
  rented: "bg-blue-50 text-blue-700 border border-blue-100",
  active: "bg-blue-50 text-blue-700 border border-blue-100",
  booked: "bg-amber-50 text-amber-700 border border-amber-100",
  in_garage: "bg-purple-50 text-purple-700 border border-purple-100",
  returned: "bg-gray-100 text-gray-600 border border-gray-200",
  overdue: "bg-red-50 text-red-700 border border-red-100",
  cancelled: "bg-red-50 text-red-400 border border-red-100",
  pending: "bg-gray-100 text-gray-500 border border-gray-200",
  partial: "bg-amber-50 text-amber-600 border border-amber-100",
  paid: "bg-green-50 text-green-700 border border-green-100",
  company: "bg-indigo-50 text-indigo-700 border border-indigo-100",
  supplier: "bg-orange-50 text-orange-700 border border-orange-100",
  admin: "bg-blue-50 text-blue-700 border border-blue-100",
  employee: "bg-gray-100 text-gray-600 border border-gray-200",
};

const statusLabelMap: Record<string, string> = {
  overdue: "Service Overdue",
  in_garage: "In Garage",
  available: "Available",
  rented: "Rented",
  active: "Active",
  booked: "Booked",
  returned: "Returned",
  cancelled: "Cancelled",
  pending: "Pending",
  partial: "Partial",
  paid: "Paid",
  company: "Company",
  supplier: "Supplier",
  admin: "Admin",
  employee: "Employee",
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const key = (status ?? "").toLowerCase();
  const colorClass = statusColorMap[key] ?? "bg-gray-100 text-gray-600 border border-gray-200";
  const label = statusLabelMap[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      colorClass,
      className
    )}>
      {label}
    </span>
  );
}
