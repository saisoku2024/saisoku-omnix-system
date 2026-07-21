"use client"

import { useEffect, useState } from "react"

import { apiUrl } from "@/lib/api"

const IconTicket = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
    <path d="M13 5v2M13 17v2M13 11v2" />
  </svg>
)

const IconStar = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const IconPercent = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="5" x2="5" y2="19" />
    <circle cx="6.5" cy="6.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
)

const IconDownload = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const IconSpinner = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
)

const KPI_CONFIG = [
  {
    key: "total_ticket",
    label: "Total Ticket",
    icon: <IconTicket />,
    accent: "#22d3ee",
    glow: "rgba(34,211,238,0.10)",
  },
  {
    key: "csat_response",
    label: "CSAT Response",
    icon: <IconStar />,
    accent: "#a78bfa",
    glow: "rgba(167,139,250,0.10)",
  },
  {
    key: "response_rate",
    label: "Response Rate",
    icon: <IconPercent />,
    accent: "#f59e0b",
    glow: "rgba(245,158,11,0.10)",
  },
] as const

interface KpiData {
  total_ticket: number | null
  csat_response: number | null
  response_rate: string | null
}

const EMPTY: KpiData = {
  total_ticket: null,
  csat_response: null,
  response_rate: null,
}

const EMPTY_KPI_TEXT = "-"

function getFilenameFromHeader(header: string | null, fallback: string): string {
  if (!header) {
    return fallback
  }

  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1])
  }

  const asciiMatch = header.match(/filename="([^"]+)"/i)
  if (asciiMatch?.[1]) {
    return asciiMatch[1]
  }

  return fallback
}

function formatKpi(key: string, data: KpiData): string {
  if (key === "total_ticket") {
    return data.total_ticket != null
      ? data.total_ticket.toLocaleString("id-ID")
      : EMPTY_KPI_TEXT
  }

  if (key === "csat_response") {
    return data.csat_response != null
      ? data.csat_response.toLocaleString("id-ID")
      : EMPTY_KPI_TEXT
  }

  if (key === "response_rate") {
    return data.response_rate ?? EMPTY_KPI_TEXT
  }

  return EMPTY_KPI_TEXT
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function getCurrentMonthDateRange() {
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)

  return {
    start: formatDateInput(firstDay),
    end: formatDateInput(today),
  }
}

export default function PrincipalReportPage() {
  const [startDate, setStartDate] = useState(
    () => getCurrentMonthDateRange().start
  )
  const [endDate, setEndDate] = useState(
    () => getCurrentMonthDateRange().end
  )
  const [kpi, setKpi] = useState<KpiData>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [sessionRole, setSessionRole] = useState<"admin" | "guest" | null>(null)
  const isAdmin = sessionRole === "admin"

  useEffect(() => {
    let active = true
    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { role?: "admin" | "guest" }) => {
        if (active) setSessionRole(data.role ?? null)
      })
      .catch(() => {
        if (active) setSessionRole(null)
      })
    return () => {
      active = false
    }
  }, [])

  const principalApi = apiUrl("/api/principal-report")

  const validateDates = () => {
    if (startDate > endDate) {
      setError("Start date tidak boleh lebih besar dari end date")
      return false
    }

    return true
  }

  const generate = async () => {
    if (!validateDates()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `${principalApi}/summary?start_date=${startDate}&end_date=${endDate}`
      )

      if (!res.ok) {
        throw new Error(`Server error ${res.status}`)
      }

      const json = await res.json()
      setKpi({
        total_ticket: json.total_ticket ?? null,
        csat_response: json.csat_response ?? null,
        response_rate: json.response_rate ?? null,
      })
      setGenerated(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch")
    } finally {
      setLoading(false)
    }
  }

  const exportExcel = async () => {
    if (!isAdmin) {
      setError("Aksi ekspor khusus untuk role Admin (Mode Guest: Read-Only).")
      return
    }

    if (!validateDates()) return

    setExporting(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/backend/principal-report/export?start_date=${startDate}&end_date=${endDate}`
      )

      if (!res.ok) {
        throw new Error(`Server error ${res.status}`)
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")

      link.href = url
      link.download = getFilenameFromHeader(
        res.headers.get("Content-Disposition"),
        `principal_report_${startDate}_${endDate}.xlsx`
      )

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Export failed")
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <style>{`.pr-root{min-height:100%;padding:32px 16px 48px;font-family:var(--app-font-sans)}@media (min-width:640px){.pr-root{padding:40px 24px 64px}}@media (min-width:1024px){.pr-root{padding:48px 32px 80px}}.pr-wrapper{max-width:1400px;margin:0 auto}.pr-header{text-align:center;margin-bottom:40px}.pr-eyebrow{font-family:var(--app-font-mono);font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#22d3ee;margin:0 0 10px}.pr-title{font-family:var(--app-font-heading);font-size:clamp(28px,5vw,44px);font-weight:800;letter-spacing:-.025em;line-height:1.1;margin:0 0 10px;background:linear-gradient(135deg,#f1f5f9 30%,#22d3ee 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}.pr-subtitle{color:#475569;font-size:13px;margin:0;letter-spacing:.01em}.pr-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:20px;padding:28px}@media (min-width:640px){.pr-card{padding:32px}}.pr-filter-label{font-family:var(--app-font-mono);font-size:10px;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:#475569;margin:0 0 16px}.pr-filter-row{display:grid;grid-template-columns:1fr 1fr auto;gap:12px;align-items:flex-end}@media (max-width:600px){.pr-filter-row{grid-template-columns:1fr 1fr}.pr-filter-row .pr-btn-group{grid-column:1/-1}}.pr-field-label{display:block;font-family:var(--app-font-mono);font-size:10px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:#475569;margin-bottom:7px}.pr-input{width:100%;background:rgba(10,17,32,.6);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:10px 14px;color:#f1f5f9;font-size:13.5px;font-family:var(--app-font-sans);outline:0;transition:border-color .18s,box-shadow .18s;color-scheme:dark;box-sizing:border-box}.pr-input:focus{border-color:rgba(34,211,238,.4);box-shadow:0 0 0 3px rgba(34,211,238,.07)}.pr-btn-group{display:flex;gap:10px;align-items:flex-end}.pr-btn-primary{display:inline-flex;align-items:center;gap:7px;background:#22d3ee;color:#0a1120;font-family:var(--app-font-sans);font-weight:700;font-size:13px;border:none;border-radius:10px;padding:10px 20px;cursor:pointer;white-space:nowrap;box-shadow:0 0 20px rgba(34,211,238,.22);transition:opacity .15s,transform .15s}.pr-btn-primary:hover:not(:disabled){opacity:.88;transform:translateY(-1px)}.pr-btn-primary:disabled,.pr-btn-secondary:disabled{opacity:.45;cursor:not-allowed}.pr-btn-secondary{display:inline-flex;align-items:center;gap:7px;background:0 0;color:#22d3ee;font-family:var(--app-font-sans);font-weight:600;font-size:13px;border:1px solid rgba(34,211,238,.3);border-radius:10px;padding:10px 18px;cursor:pointer;white-space:nowrap;transition:background .15s,transform .15s}.pr-btn-secondary:hover:not(:disabled){background:rgba(34,211,238,.07);transform:translateY(-1px)}.pr-spin{animation:pr-spin .9s linear infinite}@keyframes pr-spin{to{transform:rotate(360deg)}}.pr-divider{border:none;border-top:1px solid rgba(255,255,255,.06);margin:28px 0}.pr-kpi-label{font-family:var(--app-font-mono);font-size:10px;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:#475569;margin:0 0 16px}.pr-kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}@media (max-width:700px){.pr-kpi-grid{grid-template-columns:1fr}}@media (min-width:701px) and (max-width:900px){.pr-kpi-grid{grid-template-columns:repeat(2,1fr)}}.pr-kpi-card{position:relative;overflow:hidden;border-radius:16px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.025);padding:20px;display:flex;flex-direction:column;gap:10px;transition:transform .2s,box-shadow .2s}.pr-kpi-card:hover{transform:translateY(-2px)}.pr-kpi-top-bar{position:absolute;top:0;left:0;right:0;height:2px;border-radius:16px 16px 0 0}.pr-kpi-icon{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0}.pr-kpi-metric-label{font-family:var(--app-font-mono);font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:.12em;color:#475569;margin:0}.pr-kpi-value{font-family:var(--app-font-heading);font-size:30px;font-weight:800;letter-spacing:-.03em;line-height:1;margin:0}.pr-kpi-value.skeleton{color:transparent;background:rgba(255,255,255,.07);border-radius:6px;width:55%;height:30px;animation:pr-pulse 1.4s ease-in-out infinite}@keyframes pr-pulse{0%,100%{opacity:1}50%{opacity:.4}}.pr-kpi-empty{font-family:var(--app-font-mono);font-size:22px;color:rgba(255,255,255,.12);letter-spacing:.05em}.pr-error{margin-top:16px;background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.25);border-radius:10px;padding:10px 16px;font-size:12.5px;color:#f87171;font-family:var(--app-font-mono)}`}</style>
      <div className="pr-root">
        <div className="pr-wrapper">
          <header className="pr-header">
            <p className="pr-eyebrow">Insight Workspace</p>
            <h1 className="pr-title">Principal Report</h1>
            <p className="pr-subtitle">Contact Center Performance Analytics</p>
          </header>

          <div className="pr-card">
            <p className="pr-filter-label">Filter Periode</p>

            <div className="pr-filter-row">
              <div>
                <label htmlFor="pr-start-date" className="pr-field-label">
                  Start Date
                </label>
                <input
                  id="pr-start-date"
                  type="date"
                  className="pr-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && generate()}
                />
              </div>

              <div>
                <label htmlFor="pr-end-date" className="pr-field-label">
                  End Date
                </label>
                <input
                  id="pr-end-date"
                  type="date"
                  className="pr-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && generate()}
                />
              </div>

              <div className="pr-btn-group">
                <button
                  className="pr-btn-secondary"
                  onClick={exportExcel}
                  disabled={exporting || loading || !isAdmin}
                  title={!isAdmin ? "Aksi ekspor khusus untuk role Admin" : undefined}
                >
                  <IconDownload /> {!isAdmin ? "Mode Guest (Read-Only)" : exporting ? "Preparing..." : "Export"}
                </button>
                <button
                  className="pr-btn-primary"
                  onClick={generate}
                  disabled={loading}
                >
                  <span className={loading ? "pr-spin" : ""}>
                    <IconSpinner />
                  </span>{" "}
                  {loading ? "Loading..." : "Generate"}
                </button>
              </div>
            </div>

            {error && <div className="pr-error">Warning: {error}</div>}

            <hr className="pr-divider" />
            <p className="pr-kpi-label">Ringkasan Metrik</p>

            <div className="pr-kpi-grid">
              {KPI_CONFIG.map((cfg) => {
                const val = formatKpi(cfg.key, kpi)

                return (
                  <div
                    key={cfg.key}
                    className="pr-kpi-card"
                    style={{ boxShadow: `0 6px 24px ${cfg.glow}` }}
                  >
                    <div
                      className="pr-kpi-top-bar"
                      style={{
                        background: `linear-gradient(90deg, ${cfg.accent}, transparent)`,
                      }}
                    />
                    <div
                      className="pr-kpi-icon"
                      style={{
                        background: `${cfg.accent}15`,
                        color: cfg.accent,
                        border: `1px solid ${cfg.accent}28`,
                      }}
                    >
                      {cfg.icon}
                    </div>
                    <p className="pr-kpi-metric-label">{cfg.label}</p>
                    {loading ? (
                      <div className="pr-kpi-value skeleton" />
                    ) : !generated ? (
                      <p className="pr-kpi-value pr-kpi-empty">
                        {EMPTY_KPI_TEXT}
                      </p>
                    ) : (
                      <p className="pr-kpi-value" style={{ color: cfg.accent }}>
                        {val}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
