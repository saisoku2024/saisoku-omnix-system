// ============================================================
// Base URL ke endpoint /omnix (BUKAN /dashboard).
//
// Endpoint /api/dashboard/* dimiliki oleh dashboard.py (router lain)
// dan return shape yang berbeda — sehingga total_ticket jadi NaN.
//
// Endpoint /api/omnix/* dimiliki oleh omnix.py yang kita maintain.
// ============================================================
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL_OMNIX ||
  "http://localhost:8001/api/omnix"

export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

export const QUARTERS = ["Q1", "Q2", "Q3", "Q4"]

export const PALETTE = [
  "#0ea5e9",
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#f43f5e",
  "#8b5cf6",
  "#06b6d4",
]