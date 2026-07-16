export type CleanupRule = "abandon_match" | "test_omnix" | "internal_email"

export interface CleanupMatchedVoice {
  id: string
  interaction_at: string | null
  call_event: string | null
  call_status: string | null
  clid_normalized: string | null
}

export interface CleanupCandidate {
  id: string
  ticket_id: string | null
  customer_hp: string | null
  interaction_date: string | null
  interaction_at: string | null
  customer_name: string | null
  channel: string | null
  main_category: string | null
  category: string | null
  subcategory: string | null
  agent_name: string | null
  reasons: CleanupRule[]
  matched_voice: CleanupMatchedVoice | null
}

export interface CleanupRuleCounts {
  abandon_match: number
  test_omnix: number
  internal_email: number
}

export interface CleanupPreviewRequest {
  date_from: string
  date_to: string
  rules: CleanupRule[]
}

export interface CleanupPreviewResponse {
  date_from: string
  date_to: string
  rules: CleanupRule[]
  total_scanned_omnix: number
  total_candidates: number
  rule_counts: CleanupRuleCounts
  items: CleanupCandidate[]
  truncated: boolean
}
