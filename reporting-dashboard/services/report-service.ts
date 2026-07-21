import { apiUrl } from "@/lib/api"
import type {
  ExportRequest,
  PreviewRequest,
  ReportOptions,
} from "@/features/report/types/report"

const REPORT_API = apiUrl("/api/reports")
const BFF_REPORT_EXPORT_API = "/api/backend/reports/export"

export interface ExportFileResponse {
  blob: Blob
  filename: string
}

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

function getFilenameFromResponse(
  response: Response,
  fallbackFilename: string
): string {
  const contentDisposition = response.headers.get("Content-Disposition")

  if (!contentDisposition) {
    return fallbackFilename
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1])
  }

  const asciiMatch = contentDisposition.match(/filename="([^"]+)"/i)
  if (asciiMatch?.[1]) {
    return asciiMatch[1]
  }

  return fallbackFilename
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

export async function exportDigital(
  payload: ExportRequest
): Promise<ExportFileResponse> {
  const response = await fetch(`${BFF_REPORT_EXPORT_API}/digital`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  await handleResponse(response)
  return {
    blob: await response.blob(),
    filename: getFilenameFromResponse(response, "traffic_digital.xlsx"),
  }
}

export async function exportInbound(
  payload: ExportRequest
): Promise<ExportFileResponse> {
  const response = await fetch(`${BFF_REPORT_EXPORT_API}/inbound`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  await handleResponse(response)
  return {
    blob: await response.blob(),
    filename: getFilenameFromResponse(response, "traffic_inbound.xlsx"),
  }
}
