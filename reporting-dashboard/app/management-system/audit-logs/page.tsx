"use client"

import { useEffect, useState } from "react"
import {
  ActivityIcon,
  ClockIcon,
  FileSpreadsheetIcon,
  FilterIcon,
  InfoIcon,
  Loader2Icon,
  LogInIcon,
  LogOutIcon,
  RefreshCcwIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UploadIcon,
  UserPlusIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

type AuditLogDetails = Record<string, unknown>

interface AuditLog {
  id: string
  user_email: string
  user_role: string
  action: string
  resource: string
  details: AuditLogDetails
  created_at: string
}

const ACTION_CONFIG: Record<string, { label: string; colorClass: string; icon: LucideIcon }> = {
  USER_LOGIN: {
    label: "User Login",
    colorClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    icon: LogInIcon,
  },
  USER_LOGOUT: {
    label: "User Logout",
    colorClass: "border-slate-500/30 bg-slate-500/10 text-slate-400",
    icon: LogOutIcon,
  },
  DATA_UPLOAD: {
    label: "Data Upload",
    colorClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    icon: UploadIcon,
  },
  UPLOAD_DATA: {
    label: "Data Upload",
    colorClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    icon: UploadIcon,
  },
  EXPORT_REPORT: {
    label: "Download / Export Report",
    colorClass: "border-indigo-500/30 bg-indigo-500/10 text-indigo-400",
    icon: FileSpreadsheetIcon,
  },
  USER_CREATED: {
    label: "Create User",
    colorClass: "border-sky-500/30 bg-sky-500/10 text-sky-400",
    icon: UserPlusIcon,
  },
  USER_ROLE_UPDATED: {
    label: "Update Role",
    colorClass: "border-purple-500/30 bg-purple-500/10 text-purple-400",
    icon: UsersIcon,
  },
  USER_DELETED: {
    label: "Delete User",
    colorClass: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    icon: Trash2Icon,
  },
  SOFT_DELETE: {
    label: "Soft Delete",
    colorClass: "border-red-500/30 bg-red-500/10 text-red-400",
    icon: Trash2Icon,
  },
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAction, setSelectedAction] = useState<string>("ALL")
  const [activeLogModal, setActiveLogModal] = useState<AuditLog | null>(null)

  const fetchLogs = async (actionFilter?: string) => {
    setLoading(true)
    setError(null)
    try {
      const url = actionFilter && actionFilter !== "ALL"
        ? `/api/backend/admin/audit-logs?action=${actionFilter}`
        : "/api/backend/admin/audit-logs"

      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Gagal memuat log audit")
      }
      const data = await res.json()
      setLogs(data.logs || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading audit logs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLogs(selectedAction)
  }, [selectedAction])

  // Explicitly sort logs by timestamp: NEWEST FIRST (New to Old)
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const uploadLogsCount = logs.filter((l) => l.action === "UPLOAD_DATA" || l.action === "DATA_UPLOAD").length
  const deleteLogsCount = logs.filter((l) => l.action === "SOFT_DELETE").length
  const userAdminLogsCount = logs.filter((l) => l.action.startsWith("USER_")).length

  return (
    <main className="min-h-screen bg-(--c-bg) px-4 py-8 text-(--c-text) sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-(--c-accent)">
              Management System
            </p>
            <h1 className="mt-2 bg-linear-to-br from-(--c-text) via-(--c-text) to-(--c-accent) bg-clip-text font-(family-name:--app-font-heading) text-3xl font-extrabold tracking-normal text-transparent sm:text-4xl">
              Audit Logs & Activity
            </h1>
            <p className="mt-1 text-sm text-(--c-muted)">
              Pencatatan real-time seluruh aktivitas sistem (Login, Logout, Create User, Upload, & Download Report).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => fetchLogs(selectedAction)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-(--c-border) bg-(--c-surface) px-4 text-xs font-semibold text-(--c-text) transition hover:bg-(--c-overlay-2)"
            >
              <RefreshCcwIcon size={14} className={loading ? "animate-spin" : ""} />
              Refresh Logs
            </button>
          </div>
        </header>

        {/* Notifications */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            ⚠️ {error}
          </div>
        )}

        {/* Metric Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-(--c-border) bg-(--c-surface) p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-(--c-muted)">Total Logs Captured</span>
              <ActivityIcon size={18} className="text-(--c-accent)" />
            </div>
            <p className="mt-3 text-3xl font-black">{logs.length}</p>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Upload Actions</span>
              <UploadIcon size={18} className="text-emerald-400" />
            </div>
            <p className="mt-3 text-3xl font-black text-emerald-400">{uploadLogsCount}</p>
          </div>

          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-red-400">Soft Delete Actions</span>
              <Trash2Icon size={18} className="text-red-400" />
            </div>
            <p className="mt-3 text-3xl font-black text-red-400">{deleteLogsCount}</p>
          </div>

          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">User & Auth Actions</span>
              <ShieldCheckIcon size={18} className="text-sky-400" />
            </div>
            <p className="mt-3 text-3xl font-black text-sky-400">{userAdminLogsCount}</p>
          </div>
        </div>

        {/* Logs Table Card */}
        <section className="rounded-2xl border border-(--c-border) bg-(--c-surface) p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-col gap-3 border-b border-(--c-border) pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <ClockIcon size={16} className="text-(--c-accent)" />
              <h2 className="text-base font-bold text-(--c-text)">System Activity Log History</h2>
            </div>

            {/* Filter Action */}
            <div className="flex items-center gap-2">
              <FilterIcon size={14} className="text-(--c-muted)" />
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="h-9 rounded-xl border border-(--c-border) bg-(--c-overlay) px-3 text-xs text-(--c-text) outline-none focus:border-(--c-accent)"
              >
                <option value="ALL">All Action Types</option>
                <option value="USER_LOGIN">User Login</option>
                <option value="USER_LOGOUT">User Logout</option>
                <option value="DATA_UPLOAD">Data Upload</option>
                <option value="EXPORT_REPORT">Download / Export Report</option>
                <option value="USER_CREATED">Create User</option>
                <option value="USER_ROLE_UPDATED">Update Role</option>
                <option value="USER_DELETED">Delete User</option>
                <option value="SOFT_DELETE">Soft Delete</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center gap-2 text-sm text-(--c-muted)">
              <Loader2Icon className="animate-spin" size={18} />
              Memuat log aktivitas...
            </div>
          ) : sortedLogs.length === 0 ? (
            <div className="py-12 text-center text-sm text-(--c-muted)">
              Belum ada log aktivitas yang tercatat untuk filter ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-(--c-border) text-[11px] font-semibold uppercase tracking-wider text-(--c-muted)">
                    <th className="px-4 py-3">Timestamp (WIB)</th>
                    <th className="px-4 py-3">Actor / User</th>
                    <th className="px-4 py-3">Action Performed</th>
                    <th className="px-4 py-3">Resource Target</th>
                    <th className="px-4 py-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--c-border)">
                  {sortedLogs.map((log) => {
                    const actionCfg = ACTION_CONFIG[log.action] || {
                      label: log.action,
                      colorClass: "border-slate-500/30 bg-slate-500/10 text-slate-400",
                      icon: InfoIcon,
                    }
                    const IconComp = actionCfg.icon

                    return (
                      <tr key={log.id} className="transition hover:bg-(--c-overlay-2)/50">
                        <td className="px-4 py-3.5 font-mono text-(--c-muted)">
                          {log.created_at ? new Date(log.created_at).toLocaleString("id-ID") : "-"}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-(--c-text)">{log.user_email}</div>
                          <span className="text-[10px] uppercase tracking-wider text-(--c-muted)">
                            {log.user_role}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${actionCfg.colorClass}`}
                          >
                            <IconComp size={12} />
                            {actionCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-(--c-text-soft)">
                          {log.resource}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => setActiveLogModal(log)}
                            className="rounded-lg border border-(--c-border) bg-(--c-overlay) px-2.5 py-1 font-semibold text-(--c-text) transition hover:bg-(--c-overlay-2)"
                          >
                            View Payload
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Modal Payload View */}
        {activeLogModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-2xl border border-(--c-border) bg-(--c-surface) p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between border-b border-(--c-border) pb-3">
                <h3 className="text-base font-bold text-(--c-text)">Audit Log Payload Detail</h3>
                <button
                  type="button"
                  onClick={() => setActiveLogModal(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-(--c-border) pb-2">
                  <span className="text-(--c-muted)">Action ID:</span>
                  <span className="font-mono text-(--c-text)">{activeLogModal.id}</span>
                </div>
                <div className="flex justify-between border-b border-(--c-border) pb-2">
                  <span className="text-(--c-muted)">Action Type:</span>
                  <span className="font-bold text-(--c-accent)">{activeLogModal.action}</span>
                </div>
                <div className="flex justify-between border-b border-(--c-border) pb-2">
                  <span className="text-(--c-muted)">Resource:</span>
                  <span className="font-mono text-(--c-text)">{activeLogModal.resource}</span>
                </div>

                <div>
                  <span className="mb-1 block font-semibold text-(--c-muted)">Payload JSON Details:</span>
                  <pre className="max-h-60 overflow-y-auto rounded-xl border border-(--c-border) bg-slate-950 p-3 font-mono text-[11px] text-emerald-400">
                    {JSON.stringify(activeLogModal.details, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveLogModal(null)}
                  className="rounded-xl bg-(--c-accent) px-5 py-2 text-xs font-bold text-(--c-bg)"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
