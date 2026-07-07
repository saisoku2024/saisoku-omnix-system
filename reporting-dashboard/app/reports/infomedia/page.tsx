"use client"

import React from "react"
import { useRouter } from "next/navigation"
import {
  Rocket,
  Sparkles,
  ArrowLeft,
} from "lucide-react"

export default function UnderConstructionPage() {
  const router = useRouter()

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-background px-6">

      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[350px] w-[350px] rounded-full bg-violet-500/10 blur-3xl" />

        {/* Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#64748b12_1px,transparent_1px),linear-gradient(to_bottom,#64748b12_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <div className="relative w-full max-w-2xl">

        <div className="rounded-3xl border border-border/60 bg-card/70 p-12 text-center shadow-2xl backdrop-blur-xl">

          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-600 dark:text-sky-400">
            <Sparkles className="h-4 w-4" />
            SAISOKU OMNIX
          </div>

          {/* Icon */}
          <div className="mx-auto mb-8 flex h-28 w-28 animate-pulse items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/25">
            <Rocket className="h-14 w-14 text-white" />
          </div>

          {/* Title */}
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground">
            Under Construction
          </h1>

          {/* Description */}
          <p className="mx-auto mb-10 max-w-xl text-lg leading-8 text-muted-foreground">
            Halaman ini masih dalam tahap pengembangan.
            Kami sedang mempersiapkan pengalaman terbaik untuk
            Dashboard <span className="font-semibold text-sky-500">SAISOKU OMNIX</span>.
            Silakan kembali beberapa saat lagi.
          </p>

          {/* Status */}
          <div className="mx-auto mb-8 flex max-w-sm items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4">
            <div className="mr-3 h-3 w-3 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Development in Progress
            </span>
          </div>

          {/* Button */}
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-3 font-medium text-white transition-all duration-300 hover:-translate-y-1 hover:bg-sky-600 hover:shadow-lg hover:shadow-sky-500/30 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>

        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          © 2026 SAISOKU OMNIX Dashboard
        </p>

      </div>
    </div>
  )
}