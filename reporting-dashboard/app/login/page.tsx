"use client"

import { FormEvent, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  BarChart3,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const canSubmit = useMemo(() => Boolean(password.trim()), [password])

  const submitLogin = async (payload: { email?: string; password?: string; useDemoGuest?: boolean }) => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          detail?: string
        }
        throw new Error(body.detail || `Login gagal (kode ${response.status})`)
      }

      const nextPath =
        new URLSearchParams(window.location.search).get("next") || "/dashboard"

      router.replace(nextPath.startsWith("/") ? nextPath : "/dashboard")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) {
      setError("Password admin wajib diisi.")
      return
    }

    await submitLogin({ email, password })
  }

  const handleDemoLogin = async () => {
    await submitLogin({ useDemoGuest: true })
  }

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#06101b] px-5 py-10 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(14,165,233,0.14),transparent_28%,rgba(2,6,23,0.72)_68%,rgba(34,197,94,0.08))]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] opacity-25" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />

      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0d1626]/95 shadow-2xl shadow-black/45 backdrop-blur md:grid-cols-[1.05fr_0.95fr]">
        <aside className="hidden min-h-[580px] border-r border-white/10 bg-[#081321] p-9 md:flex md:flex-col md:justify-between">
          <div>
            <div className="mb-12 flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-300/30">
                <BarChart3 className="size-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
                  Saisoku Omnix
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Analytics platform
                </p>
              </div>
            </div>

            <p className="max-w-md text-4xl font-semibold leading-tight tracking-normal text-white">
              Welcome back to{" "}
              <span className="text-cyan-300">INSIGHT Workspace</span>{" "}
              Dashboard
            </p>
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">
              Internal Tool for Monitoring & Analytics.
            </p>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                  <ShieldCheck className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Sesi admin terlindungi
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Admin dan demo guest masuk lewat session aman.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="p-7 sm:p-10">
          <div className="mb-9 flex items-center gap-3 md:hidden">
            <div className="flex size-11 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-300/30">
              <BarChart3 className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                Saisoku Omnix
              </p>
              <p className="mt-1 text-sm text-slate-400">Analytics platform</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
            <Sparkles className="size-3.5" />
            Akses admin
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
            Welcome back to INSIGHT Workspace Dashboard
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
            Internal Tool for Monitoring & Analytics.
          </p>

          <form onSubmit={handleSubmit} className="mt-9 space-y-5">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Email
              </span>
              <div className="flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/45 px-4 transition focus-within:border-cyan-300/70 focus-within:bg-slate-950/70 focus-within:ring-4 focus-within:ring-cyan-300/10">
                <Mail className="size-4 text-slate-500" />
                <input
                  autoComplete="email"
                  className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                  placeholder="admin@omnix.com"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Password
              </span>
              <div className="flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/45 px-4 transition focus-within:border-cyan-300/70 focus-within:bg-slate-950/70 focus-within:ring-4 focus-within:ring-cyan-300/10">
                <LockKeyhole className="size-4 text-slate-500" />
                <input
                  autoFocus
                  autoComplete="current-password"
                  className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                  placeholder="Masukkan password admin"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="text-slate-500 transition hover:text-white"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </label>

            {error ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-100">
                {error}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 text-xs font-bold uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-300/15"
            >
              {loading ? "Memproses demo guest..." : "Use demo guest account"}
            </button>

            <button
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 text-sm font-extrabold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading || !canSubmit}
              type="submit"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              {loading ? "Memproses masuk..." : "Masuk ke dashboard"}
              {!loading ? <ArrowRight className="size-4" /> : null}
            </button>
          </form>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-white/10 text-cyan-200">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Akses internal yang aman
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Jika login gagal, periksa environment variable
                  ADMIN_UI_PASSWORD, lalu redeploy ke Vercel setelah
                  perubahan disimpan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
