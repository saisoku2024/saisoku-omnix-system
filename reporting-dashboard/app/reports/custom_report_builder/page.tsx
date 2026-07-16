"use client"

import { 
  FileSpreadsheet, 
  Construction, 
  Clock, 
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"

import Card from "@/components/ui/card"

export default function ReportCenterPage() {
  return (
    <div className="p-5 gap-4 flex flex-col max-w-[1400px] mx-auto">

      {/* HEADER - Tanpa Card Wrapper */}
      <div className="flex items-center justify-between pb-4 border-b border-(--c-border)">
        <div>
          <h1 className="flex items-center gap-3 text-[17px] font-semibold text-(--c-text)">
            <FileSpreadsheet className="h-5 w-5 text-sky-500" />
            Report Center
          </h1>
          <p className="mt-1 text-[12px] text-(--c-muted)">
            Generate and export operational reports in Microsoft Excel format.
          </p>
        </div>

        <Link
          href="/"
          className="flex h-9 items-center gap-2 rounded-lg border border-(--c-border) bg-(--c-control) px-4 text-sm font-medium transition-colors hover:bg-(--c-surface)"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* UNDER CONSTRUCTION CARD */}
      <Card>
        <div className="flex flex-col items-center justify-center gap-5 px-6 py-20 text-center">

          {/* Icon Blob */}
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-sky-500/10">
            <Construction className="h-10 w-10 text-sky-500" strokeWidth={1.75} />
            <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
              <Clock className="h-3.5 w-3.5" />
            </span>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-[17px] font-semibold text-(--c-text)">
              Halaman Ini Sedang Dalam Pengembangan
            </h2>
            <p className="max-w-md text-[13px] leading-relaxed text-(--c-muted)">
              Fitur Report Center sedang kami siapkan agar proses export laporan Digital & Voice Traffic
              jadi lebih cepat dan akurat. Cek kembali dalam waktu dekat.
            </p>
          </div>

          {/* Progress bar dekoratif */}
          <div className="w-full max-w-xs space-y-1.5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-(--c-control)">
              <div className="h-full w-2/3 rounded-full bg-sky-500 transition-all" />
            </div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-(--c-muted)">
              In Progress
            </p>
          </div>

          <Link
            href="/"
            className="mt-2 flex h-9 items-center gap-2 rounded-lg bg-sky-600 px-5 text-sm font-medium text-white transition-colors hover:bg-sky-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Dashboard
          </Link>
        </div>
      </Card>
    </div>
  )
}
