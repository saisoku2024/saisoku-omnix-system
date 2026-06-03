export type UploadResult = {
  success: boolean
  total_rows: number
  inserted_rows: number
  duplicate_rows: number
  invalid_rows: number
  target_table?: string
}