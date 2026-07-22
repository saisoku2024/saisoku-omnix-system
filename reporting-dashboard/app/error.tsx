"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangleIcon, RefreshCwIcon, HomeIcon } from "lucide-react"

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log exception for debugging
    console.error("Unhandled Application Error:", error)
  }, [error])

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-(--c-bg) px-4 py-12 text-(--c-text)">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 ring-4 ring-red-500/5">
          <AlertTriangleIcon size={32} />
        </div>

        <p className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-red-400">
          System Error
        </p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Terjadi Kesalahan Sistem
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-(--c-muted)">
          Aplikasi mengalami kendala tak terduga saat memuat halaman ini.
          {error.digest ? (
            <span className="mt-1 block font-mono text-[11px] text-slate-500">
              Error Digest: {error.digest}
            </span>
          ) : null}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-(--c-accent) px-5 text-xs font-bold text-(--c-bg) transition hover:opacity-90"
          >
            <RefreshCwIcon size={14} />
            Coba Lagi
          </button>

          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-(--c-border) bg-(--c-surface) px-5 text-xs font-semibold text-(--c-text) transition hover:bg-(--c-overlay-2)"
          >
            <HomeIcon size={14} />
            Ke Dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
