"use client"

import React from "react"
import { Users, UserPlus } from "lucide-react"

import { formatCount } from "@/features/dashboard/utils/format"

type Props = {
  customer: number
  newCustomer: number | { total?: number | string | null } | null
  periodLabel: string
}

export default function CustomerSummaryBar({
  customer,
  newCustomer,
  periodLabel,
}: Props) {
  const newCount = Number(
    typeof newCustomer === "object" ? newCustomer?.total : newCustomer
  ) || 0

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-slate-900/60 px-4 py-2.5 backdrop-blur-xl shadow-xs">
      <div className="flex items-center gap-4 text-[12px]">
        {/* Total Customers */}
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md border border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
            <Users size={13} />
          </div>
          <span className="text-slate-400">
            Total Customer:{" "}
            <strong className="font-extrabold tabular-nums text-white">
              {formatCount(Number(customer) || 0)}
            </strong>
          </span>
        </div>

        <span className="h-4 w-px bg-white/10" />

        {/* New Customers */}
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
            <UserPlus size={13} />
          </div>
          <span className="text-slate-400">
            Pelanggan Baru:{" "}
            <strong className="font-extrabold tabular-nums text-cyan-400">
              {formatCount(newCount)}
            </strong>
          </span>
        </div>
      </div>

      {/* Period Label Badge */}
      <div className="rounded-full border border-white/8 bg-white/4 px-3 py-0.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
        {periodLabel}
      </div>
    </div>
  )
}
