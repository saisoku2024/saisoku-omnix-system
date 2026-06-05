export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/csat`
    : "https://saisoku-omnix-system.onrender.com/api/csat";

export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

export const QUARTERS = ["Q1", "Q2", "Q3", "Q4"]

export const QUARTER_MONTHS: Record<string, string[]> = {
  Q1: ["Jan", "Feb", "Mar"],
  Q2: ["Apr", "May", "Jun"],
  Q3: ["Jul", "Aug", "Sep"],
  Q4: ["Oct", "Nov", "Dec"],
}

export const SPACING = {
  cardPadding: 18,
  cardGap: 14,
  headerPadding: "14px 18px",
  controlHeight: 32,
} as const