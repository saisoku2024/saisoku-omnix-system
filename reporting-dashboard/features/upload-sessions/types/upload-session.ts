export type UploadSessionType = "all" | "omnix" | "voice" | "csat"
export type UploadSessionStatus = "all" | "processing" | "success" | "failed"
export type UploadSessionDeleteMode = "soft" | "hard" | "unsupported"

export interface UploadSessionItem {
  id: string
  file_name: string | null
  file_type: "omnix" | "voice" | "csat" | string | null
  processing_status: string | null
  total_rows: number
  inserted_rows: number
  duplicate_rows: number
  invalid_rows: number
  error_summary: string | null
  uploaded_at: string | null
  processed_at: string | null
  storage_path: string | null
  target_table: string | null
  delete_mode: UploadSessionDeleteMode
  delete_modes: UploadSessionDeleteMode[]
  detail_rows: number
  total_detail_rows: number
}

export interface UploadSessionListResponse {
  date_from: string
  date_to: string
  type: UploadSessionType
  status: UploadSessionStatus
  items: UploadSessionItem[]
}

export interface UploadSessionDeletePreview {
  upload_id: string
  file_name: string | null
  file_type: string | null
  processing_status: string | null
  uploaded_at: string | null
  target_table: string
  delete_mode: UploadSessionDeleteMode
  affected_rows: number
  warning: string
}

export interface UploadSessionDeleteResult extends UploadSessionDeletePreview {
  deleted_rows: number
  cleanup_batch_id: string | null
  deleted_at?: string
  deleted_by: string
}
