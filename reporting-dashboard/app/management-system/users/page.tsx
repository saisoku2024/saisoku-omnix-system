"use client"

import { useEffect, useState } from "react"
import {
  CheckCircle2Icon,
  KeyRoundIcon,
  Loader2Icon,
  PlusIcon,
  RefreshCcwIcon,
  ShieldCheckIcon,
  ShieldIcon,
  Trash2Icon,
  UserCheckIcon,
  UserPlusIcon,
  UsersIcon,
  UserXIcon,
} from "lucide-react"

type RoleType = "super_admin" | "manager" | "spv" | "agent" | "guest"
type SessionRole = RoleType | "admin"

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: RoleType
  brand_access: string[]
  created_at?: string
  updated_at?: string
}

const ROLE_BADGE_CONFIG: Record<RoleType, { label: string; colorClass: string }> = {
  super_admin: {
    label: "Super Admin",
    colorClass: "border-purple-500/30 bg-purple-500/10 text-purple-400",
  },
  manager: {
    label: "Manager",
    colorClass: "border-sky-500/30 bg-sky-500/10 text-sky-400",
  },
  spv: {
    label: "Supervisor (SPV)",
    colorClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  },
  agent: {
    label: "Agent CS",
    colorClass: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  },
  guest: {
    label: "Guest (Demo)",
    colorClass: "border-slate-500/30 bg-slate-500/10 text-slate-400",
  },
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Session Role
  const [sessionRole, setSessionRole] = useState<SessionRole | null>(null)
  const isAdmin = sessionRole === "admin" || sessionRole === "super_admin"

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [formEmail, setFormEmail] = useState("")
  const [formPassword, setFormPassword] = useState("")
  const [showModalPassword, setShowModalPassword] = useState(false)
  const [formFullName, setFormFullName] = useState("")
  const [formRole, setFormRole] = useState<RoleType>("agent")
  const [formBrandAccess, setFormBrandAccess] = useState<string>("ALL")

  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%"
    let pass = ""
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormPassword(pass)
    setShowModalPassword(true)
  }

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [editRole, setEditRole] = useState<RoleType>("agent")
  const [editSubmitting, setEditSubmitting] = useState(false)

  // Reset Password Modal State
  const [resetModalUser, setResetModalUser] = useState<UserProfile | null>(null)
  const [resetPasswordInput, setResetPasswordInput] = useState("")
  const [resetSubmitting, setResetSubmitting] = useState(false)
  const [showResetEye, setShowResetEye] = useState(false)

  const generateResetPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%"
    let pass = ""
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setResetPasswordInput(pass)
    setShowResetEye(true)
  }

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) {
      setError("Mode Guest: Reset password dinonaktifkan.")
      return
    }
    if (!resetModalUser || !resetPasswordInput) return

    setResetSubmitting(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await fetch(`/api/backend/admin/users/${resetModalUser.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password: resetPasswordInput }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || data.error || "Gagal me-reset password")
      }

      setSuccessMsg(`Password untuk '${resetModalUser.full_name}' (${resetModalUser.email}) berhasil di-reset ke: ${resetPasswordInput}`)
      setResetModalUser(null)
      setResetPasswordInput("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal me-reset password")
    } finally {
      setResetSubmitting(false)
    }
  }

  useEffect(() => {
    let active = true
    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { role?: SessionRole }) => {
        if (active) setSessionRole(data.role ?? null)
      })
      .catch(() => {
        if (active) setSessionRole(null)
      })
    return () => {
      active = false
    }
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/backend/admin/users", { cache: "no-store" })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Gagal memuat data user")
      }
      const data = await res.json()
      setUsers(data.users || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers()
  }, [])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) {
      setError("Mode Guest (Demo Promosi): Fitur penambahan user baru dinonaktifkan.")
      return
    }

    if (!formEmail || !formPassword || !formFullName) {
      setError("Semua field wajib diisi")
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const selectedBrands = formBrandAccess === "ALL" ? ["ALL"] : [formBrandAccess]
      const res = await fetch("/api/backend/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formEmail,
          password: formPassword,
          full_name: formFullName,
          role: formRole,
          brand_access: selectedBrands,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || data.error || "Gagal membuat user baru")
      }

      setSuccessMsg(`User baru '${formFullName}' (${formRole}) berhasil dibuat! Password: ${formPassword}`)
      setIsModalOpen(false)
      setFormEmail("")
      setFormPassword("")
      setFormFullName("")
      setFormRole("agent")
      setFormBrandAccess("ALL")
      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat user")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) {
      setError("Mode Guest (Demo Promosi): Perubahan role dinonaktifkan.")
      return
    }
    if (!editingUser) return

    setEditSubmitting(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await fetch(`/api/backend/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: editRole,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || data.error || "Gagal memperbarui role")
      }

      setSuccessMsg(`Role untuk '${editingUser.full_name}' berhasil diubah ke ${editRole}`)
      setEditingUser(null)
      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal meng-update role")
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!isAdmin) {
      setError("Mode Guest (Demo Promosi): Penghapusan user dinonaktifkan.")
      return
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus user '${name}'?`)) return

    setError(null)
    setSuccessMsg(null)
    try {
      const res = await fetch(`/api/backend/admin/users/${userId}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || data.error || "Gagal menghapus user")
      }
      setSuccessMsg(`User '${name}' berhasil dihapus.`)
      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus user")
    }
  }

  const superAdminCount = users.filter((u) => u.role === "super_admin").length
  const managerSpvCount = users.filter((u) => u.role === "manager" || u.role === "spv").length
  const agentGuestCount = users.filter((u) => u.role === "agent" || u.role === "guest").length

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
              User & Access Control
            </h1>
            <p className="mt-1 text-sm text-(--c-muted)">
              Kelola kredensial pengguna dan hierarki role (Super Admin, Manager, SPV, Agent, Guest).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={fetchUsers}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-(--c-border) bg-(--c-surface) px-4 text-xs font-semibold text-(--c-text) transition hover:bg-(--c-overlay-2)"
            >
              <RefreshCcwIcon size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              disabled={!isAdmin}
              title={!isAdmin ? "Aksi penambahan user khusus Super Admin" : undefined}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-(--c-accent) px-4 text-xs font-bold text-(--c-bg) shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <UserPlusIcon size={15} />
              {!isAdmin ? "Mode Guest (Read-Only)" : "+ Create New User"}
            </button>
          </div>
        </header>

        {/* Notifications */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            ⚠️ {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">
            <CheckCircle2Icon size={16} />
            {successMsg}
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-(--c-border) bg-(--c-surface) p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-(--c-muted)">Total Users</span>
              <UsersIcon size={18} className="text-(--c-accent)" />
            </div>
            <p className="mt-3 text-3xl font-black">{users.length}</p>
          </div>

          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">Super Admins</span>
              <ShieldCheckIcon size={18} className="text-purple-400" />
            </div>
            <p className="mt-3 text-3xl font-black text-purple-400">{superAdminCount}</p>
          </div>

          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">Manager & SPV</span>
              <UserCheckIcon size={18} className="text-sky-400" />
            </div>
            <p className="mt-3 text-3xl font-black text-sky-400">{managerSpvCount}</p>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Agent & Guest</span>
              <ShieldIcon size={18} className="text-amber-400" />
            </div>
            <p className="mt-3 text-3xl font-black text-amber-400">{agentGuestCount}</p>
          </div>
        </div>

        {/* User Table Card */}
        <section className="rounded-2xl border border-(--c-border) bg-(--c-surface) p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between border-b border-(--c-border) pb-4">
            <h2 className="text-base font-bold text-(--c-text)">User Directory & Access Control</h2>
            <span className="text-xs text-(--c-muted)">Showing {users.length} registered accounts</span>
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center gap-2 text-sm text-(--c-muted)">
              <Loader2Icon className="animate-spin" size={18} />
              Memuat daftar user...
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-sm text-(--c-muted)">
              Belum ada user yang terdaftar di database `profiles`. Klik <strong>+ Create New User</strong> untuk menambahkan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-(--c-border) text-[11px] font-semibold uppercase tracking-wider text-(--c-muted)">
                    <th className="px-4 py-3">User Profile</th>
                    <th className="px-4 py-3">Role Level</th>
                    <th className="px-4 py-3">Created At</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--c-border)">
                  {users.map((u) => {
                    const badge = ROLE_BADGE_CONFIG[u.role] || ROLE_BADGE_CONFIG.guest
                    return (
                      <tr key={u.id} className="transition hover:bg-(--c-overlay-2)/50">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-(--c-text)">{u.full_name || "No Name"}</div>
                          <div className="font-mono text-[11px] text-(--c-muted)">{u.email}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${badge.colorClass}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-(--c-muted)">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString("id-ID") : "-"}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingUser(u)
                                setEditRole(u.role)
                              }}
                              disabled={!isAdmin}
                              className="rounded-lg border border-(--c-border) bg-(--c-overlay) px-2.5 py-1.5 font-semibold text-(--c-text) transition hover:bg-(--c-overlay-2) disabled:opacity-50"
                            >
                              Edit Role
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setResetModalUser(u)
                                setResetPasswordInput("")
                                setShowResetEye(false)
                              }}
                              disabled={!isAdmin}
                              className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1.5 font-semibold text-cyan-400 transition hover:bg-cyan-500/20 disabled:opacity-50"
                              title="Reset Password User"
                            >
                              <KeyRoundIcon size={13} />
                              Reset Pass
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id, u.full_name)}
                              disabled={!isAdmin}
                              className="rounded-lg border border-red-500/20 bg-red-500/10 p-1.5 text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                              title="Delete User"
                            >
                              <Trash2Icon size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Modal Create New User */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl border border-(--c-border) bg-(--c-surface) p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between border-b border-(--c-border) pb-3">
                <h3 className="text-lg font-bold text-(--c-text)">+ Create New User</h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
                <div>
                  <label className="mb-1 block font-semibold text-(--c-muted)">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="h-10 w-full rounded-xl border border-(--c-border) bg-(--c-overlay) px-3 text-xs text-(--c-text) outline-none focus:border-(--c-accent)"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-(--c-muted)">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="nama@company.com"
                    className="h-10 w-full rounded-xl border border-(--c-border) bg-(--c-overlay) px-3 text-xs text-(--c-text) outline-none focus:border-(--c-accent)"
                  />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="font-semibold text-(--c-muted)">Password Initial</label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[10px] font-bold text-(--c-accent) hover:underline"
                    >
                      ⚡ Auto Generate
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type={showModalPassword ? "text" : "password"}
                      required
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="h-10 w-full rounded-xl border border-(--c-border) bg-(--c-overlay) pr-10 pl-3 text-xs text-(--c-text) outline-none focus:border-(--c-accent)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowModalPassword(!showModalPassword)}
                      className="absolute right-3 text-slate-400 hover:text-white"
                    >
                      {showModalPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-(--c-muted)">Role Hierarki</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as RoleType)}
                    className="h-10 w-full rounded-xl border border-(--c-border) bg-(--c-overlay) px-3 text-xs text-(--c-text) outline-none focus:border-(--c-accent)"
                  >
                    <option value="super_admin">Super Admin (Full Access System)</option>
                    <option value="manager">Manager (Executive & Reports Only)</option>
                    <option value="spv">Supervisor / SPV (Team & Upload Access)</option>
                    <option value="agent">Agent CS (Operational & Copilot)</option>
                    <option value="guest">Guest (Interactive Demo Mode)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-(--c-muted)">Brand Access Scope</label>
                  <select
                    value={formBrandAccess}
                    onChange={(e) => setFormBrandAccess(e.target.value)}
                    className="h-10 w-full rounded-xl border border-(--c-border) bg-(--c-overlay) px-3 text-xs text-(--c-text) outline-none focus:border-(--c-accent)"
                  >
                    <option value="ALL">Semua Brand (ALL Access)</option>
                    <option value="Tineco">Tineco Only</option>
                    <option value="Ecovacs">Ecovacs Only</option>
                    <option value="Yoniev">Yoniev Only</option>
                    <option value="Laifen">Laifen Only</option>
                    <option value="Usmile">Usmile Only</option>
                  </select>
                </div>

                <div className="mt-6 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-(--c-border) px-4 py-2 text-xs font-semibold hover:bg-(--c-overlay)"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-(--c-accent) px-5 py-2 text-xs font-bold text-(--c-bg) hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? <Loader2Icon size={14} className="animate-spin" /> : null}
                    Simpan User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Edit Role */}
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl border border-(--c-border) bg-(--c-surface) p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between border-b border-(--c-border) pb-3">
                <h3 className="text-lg font-bold text-(--c-text)">Edit Role User</h3>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateRole} className="space-y-4 text-xs">
                <div>
                  <span className="block text-(--c-muted)">User:</span>
                  <strong className="text-sm text-(--c-text)">{editingUser.full_name}</strong> ({editingUser.email})
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-(--c-muted)">Pilih Role Baru</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as RoleType)}
                    className="h-10 w-full rounded-xl border border-(--c-border) bg-(--c-overlay) px-3 text-xs text-(--c-text) outline-none focus:border-(--c-accent)"
                  >
                    <option value="super_admin">Super Admin (Full Access System)</option>
                    <option value="manager">Manager (Executive & Reports Only)</option>
                    <option value="spv">Supervisor / SPV (Team & Upload Access)</option>
                    <option value="agent">Agent CS (Operational & Copilot)</option>
                    <option value="guest">Guest (Interactive Demo Mode)</option>
                  </select>
                </div>

                <div className="mt-6 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="rounded-xl border border-(--c-border) px-4 py-2 text-xs font-semibold hover:bg-(--c-overlay)"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-(--c-accent) px-5 py-2 text-xs font-bold text-(--c-bg) hover:opacity-90 disabled:opacity-50"
                  >
                    {editSubmitting ? <Loader2Icon size={14} className="animate-spin" /> : null}
                    Update Role
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Admin Reset Password */}
        {resetModalUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl border border-(--c-border) bg-(--c-surface) p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between border-b border-(--c-border) pb-3">
                <h3 className="text-lg font-bold text-(--c-text)">🔑 Reset Password User</h3>
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
                <div>
                  <span className="block text-(--c-muted)">Target User:</span>
                  <strong className="text-sm text-(--c-text)">{resetModalUser.full_name}</strong> ({resetModalUser.email})
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="font-semibold text-(--c-muted)">Password Baru</label>
                    <button
                      type="button"
                      onClick={generateResetPassword}
                      className="text-[10px] font-bold text-(--c-accent) hover:underline"
                    >
                      ⚡ Auto Generate
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type={showResetEye ? "text" : "password"}
                      required
                      value={resetPasswordInput}
                      onChange={(e) => setResetPasswordInput(e.target.value)}
                      placeholder="Masukkan password baru"
                      className="h-10 w-full rounded-xl border border-(--c-border) bg-(--c-overlay) pr-10 pl-3 text-xs text-(--c-text) outline-none focus:border-(--c-accent)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetEye(!showResetEye)}
                      className="absolute right-3 text-slate-400 hover:text-white"
                    >
                      {showResetEye ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetModalUser(null)}
                    className="rounded-xl border border-(--c-border) px-4 py-2 text-xs font-semibold hover:bg-(--c-overlay)"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={resetSubmitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2 text-xs font-bold text-slate-950 hover:opacity-90 disabled:opacity-50"
                  >
                    {resetSubmitting ? <Loader2Icon size={14} className="animate-spin" /> : null}
                    Reset Password Now
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

