"use client";

import { useState, useCallback, useEffect } from "react";
import { Activity, AlertCircle, ChevronDown, Filter, RefreshCw, Trash2 } from "lucide-react";
import { getActivityLogs, clearActivityLogs } from "@/app/actions/activity";

type LogEntry = {
  id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  action: string;
  module: string;
  entity_id: string | null;
  entity_label: string | null;
  details: string | null;
  created_at: string;
};

type User = { id: string; full_name: string; username: string };

const ACTION_COLORS: Record<string, string> = {
  created: "bg-green-100 text-green-700",
  updated: "bg-blue-100 text-blue-700",
  deleted: "bg-red-100 text-red-700",
  activated: "bg-emerald-100 text-emerald-700",
  deactivated: "bg-orange-100 text-orange-700",
  returned: "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-600",
  status_changed: "bg-yellow-100 text-yellow-700",
  exchanged: "bg-indigo-100 text-indigo-700",
  login: "bg-gray-100 text-gray-600",
  uploaded: "bg-teal-100 text-teal-700",
};

const MODULE_ICONS: Record<string, string> = {
  Vehicles: "🚗",
  Customers: "👤",
  Suppliers: "🏢",
  Guarantors: "🛡️",
  Rentals: "📋",
  Users: "👥",
  Settings: "⚙️",
  Inspections: "🔍",
};

const MODULES = ["all", "Vehicles", "Customers", "Suppliers", "Guarantors", "Rentals", "Users", "Settings"];
const PAGE_SIZE = 20;

function formatTime(isoStr: string) {
  const d = new Date(isoStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffH < 24) return `${diffH}h ago`;
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ActivityLogTab({
  isAdmin,
  users,
}: {
  isAdmin: boolean;
  users: User[];
}) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [moduleFilter, setModuleFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const load = useCallback(
    async (reset = false) => {
      setLoading(true);
      setError(null);
      try {
        const currentPage = reset ? 1 : page;
        const result = await getActivityLogs({
          module: moduleFilter !== "all" ? moduleFilter : undefined,
          userId: isAdmin && userFilter !== "all" ? userFilter : undefined,
          page: currentPage,
          pageSize: PAGE_SIZE,
        });
        if (reset) {
          setLogs(result.data as LogEntry[]);
          setPage(1);
        } else {
          setLogs((prev) => [...prev, ...(result.data as LogEntry[])]);
        }
        setTotal(result.count);
      } catch (e: any) {
        setError(e.message ?? "Failed to load activity log");
      } finally {
        setLoading(false);
      }
    },
    [page, moduleFilter, userFilter, isAdmin]
  );

  // Load on mount and when filters change
  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleFilter, userFilter]);

  const loadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    setLoading(true);
    try {
      const result = await getActivityLogs({
        module: moduleFilter !== "all" ? moduleFilter : undefined,
        userId: isAdmin && userFilter !== "all" ? userFilter : undefined,
        page: nextPage,
        pageSize: PAGE_SIZE,
      });
      setLogs((prev) => [...prev, ...(result.data as LogEntry[])]);
      setTotal(result.count);
    } catch (e: any) {
      setError(e.message ?? "Failed to load more");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    await clearActivityLogs();
    setShowClearConfirm(false);
    load(true);
  };

  const hasMore = logs.length < total;

  return (
    <div className="section-card">
      {/* Header */}
      <div className="section-card-header flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-gray-400" />
          <h2 className="section-card-title">Activity Log</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{total} events</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Module filter */}
          <div className="relative">
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="form-select text-xs h-8 pr-7 pl-2 appearance-none"
            >
              <option value="all">All Modules</option>
              {MODULES.filter((m) => m !== "all").map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
          </div>

          {/* User filter — admins only */}
          {isAdmin && (
            <div className="relative">
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="form-select text-xs h-8 pr-7 pl-2 appearance-none"
              >
                <option value="all">All Users</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name} (@{u.username})</option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
            </div>
          )}

          <button
            onClick={() => load(true)}
            className="btn-secondary text-xs h-8 px-3"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {isAdmin && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="btn-secondary text-xs h-8 px-3 text-red-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200"
              title="Clear all logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Clear confirm banner */}
      {showClearConfirm && (
        <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-center justify-between">
          <p className="text-sm text-red-700 font-medium">Clear all activity logs? This cannot be undone.</p>
          <div className="flex gap-2">
            <button onClick={() => setShowClearConfirm(false)} className="btn-secondary text-xs">Cancel</button>
            <button onClick={handleClear} className="btn-primary text-xs bg-red-600 hover:bg-red-700 border-red-600">Clear All</button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-5 py-4 flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Log entries */}
      {!error && (
        <div className="divide-y divide-gray-50">
          {logs.length === 0 && !loading ? (
            <div className="flex flex-col items-center py-12 text-gray-300">
              <Activity className="w-10 h-10 mb-3" />
              <p className="text-sm text-gray-400">No activity logged yet.</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                {/* Module icon */}
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-base flex-shrink-0 mt-0.5">
                  {MODULE_ICONS[log.module] ?? "📌"}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Action badge */}
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-600"}`}>
                      {log.action.replace("_", " ")}
                    </span>
                    {/* Module */}
                    <span className="text-xs text-gray-500 font-medium">{log.module}</span>
                    {/* Entity */}
                    {log.entity_label && (
                      <span className="text-xs text-gray-700 font-semibold truncate">
                        — {log.entity_label}
                      </span>
                    )}
                  </div>
                  {/* Old → New diff for updates; plain text for others */}
                  {log.action === "updated" && log.details ? (
                    <div className="mt-1.5 space-y-1">
                      {log.details.split(" | ").filter(Boolean).map((change, i) => {
                        const arrowParts = change.split(" → ");
                        if (arrowParts.length === 2) {
                          const colonIdx = arrowParts[0].indexOf(":");
                          const fieldLabel = colonIdx >= 0 ? arrowParts[0].substring(0, colonIdx).trim() : arrowParts[0].trim();
                          const oldVal = colonIdx >= 0 ? arrowParts[0].substring(colonIdx + 1).trim().replace(/^"|"$/g, "") : "—";
                          const newVal = arrowParts[1].trim().replace(/^"|"$/g, "");
                          return (
                            <div key={i} className="flex items-center gap-2 text-xs flex-wrap">
                              <span className="text-gray-500 font-medium">{fieldLabel}:</span>
                              <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded line-through">{oldVal}</span>
                              <span className="text-gray-300">→</span>
                              <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-medium">{newVal}</span>
                            </div>
                          );
                        }
                        return <p key={i} className="text-xs text-gray-400">{change}</p>;
                      })}
                    </div>
                  ) : log.details ? (
                    <p className="text-xs text-gray-400 mt-0.5">{log.details}</p>
                  ) : null}
                  {/* User + time */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">by</span>
                    <span className={`text-xs font-medium ${log.user_role === "admin" ? "text-purple-600" : "text-blue-600"}`}>
                      {log.user_name}
                    </span>
                    {isAdmin && (
                      <span className={`text-[10px] px-1 py-0.5 rounded ${log.user_role === "admin" ? "bg-purple-50 text-purple-500" : "bg-blue-50 text-blue-500"}`}>
                        {log.user_role}
                      </span>
                    )}
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{formatTime(log.created_at)}</span>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="px-5 py-4 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                    <div className="h-2.5 bg-gray-100 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Load more */}
      {hasMore && !loading && (
        <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-400">Showing {logs.length} of {total}</span>
          <button onClick={loadMore} className="btn-secondary text-xs">Load More</button>
        </div>
      )}
    </div>
  );
}
