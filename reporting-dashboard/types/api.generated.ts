/**
 * Auto-generated TypeScript DTO definitions from FastAPI OpenAPI Schema.
 * Do not edit directly.
 */

export interface AuditLogCreateRequest {
  action: string;
  resource: string;
  user_email?: unknown;
  user_role?: unknown;
  details?: unknown;
}

export interface Body_upload_chat_transcript_api_chat_upload_post {
  file: string;
}

export interface Body_upload_file_api_upload_post {
  file: string;
  type: string;
}

export interface Body_upload_knowledge_document_api_knowledge_upload_post {
  file: string;
  title?: unknown;
}

export interface BrandInsightRequest {
  brand: string;
  query?: unknown;
}

export interface CleanupDeleteItem {
  target_table: string;
  id: unknown;
  reasons?: Array<unknown>;
}

export interface CleanupPreviewRequest {
  date_from: string;
  date_to: string;
  rules?: Array<unknown>;
}

export interface CleanupSoftDeleteRequest {
  items?: Array<CleanupDeleteItem>;
  deleted_by?: string;
}

export interface ExportRequest {
  report_type: string;
  channel?: unknown;
  brand?: unknown;
  main_category?: unknown;
  start_date: string;
  end_date: string;
  divisi?: unknown;
  departemen?: unknown;
  customer?: unknown;
  nama_layanan?: unknown;
  nama_sub_layanan?: unknown;
  layanan_cc_non_cc?: unknown;
  segment?: unknown;
  sub_segment?: unknown;
  kota?: unknown;
}

export interface HTTPValidationError {
  detail?: Array<ValidationError>;
}

export interface KnowledgeQueryRequest {
  question: string;
  match_count?: number;
}

export interface KnowledgeStorageIngestRequest {
  bucket: string;
  path: string;
  filename?: unknown;
  content_type?: unknown;
  size: number;
  title?: unknown;
}

export interface KnowledgeTextRequest {
  title: string;
  text: string;
}

export interface KnowledgeUrlRequest {
  url: string;
  title?: unknown;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface PreviewRequest {
  report_type: string;
  channel?: unknown;
  brand?: unknown;
  main_category?: unknown;
  start_date: string;
  end_date: string;
}

export interface SignedUploadRequest {
  kind: string;
  filename: string;
  content_type?: unknown;
  size: number;
}

export interface StorageDataIngestRequest {
  bucket: string;
  path: string;
  filename?: unknown;
  content_type?: unknown;
  size: number;
  type: string;
}

export interface StorageIngestRequest {
  bucket: string;
  path: string;
  filename?: unknown;
  size?: unknown;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UploadSessionDeleteRequest {
  deleted_by?: string;
  delete_mode?: string;
}

export interface UserCreateRequest {
  email: string;
  password: string;
  full_name: string;
  role?: string;
  brand_access?: unknown;
}

export interface UserListResponse {
  total: number;
  users: Array<UserProfileResponse>;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  full_name: string;
  role: string;
  brand_access: Array<unknown>;
  created_at?: unknown;
  updated_at?: unknown;
}

export interface UserResetPasswordRequest {
  new_password: string;
}

export interface UserUpdateRequest {
  full_name?: unknown;
  role?: unknown;
  brand_access?: unknown;
}

export interface ValidationError {
  loc: Array<unknown>;
  msg: string;
  type: string;
  input?: unknown;
  ctx?: Record<string, unknown>;
}
