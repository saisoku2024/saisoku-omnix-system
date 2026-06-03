export default function CardHeader({
  title,
  badge,
  extra,
}: {
  title: string
  badge?: string
  extra?: React.ReactNode
}) {
  return (
    <div
      style={{
        padding: "12px 16px",
        borderBottom: "1px solid var(--c-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        minHeight: 44,
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 0.2,
          color: "var(--c-text)",
        }}
      >
        {title}
      </span>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {extra}

        {badge && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: 0.5,
              padding: "3px 9px",
              borderRadius: 99,
              background: "rgba(34,197,94,0.12)",
              color: "#22c55e",
              border: "1px solid rgba(34,197,94,0.2)",
            }}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  )
}