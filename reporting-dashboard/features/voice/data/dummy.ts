import { HOURS, DAYS } from "@/features/voice/constants"
import type { VoiceResponse } from "@/features/voice/types/voice"

export const DUMMY: Required<VoiceResponse> = {
  summary: {
    total_calls: 8240,
    answered: 7500,
    abandon: 740,
    aht: "6m 20s",
    awt: "1m 10s",
    scr: 91,
  },
  daily: Array.from({ length: 31 }, (_, i) => ({
    label: String(i + 1).padStart(2, "0"),
    count: 200 + i * 10,
  })),
  hourly: HOURS.map((h, i) => ({
    label: h,
    count:
      i >= 8 && i <= 17
        ? 80 + Math.round(Math.sin((i - 8) * 0.5) * 60)
        : 10 + i * 2,
  })),
  byDay: DAYS.map((d, i) => ({ label: d, count: 900 + i * 120 })),
  agentHandling: [
    { agent: "Rian", total: 249 },
    { agent: "Isnaini", total: 221 },
    { agent: "Sari", total: 198 },
    { agent: "Budi", total: 175 },
    { agent: "Dewi", total: 160 },
  ],
  agentAht: [
    { agent: "Rian", value: "5m 10s" },
    { agent: "Isnaini", value: "5m 42s" },
    { agent: "Sari", value: "6m 05s" },
    { agent: "Budi", value: "6m 30s" },
    { agent: "Dewi", value: "7m 00s" },
  ],
  agentAwt: [
    { agent: "Rian", value: "0m 55s" },
    { agent: "Isnaini", value: "1m 05s" },
    { agent: "Sari", value: "1m 15s" },
    { agent: "Budi", value: "1m 30s" },
    { agent: "Dewi", value: "1m 45s" },
  ],
}