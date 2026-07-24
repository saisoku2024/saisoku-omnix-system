"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

const INSIGHT_STEPS = [
  { letter: "I", title: "Initializing Security Context..." },
  { letter: "N", title: "Network & RBAC Encryption Verified" },
  { letter: "S", title: "Securing Session Token" },
  { letter: "I", title: "Identity & Profile Authenticated" },
  { letter: "G", title: "Gathering Omnichannel Telemetry" },
  { letter: "H", title: "Hyper-scale Data Engine Ready" },
  { letter: "T", title: "Transferring to INSIGHT Dashboard" },
]

function InsightIntroOverlay({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < INSIGHT_STEPS.length - 1) {
          return prev + 1
        }
        clearInterval(interval)
        setTimeout(onComplete, 500)
        return prev
      })
    }, 500)

    return () => clearInterval(interval)
  }, [onComplete])

  const progressPercent = Math.round(((currentStep + 1) / INSIGHT_STEPS.length) * 100)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712]/92 p-4 backdrop-blur-2xl animate-in fade-in duration-300">
      {/* Background Ambient Glow */}
      <div className="pointer-events-none absolute size-96 rounded-full bg-cyan-500/20 blur-[130px]" />
      <div className="pointer-events-none absolute size-80 rounded-full bg-emerald-500/15 blur-[110px]" />

      {/* Cyber Glass Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-[#091322]/95 p-6 sm:p-7 shadow-[0_0_90px_rgba(6,182,212,0.25)] backdrop-blur-xl">
        {/* Top Glow Progress Line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/40">
              <BarChart3 className="size-5" />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white">
                INSIGHT TELEMETRY
              </p>
              <p className="text-[10px] font-mono text-cyan-300">AUTHENTICATING SESSION</p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-emerald-400">
            {progressPercent}%
          </span>
        </div>

        {/* Vertical INSIGHT Letters Scan List */}
        <div className="mt-4 space-y-2">
          {INSIGHT_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStep
            const isCurrent = idx === currentStep

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 rounded-xl border p-2.5 transition-all duration-200 ${
                  isCurrent
                    ? "border-cyan-400/80 bg-cyan-500/15 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)] scale-[1.02]"
                    : isCompleted
                    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
                    : "border-white/5 bg-slate-950/40 text-slate-500 opacity-40"
                }`}
              >
                {/* Vertical Letter Badge */}
                <div
                  className={`flex size-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-black transition-all ${
                    isCurrent
                      ? "bg-gradient-to-br from-cyan-400 to-teal-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                      : isCompleted
                      ? "bg-emerald-400/20 text-emerald-300 ring-1 ring-emerald-400/40"
                      : "bg-white/5 text-slate-500"
                  }`}
                >
                  {step.letter}
                </div>

                {/* Step Title */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{step.title}</p>
                </div>

                {/* Status Indicator */}
                {isCompleted ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="size-4 shrink-0 animate-spin text-cyan-300" />
                ) : (
                  <div className="size-2 shrink-0 rounded-full bg-slate-700" />
                )}
              </div>
            )
          })}
        </div>

        {/* Footer Scan Status */}
        <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/10 text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <Activity className="size-3 text-cyan-400 animate-pulse" />
            Scanning System Layers
          </span>
          <span className="text-cyan-300 font-semibold">SECURE ACCESS</span>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showIntro, setShowIntro] = useState(false)
  const [pendingNextPath, setPendingNextPath] = useState("/dashboard")

  const canSubmit = useMemo(() => Boolean(password.trim()), [password])

  const handleIntroComplete = () => {
    router.replace(pendingNextPath.startsWith("/") ? pendingNextPath : "/dashboard")
    router.refresh()
  }

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
        throw new Error(body.detail || `Sign in failed (code ${response.status})`)
      }

      const nextPath =
        new URLSearchParams(window.location.search).get("next") || "/dashboard"

      setPendingNextPath(nextPath)
      setShowIntro(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed. Please try again.")
      setLoading(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) {
      setError("Password is required.")
      return
    }

    await submitLogin({ email, password })
  }

  const handleDemoLogin = async () => {
    await submitLogin({ useDemoGuest: true })
  }

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#040914] p-4 text-white selection:bg-cyan-500 selection:text-slate-950 sm:p-6 md:p-8">
      {/* INSIGHT Telemetry Scan Animation Overlay */}
      {showIntro ? <InsightIntroOverlay onComplete={handleIntroComplete} /> : null}

      {/* Dynamic Ambient Glowing Mesh Background */}
      <div className="pointer-events-none absolute -top-40 -left-40 size-96 rounded-full bg-cyan-500/15 blur-[128px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 size-[500px] rounded-full bg-emerald-500/10 blur-[140px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-[160px]" />

      {/* Cyber Grid Background Effect */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40" />

      {/* Top Ambient Glow Border */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

      {/* Glassmorphic Container Card (Balanced 50/50 Grid Ratio) */}
      <section className="relative grid w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/15 bg-[#091322]/90 shadow-[0_0_80px_-15px_rgba(14,165,233,0.18)] backdrop-blur-2xl md:grid-cols-2">
        
        {/* LEFT PANEL — Hero Branding & Overview */}
        <aside className="relative hidden flex-col justify-between border-r border-white/10 bg-[radial-gradient(ellipse_at_top_left,rgba(14,165,233,0.12),rgba(8,18,34,0.95)_70%)] p-8 lg:p-9 md:flex">
          <div>
            {/* Brand Logo Header */}
            <div className="mb-8 flex items-center gap-3">
              <div className="relative flex size-11 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/40 shadow-[0_0_18px_rgba(6,182,212,0.22)]">
                <BarChart3 className="size-5.5" />
                <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-emerald-400 ring-4 ring-[#091322] animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-white">
                  INSIGHT OMNIX
                </p>
                <p className="text-[11px] font-medium text-cyan-300/80">
                  Enterprise Analytics & Monitoring Platform
                </p>
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl font-bold leading-snug tracking-tight text-white lg:text-3xl">
              Unified Workspace for{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent">
                Customer Operations
              </span>{" "}
              & Analytics
            </h1>

            {/* Description */}
            <p className="mt-3.5 text-xs leading-relaxed text-slate-300/80 lg:text-sm">
              Monitor customer interactions, operational performance, and business intelligence through a centralized, secure analytics workspace.
            </p>

            {/* Live System Status Widget */}
            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <Activity className="size-3.5 text-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                    System Telemetry
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  Operational
                </span>
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-[11px] text-slate-400">Omnichannel Sync</p>
                  <p className="font-mono text-xs font-semibold text-cyan-200">Active • 99.98%</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">RAG Knowledge Base</p>
                  <p className="font-mono text-xs font-semibold text-emerald-300">Ready & Indexed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Card */}
          <div className="mt-6 rounded-xl border border-white/10 bg-slate-950/40 p-3.5 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20">
                <ShieldCheck className="size-4.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  🔒 Secure Administrator Session
                </p>
                <p className="text-[11px] text-slate-400">
                  Encrypted authentication and protected RBAC policies enabled.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT PANEL — Sign In Form */}
        <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-9">
          <div>
            {/* Mobile Brand Header */}
            <div className="mb-6 flex items-center gap-3 md:hidden">
              <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-300/30">
                <BarChart3 className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-white">
                  INSIGHT OMNIX
                </p>
                <p className="text-[11px] text-cyan-300/80">
                  Enterprise Analytics & Monitoring Platform
                </p>
              </div>
            </div>

            {/* Top Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.12)]">
              <Sparkles className="size-3 text-cyan-300" />
              ✨ Authorized Personnel Only
            </div>

            {/* Form Title */}
            <h2 className="mt-3.5 text-xl font-bold tracking-tight text-white sm:text-2xl">
              Sign in to INSIGHT Workspace
            </h2>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Email Field */}
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-300">
                  Email Address
                </span>
                <div className="flex h-12 items-center gap-2.5 rounded-xl border border-white/15 bg-slate-950/60 px-3.5 transition duration-200 focus-within:border-cyan-400 focus-within:bg-slate-950/90 focus-within:ring-4 focus-within:ring-cyan-400/15">
                  <Mail className="size-4 text-slate-400" />
                  <input
                    autoComplete="email"
                    className="h-full w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-500 sm:text-sm"
                    placeholder="Enter your email address"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </label>

              {/* Password Field */}
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-300">
                  Password
                </span>
                <div className="flex h-12 items-center gap-2.5 rounded-xl border border-white/15 bg-slate-950/60 px-3.5 transition duration-200 focus-within:border-cyan-400 focus-within:bg-slate-950/90 focus-within:ring-4 focus-within:ring-cyan-400/15">
                  <LockKeyhole className="size-4 text-slate-400" />
                  <input
                    autoFocus
                    autoComplete="current-password"
                    className="h-full w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-500 sm:text-sm"
                    placeholder="Enter your password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="text-slate-400 transition hover:text-white"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </label>

              {/* Error Message Alert */}
              {error ? (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-xs font-medium text-red-200 backdrop-blur-md">
                  {error}
                </div>
              ) : null}

              {/* Demo Guest Quick Access */}
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 text-xs font-bold uppercase tracking-[0.12em] text-cyan-200 backdrop-blur-md transition duration-200 hover:border-cyan-300/50 hover:bg-cyan-300/20 active:scale-[0.99]"
              >
                {loading ? "Processing Demo Guest..." : "Continue as Demo User"}
              </button>

              {/* Primary Sign In Button */}
              <button
                className="group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 px-5 text-xs font-extrabold text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition duration-200 hover:from-cyan-300 hover:to-teal-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.45)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
                disabled={loading || !canSubmit}
                type="submit"
              >
                {loading ? <Loader2 className="size-4 animate-spin text-slate-950" /> : null}
                <span>{loading ? "Signing in..." : "Sign In to Dashboard"}</span>
                {!loading ? (
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                ) : null}
              </button>
            </form>
          </div>

          {/* Footer Security Note */}
          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center text-[11px] leading-relaxed text-slate-400">
            Internal & Protected System Access. Unauthorized access attempts are monitored and logged.
          </div>
        </div>
      </section>
    </main>
  )
}

