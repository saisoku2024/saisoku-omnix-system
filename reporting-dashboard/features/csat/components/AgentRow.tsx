export default function AgentRow({
  rank,
  name,
  value,
  valueColor = "#22c55e",
  suffix,
  isLast,
}: {
  rank: number
  name: string
  value: string | number
  valueColor?: string
  suffix?: string
  isLast?: boolean
}) {
  const medals = ["🥇", "🥈", "🥉"]

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 0",
        borderBottom: isLast
          ? "none"
          : "1px solid var(--c-border)",
      }}
    >
      <span
        style={{
          width: 22,
          textAlign: "center",
          fontSize: rank <= 3 ? 14 : 11,
          fontWeight: 700,
          color: "var(--c-muted)",
        }}
      >
        {rank <= 3 ? medals[rank - 1] : rank}
      </span>

      <span
        style={{
          flex: 1,
          fontSize: 12,
          color: "var(--c-text)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </span>

      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
          color: valueColor,
        }}
      >
        {value}
        {suffix}
      </span>
    </div>
  )
}