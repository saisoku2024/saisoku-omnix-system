import React from "react"

import Card from "@/components/ui/card"

import CardHeader from "@/features/voice/components/CardHeader"
import AgentRow from "@/features/voice/components/AgentRow"
import AgentRowSkeleton from "@/features/voice/components/AgentRowSkeleton"
import EmptyState from "@/features/voice/components/EmptyState"

type AgentItem = {
  agent: string
  /** Boleh angka (handling count) atau string sudah-terformat (AHT/AWT) */
  value: string | number
}

type Props = {
  title: string
  data: AgentItem[]
  loading: boolean
  /** Suffix untuk tiap row, mis. " calls" */
  suffix?: string
  /** Warna value, default ikut text */
  valueColor?: string
  /** Max baris yang ditampilkan */
  limit?: number
  /** Pesan jika data kosong */
  emptyMessage?: string
  /** Formatter angka (untuk total calls dll). Tidak dipakai jika value string. */
  formatValue?: (v: number) => string
}

const SKELETON_ROWS = Array.from({ length: 5 })

export default function AgentLeaderboard({
  title,
  data,
  loading,
  suffix,
  valueColor,
  limit = 5,
  emptyMessage = "No agent data",
  formatValue,
}: Props) {
  const rows = data?.slice(0, limit) ?? []
  const hasData = rows.length > 0

  return (
    <Card>
      <CardHeader title={title} />

      <div className="px-[18px] pb-3.5 pt-1">
        {loading ? (
          SKELETON_ROWS.map((_, i) => <AgentRowSkeleton key={i} />)
        ) : hasData ? (
          rows.map((agent, i) => {
            const display =
              typeof agent.value === "number" && formatValue
                ? formatValue(agent.value)
                : agent.value

            return (
              <AgentRow
                key={agent.agent}
                rank={i + 1}
                name={agent.agent}
                value={display}
                suffix={suffix}
                valueColor={valueColor}
                isLast={i === rows.length - 1}
              />
            )
          })
        ) : (
          <EmptyState message={emptyMessage} />
        )}
      </div>
    </Card>
  )
}
