"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, Lock, Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          detail?: string
        }
        throw new Error(body.detail || `Login failed (${response.status})`)
      }

      const nextPath =
        new URLSearchParams(window.location.search).get("next") || "/dashboard"

      router.replace(nextPath.startsWith("/") ? nextPath : "/dashboard")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#070d19] px-5 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.16),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(34,197,94,0.10),transparent_30%)]" />

      <section className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1524]/95 p-7 shadow-2xl shadow-black/40">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/30">
            <BarChart3 className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
              Insight Workspace
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-normal">
              Admin Login
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Password
            </span>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 focus-within:border-sky-400/70">
              <Lock className="size-4 text-slate-500" />
              <input
                autoFocus
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                placeholder="Masukkan password admin"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </label>

          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200">
              {error}
            </div>
          ) : null}

          <button
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 text-sm font-extrabold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading || !password}
            type="submit"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            Login
          </button>
        </form>
      </section>
    </main>
  )
}
