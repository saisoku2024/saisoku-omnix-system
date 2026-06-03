import React from "react"

type Props = {
  isDark: boolean
}

const ACCENT = "#0ea5e9"

function InsightLogoSmall() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 28 28"
      fill="none"
      className="flex-shrink-0 opacity-40"
    >
      <rect width="28" height="28" rx="7" fill={ACCENT} />
      <rect x="7"  y="16" width="3" height="6"  rx="1.5" fill="white" opacity="0.55" />
      <rect x="12" y="11" width="3" height="11" rx="1.5" fill="white" opacity="0.78" />
      <rect x="17" y="6"  width="3" height="16" rx="1.5" fill="white" />
    </svg>
  )
}

export default function FooterBrand({ isDark }: Props) {
  const base = isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.28)"
  const hi = (t: string) => (
    <span style={{ color: ACCENT, fontWeight: 700 }}>{t}</span>
  )
  const lo = (t: string) => <span style={{ color: base }}>{t}</span>

  return (
    <footer className="flex items-center justify-center gap-2 border-t border-[var(--c-border)] bg-[var(--c-surface)] px-5 py-2.5">
      <InsightLogoSmall />
      <p className="m-0 text-[10px] tracking-wide">
        {hi("I")}{lo("ntegrated mo")}{hi("N")}{lo("itoring ")}
        {hi("S")}{lo("ystem & analyt")}{hi("I")}{lo("cs hi")}
        {hi("G")}{hi("H")}{lo("lig")}{hi("T")}{lo(" Dashboard")}
      </p>
    </footer>
  )
}