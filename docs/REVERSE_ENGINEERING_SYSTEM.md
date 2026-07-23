# SAISOKU OMNIX System Reverse Engineering

Tanggal observasi: 2026-07-23

Dokumen ini menjelaskan hasil reverse engineering dari struktur repo `saisoku-omnix-system`. Tujuannya adalah memberi peta tekstual tentang bagaimana sistem dibangun, bagaimana data mengalir, modul apa saja yang ada, dan bagian mana yang menjadi titik pengembangan berikutnya.

## Ringkasan Sistem

SAISOKU OMNIX adalah platform reporting dan operations dashboard untuk data Omnix, Voice, CSAT, report export, data cleanup, management system, dan AI Knowledge Base.

Sistem dibangun sebagai monorepo dengan dua aplikasi utama:

```txt
saisoku-omnix-system/
|-- reporting-dashboard/   Next.js frontend, BFF route, UI dashboard
|-- reporting-backend/     FastAPI backend, parser, service, Supabase access
|-- render.yaml            Render backend deployment config
`-- README.MD              panduan root project
```

Stack utama:

```txt
Frontend       : Next.js 16, React 19, TypeScript, Tailwind CSS, Recharts, lucide-react
Backend        : FastAPI, Python, pandas, Supabase client, requests
Database       : Supabase Postgres
Vector Search  : pgvector di Supabase
AI             : Google Gemini API
Frontend Host  : Vercel
Backend Host   : Render
```

## Arsitektur Tingkat Tinggi

```txt
User Browser
  |
  | HTTPS
  v
Vercel Next.js app
  |-- protected pages via signed cookie session
  |-- server route /api/backend/* as BFF proxy
  |-- specialized BFF routes for upload, export, admin, knowledge
  |
  | X-Admin-Token from server env
  v
Render FastAPI backend
  |-- parser and analytics services
  |-- protected endpoints via ADMIN_API_TOKEN
  |-- Gemini calls for AI Knowledge Base
  |
  | Supabase service role key
  v
Supabase Postgres
  |-- reporting tables
  |-- audit logs
  |-- profiles and management users
  |-- knowledge documents and vector chunks
```

Pola penting:

- Browser tidak memegang `ADMIN_API_TOKEN`.
- Next.js server route mengambil `ADMIN_API_TOKEN` dari environment Vercel.
- FastAPI memvalidasi token memakai `require_admin_token`.
- FastAPI mengakses Supabase memakai `SUPABASE_SERVICE_ROLE_KEY`.
- Gemini key hanya dipakai di backend Render, bukan di browser.

## Frontend

Frontend berada di `reporting-dashboard`.

Peran frontend:

- Menyediakan halaman dashboard dan monitoring.
- Menyediakan UI upload data dan report export.
- Menyediakan Management System untuk users dan audit logs.
- Menyediakan AI Knowledge Base.
- Menjadi BFF proxy dari browser ke FastAPI.

Entry dan config penting:

```txt
reporting-dashboard/package.json
reporting-dashboard/proxy.ts
reporting-dashboard/lib/auth-token.ts
reporting-dashboard/lib/server-auth.ts
reporting-dashboard/lib/admin-api.ts
reporting-dashboard/lib/api.ts
reporting-dashboard/config/sidebar.tsx
```

### Routing UI

Sidebar dikonfigurasi di `reporting-dashboard/config/sidebar.tsx`.

Menu utama:

```txt
Dashboard
Monitoring
  |-- Omnix
  |-- Voice
  `-- CSAT
Analytics & Reporting
  |-- Principal Report
  |-- Infomedia Reporting
  `-- Custom Report Builder
AI Workspace
  `-- Knowledge Base
Data Management
  |-- Upload Data
  |-- Customer Journey
  `-- Data Cleanup
Management System
  |-- User & Access Control
  `-- Audit Logs & Activity
```

### Auth Frontend

Frontend auth memakai cookie `saisoku_session`.

File penting:

```txt
reporting-dashboard/lib/auth-token.ts
reporting-dashboard/lib/server-auth.ts
reporting-dashboard/proxy.ts
reporting-dashboard/app/api/auth/login/route.ts
reporting-dashboard/app/api/auth/logout/route.ts
reporting-dashboard/app/api/auth/session/route.ts
```

Cara kerja:

1. User login di frontend.
2. Next.js membuat token session yang ditandatangani HMAC SHA-256.
3. Token disimpan sebagai HTTP-only cookie.
4. `proxy.ts` melindungi halaman selain public asset dan auth route.
5. Session punya subject:
   - `admin`
   - `guest`

Admin dan guest dibedakan di server route:

- `getCurrentSession()` menerima admin atau guest.
- `requireAdminSession()` hanya menerima admin.

### BFF Proxy

Catch-all BFF ada di:

```txt
reporting-dashboard/app/api/backend/[...path]/route.ts
```

Fungsinya:

- Mengecek session.
- Membatasi route yang boleh diakses melalui allowlist.
- Menambahkan `X-Admin-Token` dari environment Vercel.
- Meneruskan request ke FastAPI backend.

Ada route BFF khusus untuk operasi sensitif atau kebutuhan body khusus:

```txt
app/api/backend/upload/route.ts
app/api/backend/cleanup/soft-delete/route.ts
app/api/backend/reports/export/[type]/route.ts
app/api/backend/admin/users/*
app/api/backend/admin/audit-logs/route.ts
app/api/backend/knowledge/*
```

## Backend

Backend berada di `reporting-backend`.

Entry point:

```txt
reporting-backend/main.py
```

FastAPI mendaftarkan router berikut:

```txt
/api/dashboard/*
/api/upload
/api/voice/*
/api/csat/*
/api/omnix/*
/api/cleanup/*
/api/reports/*
/api/knowledge/*
/api/principal-report/*
/api/auth/login
/api/admin/users/*
/api/admin/audit-logs
/health
/
```

Backend memakai CORS berdasarkan `ALLOWED_ORIGINS`.

### Security Backend

Token guard backend berada di:

```txt
reporting-backend/app/core/security.py
```

`require_admin_token` menerima token dari:

- Header `X-Admin-Token`
- Header `Authorization: Bearer <token>`

Jika `ADMIN_API_TOKEN` belum ada, backend mengembalikan 503.
Jika token salah, backend mengembalikan 401.

### Supabase Client

Supabase client dibuat di:

```txt
reporting-backend/app/core/supabase.py
```

Env wajib:

```txt
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Jika env kosong, backend fail-fast dengan `RuntimeError`. Ini mencegah backend diam-diam memakai placeholder.

## Database dan Supabase

Schema utama ada di:

```txt
reporting-backend/supabase/schema.sql
reporting-backend/supabase/migrations/
```

Tabel inti:

```txt
uploads
omnix_cases
voice_interactions
csat_responses
cleanup_deleted_omnix_cases
cleanup_deleted_voice_interactions
profiles
audit_logs
knowledge_documents
knowledge_chunks
```

Fungsi/RPC penting:

```txt
set_updated_at()
get_dashboard_home()
get_omnix_dashboard()
get_voice_dashboard()
report_preview_inbound_daily()
report_export_inbound_daily()
match_knowledge_chunks()
```

Index dibuat untuk kolom tanggal, upload id, channel, brand, category, product, deleted status, dan embedding vector.

### RLS

RLS diaktifkan pada beberapa tabel publik.

Untuk AI Knowledge Base:

- `knowledge_documents` RLS enabled.
- `knowledge_chunks` RLS enabled.
- Policy hanya mengizinkan service role mengelola data.

Ini berarti akses browser langsung ke tabel knowledge tidak menjadi jalur utama. Akses dilakukan melalui backend service-role.

## Data Upload Pipeline

Endpoint upload:

```txt
POST /api/upload
```

File backend:

```txt
reporting-backend/app/routes/upload.py
reporting-backend/app/services/upload_service.py
reporting-backend/app/services/upload_config.py
reporting-backend/app/parsers/omnix_parser.py
reporting-backend/app/parsers/voice_parser.py
reporting-backend/app/parsers/csat_parser.py
```

Alur upload:

```txt
Excel/CSV file
  |
  v
FastAPI /api/upload
  |
  | file size guard 50MB
  | pandas read_csv/read_excel
  v
UploadService.get_config(type)
  |
  | type = omnix -> parse_omnix_rows -> omnix_cases
  | type = voice -> parse_voice_rows -> voice_interactions
  | type = csat  -> parse_csat_rows  -> csat_responses
  v
validate rows
  |
  v
internal deduplication
  |
  v
database deduplication
  |
  v
bulk insert to Supabase
  |
  v
update uploads status
  |
  v
audit log UPLOAD_DATA
```

Dedup key:

```txt
omnix : ticket_id
voice : unique_id
csat  : source_id
```

Omnix parser juga melakukan subject standardization melalui:

```txt
reporting-backend/app/services/subject_standardizer.py
```

## Analytics dan Reporting

Dashboard dan monitoring membaca data melalui service layer dan RPC Supabase.

Backend route:

```txt
dashboard.py
omnix.py
voice.py
csat.py
report.py
principal.py
```

Frontend service:

```txt
reporting-dashboard/services/dashboard-service.ts
reporting-dashboard/services/omnix-service.ts
reporting-dashboard/services/voice-service.ts
reporting-dashboard/services/csat-service.ts
reporting-dashboard/services/report-service.ts
```

Pola umum:

```txt
Page component
  |
  v
frontend service / BFF API
  |
  v
FastAPI route
  |
  v
backend service
  |
  v
Supabase table/RPC
```

Reporting mendukung preview dan export:

```txt
GET  /api/reports/options
POST /api/reports/preview
POST /api/reports/export/digital
POST /api/reports/export/inbound
GET  /api/principal-report/export
GET  /api/principal-report/summary
```

## Data Cleanup

Data cleanup berfungsi untuk preview, diagnostics, dan soft delete data Omnix/Voice.

Endpoint:

```txt
POST /api/cleanup/preview
POST /api/cleanup/diagnostics/phone-format
POST /api/cleanup/soft-delete
```

Soft delete menandai data dengan kolom:

```txt
deleted_at
deleted_reason
deleted_by
cleanup_batch_id
```

History disimpan di:

```txt
cleanup_deleted_omnix_cases
cleanup_deleted_voice_interactions
```

## Management System

Management system meliputi user/profile dan audit logs.

Backend:

```txt
reporting-backend/app/routes/admin_users.py
reporting-backend/app/routes/admin_audit_logs.py
reporting-backend/app/services/admin_user_service.py
reporting-backend/app/services/audit_log_service.py
```

Frontend:

```txt
reporting-dashboard/app/management-system/users/page.tsx
reporting-dashboard/app/management-system/audit-logs/page.tsx
```

Audit event yang terlihat dari code:

```txt
USER_LOGIN
USER_LOGOUT
UPLOAD_DATA
KNOWLEDGE_UPLOAD
KNOWLEDGE_QUERY
```

## AI Knowledge Base

AI Knowledge Base berada di:

```txt
reporting-dashboard/app/ai/knowledge-base/page.tsx
reporting-backend/app/routes/knowledge.py
reporting-backend/app/services/knowledge_service.py
reporting-backend/supabase/migrations/20260722060000_create_ai_knowledge_base.sql
```

Model/env:

```txt
GEMINI_API_KEY
GEMINI_MODEL=gemini-3.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-2
```

Tabel:

```txt
knowledge_documents
knowledge_chunks
```

Vector dimension:

```txt
embedding vector(768)
```

Index:

```txt
ivfflat using vector_cosine_ops
```

Sumber knowledge yang didukung:

```txt
File upload : txt, md, csv, xlsx, xls, pdf, docx
Manual text : admin paste teks langsung
Web URL     : admin paste public http/https URL
```

Alur ingest:

```txt
Source input
  |
  | file/text/url
  v
Create knowledge_documents row with status processing
  |
  v
Background task on Render
  |
  | extract text
  | PDF text via pypdf
  | scanned PDF fallback via Gemini OCR
  | DOCX via python-docx
  | spreadsheet via pandas
  | web URL via requests + HTMLParser
  v
Clean text
  |
  v
Chunk text, default max 1800 chars, overlap 220 chars
  |
  v
Generate embeddings with Gemini
  |
  v
Insert knowledge_chunks
  |
  v
Set document status ready or failed
```

Alur query:

```txt
User question
  |
  v
Embed question
  |
  v
Supabase RPC match_knowledge_chunks()
  |
  v
Filter sources by similarity >= 0.2
  |
  v
Generate answer with Gemini using retrieved context
  |
  v
Return answer plus source chunks
```

Web URL security:

- Hanya `http` dan `https`.
- Hostname harus resolve ke public IP.
- Private, loopback, link-local, multicast, reserved, dan unspecified IP diblokir.
- Redirect dibatasi.
- HTML fetch dibatasi 1MB.
- Script, style, nav, header, footer, aside, svg diabaikan saat ekstraksi.

Limit praktis saat ini:

```txt
Dashboard knowledge upload : 4MB guard di UI
Backend generic upload     : 50MB guard
Knowledge backend file     : 10MB guard
Web page fetch             : 1MB HTML/text guard
```

Catatan desain: untuk file knowledge 50-100MB, jalur yang benar adalah direct upload ke Supabase Storage, bukan lewat Vercel BFF body.

## Deployment

Backend Render:

```txt
render.yaml
rootDir      : reporting-backend
buildCommand : pip install -r requirements.txt
startCommand : python main.py
healthCheck  : /health
autoDeploy   : true
Python       : 3.11.9
```

Frontend Vercel:

```txt
reporting-dashboard
Next.js 16
Node.js >=20.19.0
NEXT_PUBLIC_API_URL -> Render backend origin
```

Env penting backend Render:

```txt
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
ADMIN_API_TOKEN
ADMIN_USERNAME
ADMIN_PASSWORD
JWT_SECRET_KEY
ALLOWED_ORIGINS
GEMINI_API_KEY
GEMINI_MODEL
GEMINI_EMBEDDING_MODEL
```

Env penting frontend Vercel:

```txt
NEXT_PUBLIC_API_URL
ADMIN_API_TOKEN
ADMIN_UI_PASSWORD
AUTH_SESSION_SECRET
DEMO_GUEST_EMAIL
DEMO_GUEST_PASSWORD
ENABLE_DEMO_GUEST
```

Poin penting:

- `ADMIN_API_TOKEN` di Vercel dan Render harus sama.
- `GEMINI_API_KEY` hanya perlu di backend Render.
- Setelah env berubah, Vercel/Render perlu redeploy atau restart agar runtime memakai nilai baru.

## Risiko dan Observasi Teknis

1. Frontend auth sederhana
   - Cookie HMAC cukup untuk admin/guest dashboard.
   - Belum ada user identity lengkap di session selain `admin` atau `guest`.
   - Audit beberapa operasi masih memakai default email seperti `admin@omnix.com`.

2. Backend memakai service role
   - Backend punya akses luas ke Supabase.
   - Proteksi utama adalah `ADMIN_API_TOKEN` dan BFF session.
   - Jangan expose service role atau admin token ke browser.

3. Knowledge ingestion memakai background task FastAPI
   - Cocok untuk ingestion kecil/sedang.
   - Untuk proses panjang atau banyak file, lebih baik memakai queue/job worker persistent.

4. Web URL extraction masih basic
   - HTMLParser mengambil teks readable sederhana.
   - Untuk WordPress/product pages, kualitas bisa ditingkatkan dengan membaca JSON-LD, OpenGraph, atau WordPress REST API terlebih dahulu.

5. File besar belum ideal
   - File 50-100MB sebaiknya tidak lewat Vercel route.
   - Perlu direct upload ke Supabase Storage, lalu backend memproses dari storage.

6. Runtime lokal dan deploy perlu konsisten
   - Frontend membutuhkan Node >=20.19.0.
   - Render memakai Python 3.11.9.
   - Validasi lokal di Windows kadang terkena `spawn EPERM`, sehingga build/test perlu rerun di luar sandbox.

## Rekomendasi Pengembangan Berikutnya

Prioritas tinggi:

1. Large file knowledge ingestion
   - Supabase Storage bucket `knowledge-files`.
   - Signed upload URL.
   - Browser upload langsung ke Supabase.
   - Backend proses dari storage.
   - Progress status dan retry.

2. Improve Web URL extraction
   - Ambil JSON-LD product schema.
   - Ambil OpenGraph meta.
   - Untuk WordPress, coba `/wp-json/wp/v2/product/<id>` jika tersedia.
   - Preview editable sebelum ingest.

3. Knowledge management actions
   - Delete document.
   - Reprocess/retry failed document.
   - Filter documents by status/source.
   - View source chunks.

4. Better audit identity
   - Simpan email/role di session payload.
   - Kirim identity dari BFF ke backend untuk audit.

5. Worker architecture
   - Pindahkan background ingestion ke queue worker jika workload naik.
   - Simpan job progress per document.

## Kesimpulan

Sistem ini dibangun sebagai dashboard operations modern dengan frontend Next.js di Vercel, backend FastAPI di Render, dan Supabase sebagai database utama. Alur data reporting dimulai dari upload Excel/CSV, parsing dan normalisasi di backend, lalu penyimpanan ke Supabase untuk analytics, monitoring, export, dan cleanup.

AI Knowledge Base adalah modul tambahan yang memakai Supabase pgvector dan Gemini. Modul ini sudah mendukung file, manual text, dan web URL sebagai sumber knowledge. Desainnya sudah cukup untuk knowledge kecil/sedang, tetapi untuk file besar dan web extraction kualitas tinggi masih perlu fase lanjutan.
