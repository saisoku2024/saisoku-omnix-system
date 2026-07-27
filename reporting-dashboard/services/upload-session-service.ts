import type {
  UploadSessionDeletePreview,
  UploadSessionDeleteResult,
  UploadSessionListResponse,
  UploadSessionStatus,
  UploadSessionType,
} from "@/features/upload-sessions/types/upload-session"

const API = "/api/backend/upload-sessions"

async function handleJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "Upload session request failed"

    try {
      const error = (await response.json()) as { detail?: unknown; error?: unknown }
      message =
        typeof error.detail === "string"
          ? error.detail
          : typeof error.error === "string"
            ? error.error
            : JSON.stringify(error)
    } catch {
      // Keep generic message when backend body is not JSON.
    }

    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export async function listUploadSessions(params: {
  dateFrom: string
  dateTo: string
  type: UploadSessionType
  status: UploadSessionStatus
}): Promise<UploadSessionListResponse> {
  const search = new URLSearchParams({
    date_from: params.dateFrom,
    date_to: params.dateTo,
    type: params.type,
    status: params.status,
  })

  const response = await fetch(`${API}?${search.toString()}`, { cache: "no-store" })
  return handleJsonResponse<UploadSessionListResponse>(response)
}

export async function previewUploadSessionDelete(uploadId: string): Promise<UploadSessionDeletePreview> {
  const response = await fetch(`${API}/${uploadId}/delete-preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })

  return handleJsonResponse<UploadSessionDeletePreview>(response)
}

export async function deleteUploadSession(uploadId: string, deletedBy = "admin"): Promise<UploadSessionDeleteResult> {
  const response = await fetch(`${API}/${uploadId}/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deleted_by: deletedBy }),
  })

  return handleJsonResponse<UploadSessionDeleteResult>(response)
}
