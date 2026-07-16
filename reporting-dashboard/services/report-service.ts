import { apiUrl } from "@/lib/api"
import type {
  ExportRequest,
  PreviewRequest,
  ReportOptions,
} from "@/features/report/types/report"

const REPORT_API = apiUrl("/api/reports")

async function handleResponse(response: Response) {
  if (!response.ok) {
    let message = "Request failed"

    try {
      const err = await response.json()
      if (typeof err.detail === "string") {
        message = err.detail
      } else {
        message = JSON.stringify(err)
      }
    } catch {
      // Ignore response parsing errors and throw the generic message.
    }

    throw new Error(message)
  }

  return response
}

export async function getReportOptions(): Promise<ReportOptions> {
  const response = await fetch(`${REPORT_API}/options`)
  await handleResponse(response)
  return response.json()
}

export async function previewReport(payload: PreviewRequest) {
  const response = await fetch(`${REPORT_API}/preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  await handleResponse(response)
  return response.json()
}

export async function exportDigital(payload: ExportRequest) {
  const response = await fetch(`${REPORT_API}/export/digital`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  await handleResponse(response)
  return response.blob()
}

export async function exportInbound(payload: ExportRequest) {
  const response = await fetch(`${REPORT_API}/export/inbound`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  await handleResponse(response)
  return response.blob()
}
