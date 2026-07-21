import { apiUrl } from "@/lib/api"
import { adminHeaders } from "@/lib/admin-api"
import type {
  CleanupPreviewRequest,
  CleanupPreviewResponse,
  CleanupSoftDeleteRequest,
  CleanupSoftDeleteResponse,
} from "@/features/data-cleanup/types/cleanup"

const CLEANUP_API = apiUrl("/api/cleanup")

async function handleJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "Cleanup request failed"

    try {
      const error = (await response.json()) as { detail?: unknown }
      message =
        typeof error.detail === "string" ? error.detail : JSON.stringify(error)
    } catch {
      // Keep generic error when response body is not JSON.
    }

    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export async function previewCleanup(
  payload: CleanupPreviewRequest
): Promise<CleanupPreviewResponse> {
  const response = await fetch(`${CLEANUP_API}/preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  return handleJsonResponse<CleanupPreviewResponse>(response)
}

export async function softDeleteCleanup(
  payload: CleanupSoftDeleteRequest
): Promise<CleanupSoftDeleteResponse> {
  const response = await fetch("/api/backend/cleanup/soft-delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  return handleJsonResponse<CleanupSoftDeleteResponse>(response)
}
