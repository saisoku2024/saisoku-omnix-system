import React from "react"
import { Users } from "lucide-react"

import { formatCount } from "@/features/dashboard/utils/format"

type Props = {
  customer: number
  newCustomer: number | { total?: number | string | null } | null
  periodLabel: string
}

export default function CustomerSummaryBar({
  customer,
  newCustomer,
  periodLabel
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-[9px] border border-(--c-border) bg-(--c-surface) px-3.5 py-2 text-[11px] text-(--c-muted)">
      <Users size={12} className="flex-shrink-0" />

      <span>
        Customer:{" "}
        <strong className="tabular-nums text-(--c-text)">
          {formatCount(Number(customer) || 0)}
        </strong>
      </span>

      <span className="mx-1.5 opacity-30">|</span>

      <span>
        New:{" "}
        <strong className="tabular-nums text-[#0ea5e9]">
          {formatCount(
            Number(
              typeof newCustomer === "object"
                ? newCustomer?.total
                : newCustomer
            ) || 0
          )}
        </strong>
      </span>

      <span className="ml-auto tabular-nums">
        {periodLabel}
      </span>
    </div>
  )
}
