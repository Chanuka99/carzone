"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Car,
  Users,
  Package,
  Shield,
  CalendarDays,
  FileText,
  Settings,
  UserCog,
  LogOut,
  Banknote,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { SessionUser } from "@/types";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/vehicles", icon: Car, label: "Vehicles" },
  { href: "/suppliers", icon: Package, label: "Suppliers" },
  { href: "/customers", icon: Users, label: "Customers" },
  { href: "/guarantors", icon: Shield, label: "Guarantors" },
  { href: "/rentals", icon: CalendarDays, label: "Rentals" },
  { href: "/refundable-deposits", icon: Banknote, label: "Refundable Deposits" },
  { href: "/calendar", icon: CalendarDays, label: "Calendar" },
  { href: "/agreements", icon: FileText, label: "Agreements" },
];

// Admin-only nav (Users management + company settings)
const adminItems = [
  { href: "/users", icon: UserCog, label: "Users" },
  { href: "/settings", icon: Settings, label: "Company" },
];

// Employee nav items (non-admin only gets activity log)
// We reuse /users which shows only their own activity for non-admins

interface SidebarProps {
  user: SessionUser;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-[256px] bg-white border-r border-gray-100 flex flex-col z-30">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <p className="text-base font-bold text-gray-900 leading-tight">CarZone</p>
        <p className="text-xs text-gray-400 mt-0.5">Fleet Management</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar">
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn("sidebar-link", isActive(item.href) && "active")}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {user.role === "admin" ? (
          <>
            <div className="mt-4 mb-1 px-3">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Admin</p>
            </div>
            <div className="space-y-0.5">
              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn("sidebar-link", isActive(item.href) && "active")}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mt-4 mb-1 px-3">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">My Account</p>
            </div>
            <div className="space-y-0.5">
              <Link
                href="/users"
                className={cn("sidebar-link", isActive("/users") && "active")}
              >
                <UserCog className="w-4 h-4 flex-shrink-0" />
                <span>Activity Log</span>
              </Link>
            </div>
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-gray-100">
        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-1">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-blue-700">
              {user.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
            <p className="text-[11px] text-gray-400 capitalize">{user.role}</p>
          </div>
        </div>
        {/* Sign out */}
        <form action={logoutAction}>
          <button type="submit" className="sidebar-link text-red-500 hover:bg-red-50 hover:text-red-600 w-full">
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
