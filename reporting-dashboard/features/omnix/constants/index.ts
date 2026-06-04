// ============================================================
// Base URL ke endpoint /omnix (BUKAN /dashboard).
//
// Endpoint /api/dashboard/* dimiliki oleh dashboard.py (router lain)
// dan return shape yang berbeda — sehingga total_ticket jadi NaN.
//
// Endpoint /api/omnix/* dimiliki oleh omnix.py yang kita maintain.
// ============================================================

export const API_BASE =
  "https://saisoku-omnix-system.onrender.com/api/omnix";

// DEBUG LOGS
if (typeof window !== "undefined") {
  console.log(
    "NEXT_PUBLIC_API_URL =",
    process.env.NEXT_PUBLIC_API_URL
  );

  console.log(
    "NEXT_PUBLIC_API_BASE_URL_OMNIX =",
    process.env.NEXT_PUBLIC_API_BASE_URL_OMNIX
  );

  console.log("API_BASE =", API_BASE);
}

export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

export const PALETTE = [
  "#0ea5e9",
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#f43f5e",
  "#8b5cf6",
  "#06b6d4",
];