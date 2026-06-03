import { MONTHS } from "@/features/omnix/constants"
import type { OmnixResponse } from "@/features/omnix/types/omnix"

export const DUMMY: Required<OmnixResponse> = {
  summary: {
    total_ticket: 12450,
    aht: "8m 32s",
    art: "2m 10s",
    awt: "1m 45s",
  },
  trend: MONTHS.map((m, i) => ({
    label: m,
    count: 800 + Math.round(Math.sin(i * 0.6) * 200) + i * 30,
  })),
  channel: [
    { name: "WhatsApp", count: 5200 },
    { name: "IG Message", count: 2800 },
    { name: "Voice", count: 1900 },
    { name: "Email", count: 1400 },
    { name: "Manual", count: 1150 },
  ],
  category: [
    { name: "Complaint", count: 4100 },
    { name: "Inquiry", count: 3200 },
    { name: "Request", count: 2300 },
    { name: "Follow Up", count: 1500 },
    { name: "Feedback", count: 900 },
    { name: "Others", count: 450 },
  ],
  product: [
    { name: "Product A", count: 3800 },
    { name: "Product B", count: 2900 },
    { name: "Product C", count: 2100 },
    { name: "Product D", count: 1800 },
    { name: "Product E", count: 1200 },
    { name: "Others", count: 650 },
  ],
  top_cases: [
    { rank: 1, title: "Refund tidak diproses", count: 320, channel: "WhatsApp" },
    { rank: 2, title: "Produk tidak sesuai", count: 274, channel: "IG Message" },
    { rank: 3, title: "Pengiriman terlambat", count: 231, channel: "WhatsApp" },
    { rank: 4, title: "Akun tidak bisa login", count: 198, channel: "Email" },
    { rank: 5, title: "Promo tidak bisa digunakan", count: 165, channel: "Voice" },
  ],
  customer: MONTHS.map((m, i) => ({
    label: m,
    total: 4000 + i * 120,
    new: 300 + Math.round(Math.sin(i * 0.7) * 80) + 50,
  })),
}