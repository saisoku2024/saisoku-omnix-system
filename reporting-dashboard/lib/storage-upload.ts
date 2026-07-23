export type StorageUploadKind = "knowledge" | "data"

export interface SignedUploadPayload {
  kind: StorageUploadKind
  filename: string
  content_type?: string
  size: number
}

export interface SignedUploadResponse {
  bucket: string
  path: string
  signed_url: string
  token?: string
  content_type: string
  max_size: number
}

export interface DirectUploadResult {
  bucket: string
  path: string
  filename: string
  content_type: string
  size: number
}

async function readError(response: Response, fallback: string) {
  const data = await response.json().catch(() => ({}))
  return String(data?.detail || data?.error || fallback)
}

function xhrUpload(
  signedUrl: string,
  file: File,
  onProgress?: (progress: number, loaded: number, total: number) => void,
  signal?: AbortSignal
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    const abort = () => {
      xhr.abort()
      reject(new Error("Upload dibatalkan"))
    }

    if (signal?.aborted) {
      abort()
      return
    }
    signal?.addEventListener("abort", abort, { once: true })

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return
      const progress = Math.round((event.loaded / event.total) * 100)
      onProgress?.(Math.min(progress, 99), event.loaded, event.total)
    })

    xhr.addEventListener("load", () => {
      signal?.removeEventListener("abort", abort)
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100, file.size, file.size)
        resolve()
        return
      }
      reject(new Error(`Supabase Storage upload failed: HTTP ${xhr.status}`))
    })

    xhr.addEventListener("error", () => {
      signal?.removeEventListener("abort", abort)
      reject(new Error("Kesalahan koneksi ke Supabase Storage"))
    })

    xhr.addEventListener("abort", () => {
      signal?.removeEventListener("abort", abort)
    })

    xhr.open("PUT", signedUrl)
    if (file.type) xhr.setRequestHeader("Content-Type", file.type)
    xhr.send(file)
  })
}

export async function uploadFileToStorage(
  kind: StorageUploadKind,
  file: File,
  onProgress?: (progress: number, loaded: number, total: number) => void,
  signal?: AbortSignal
): Promise<DirectUploadResult> {
  const signedResponse = await fetch("/api/backend/storage/signed-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind,
      filename: file.name,
      content_type: file.type || "application/octet-stream",
      size: file.size,
    } satisfies SignedUploadPayload),
  })

  if (!signedResponse.ok) {
    throw new Error(await readError(signedResponse, "Gagal membuat signed upload URL"))
  }

  const signed = (await signedResponse.json()) as SignedUploadResponse
  if (!signed.signed_url || !signed.bucket || !signed.path) {
    throw new Error("Signed upload URL tidak valid")
  }

  await xhrUpload(signed.signed_url, file, onProgress, signal)

  return {
    bucket: signed.bucket,
    path: signed.path,
    filename: file.name,
    content_type: file.type || signed.content_type || "application/octet-stream",
    size: file.size,
  }
}

