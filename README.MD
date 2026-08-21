# SAISOKU OMNIX System

SAISOKU OMNIX adalah platform enterprise analytics & AI reporting terpadu yang menggabungkan data Omnix, Voice, CSAT, upload processing, custom report builder, dan Enterprise AI Knowledge Base RAG dalam satu stack modern berkinerja tinggi.

---

## 🛠️ Technology Stack

| Layer | Teknologi / Library | Deskripsi & Peran |
|---|---|---|
| **Frontend Framework** | `Next.js 16` (App Router, Turbopack) | Server & Client Components, Server Route Handlers, Proxy Middleware |
| **UI Library & Runtime** | `React 19`, `TypeScript 5` | Reactive state management, strict typing |
| **Styling & Animation** | `Tailwind CSS v4`, `framer-motion` | Theme system (Dark/Light mode), dynamic styling, micro-animations |
| **Data Visualization** | `Recharts 3`, `@tanstack/react-table` | Interactive charts, performant sortable data tables |
| **Markdown & Streaming UI**| `react-markdown`, `remark-gfm` | Real-time token rendering, GitHub Flavored Markdown, auto-table repair |
| **Backend Framework** | `FastAPI (Python 3.11)` | Asynchronous REST API, Server-Sent Events (`StreamingResponse`), Pydantic validation |
| **Database & Vector Store**| `Supabase (PostgreSQL 15+)` | Relational storage, `pgvector` (HNSW/Cosine Vector Search), GIN Index (Full-Text Search) |
| **File & Media Storage** | `Supabase Storage` | Bucket storage untuk physical documents, signed upload URLs |
| **AI / LLM Engine** | `Google Gemini 3.5 Flash` | Main reasoning & conversational answer generation |
| **Embedding Engine** | `gemini-embedding-001` (768-dim) | High-dimension dense vector embeddings for semantic retrieval |
| **Document Processing** | `pypdf`, `python-docx`, `python-pptx`, `openpyxl`, `pandas` | Multi-format extraction (PDF, DOCX, PPTX, XLSX, TXT, Web scraping) |
| **Authentication & Guard** | `PyJWT`, `HTTPBearer`, Session Cookies | Role-Based Access Control (Admin/Super Admin), Token Minimal Guard |
| **Deployment & Hosting** | `Vercel` (Frontend), `Render` (Backend) | Edge global CDN, auto-scaling backend worker, HTTPS termination |

---

## 🧠 Arsitektur Enterprise AI Knowledge Base (RAG)

Sistem Knowledge Base RAG dirancang mengikuti standar arsitektur 8-layer enterprise:

```txt
┌─────────────────────────────────────────────────────────────────────────┐
│                        AI QUERY / STREAMING FLOW                        │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                      [ 1. SEMANTIC QUERY CACHE ]
                      (Threshold ≥ 0.96 | TTL 365 Hari)
                         /                   \
           [ CACHE HIT ]                       [ CACHE MISS ]
                 │                                   │
                 ▼                                   ▼
        Instant Response (<50ms)        [ 2. HYBRID MULTI-SIGNAL RETRIEVAL ]
        Zero Token / Zero Cost          ├── pgvector (Dense Semantic Search)
                                        ├── Postgres FTS (BM25 tsvector GIN)
                                        ├── Entity Indexer (Product Codes)
                                        └── Memo / Policy Keyword Matcher
                                                     │
                                                     ▼
                                        [ 3. MULTI-ENTITY BALANCING ]
                                        (Fair 50:50 chunk quota for comparisons)
                                                     │
                                                     ▼
                                        [ 4. REAL-TIME SSE STREAMING ]
                                        (Gemini 3.5 Flash StreamingResponse)
                                                     │
                                                     ▼
                                        [ 5. OBSERVABILITY & FEEDBACK LOOP ]
                                        ├── Query Latency Breakdown Telemetry
                                        ├── User Thumbs Up / Down Rating (👍/👎)
                                        └── Inconsistency Auto-Detection Logging
```

### 1. Ingestion Pipeline
* **Multi-Format Extraction**: Mendukung ingest dokumen PDF, Word (`.docx`), PowerPoint (`.pptx`), Excel/CSV, Text, dan Public Web URLs.
* **Contextual Prefixing**: Setiap potongan teks (*chunk*) disisipkan deskripsi konteks dokumen secara otomatis sebelum di-embed untuk mencegah hilangnya konteks saat retrieval.
* **OCR & Fallback Parser**: Dilengkapi parser cadangan jika dokumen hasil scan minim teks.

### 2. Hybrid Multi-Signal Retrieval
* **Dense Vector Search**: Pencarian semantik menggunakan kemiripan *Cosine Similarity* pada ekstensi `pgvector`.
* **Native PostgreSQL Full-Text Search (FTS)**: Indeks `GIN` pada kolom `tsvector` dengan ranking relevansi `ts_rank_cd` untuk keyword presisi.
* **Entity Indexing**: Index terstruktur untuk istilah spesifik (seri produk, kode SKU, suku cadang, indikator lampu).
* **Balanced Multi-Entity Quota**: Membagi alokasi chunk secara adil (50:50) saat pengguna menanyakan komparasi dua atau lebih produk (misal: *T30C MAX vs T30C PRIME*).

### 3. Semantic Query Caching (TTL 365 Hari)
* Menyimpan embedding pertanyaan dan jawaban yang valid ke tabel `knowledge_semantic_cache`.
* Menjawab pertanyaan berulang yang serupa ($\ge 0.96$ similarity) dalam **<50 milidetik** tanpa memakan kuota token Gemini API.
* **Smart Auto-Invalidation**: Seluruh cache otomatis di-reset saat ada dokumen baru yang di-upload atau dihapus oleh admin.

### 4. Real-Time Streaming & Observability
* **Server-Sent Events (SSE)**: Respon teks mengalir secara real-time (*Time-To-First-Token* < 500ms).
* **Telemetry & Query Logs**: Mencatat perincian latensi (*embedding*, *retrieval*, *generation*, *total*).
* **User Feedback Loop**: Menyediakan tombol rating interaktif (👍 Bagus / 👎 Kurang Tepat) untuk continuous improvement knowledge base.

---

## 📁 Struktur Repo

```txt
saisoku-omnix-system/
├── reporting-dashboard/          # Next.js 16 Frontend Application
│   ├── app/                      # App Router (Pages, API Proxies, Streaming routes)
│   ├── components/               # Reusable UI components & Dashboard widgets
│   ├── config/                   # Navigation, theme, & system configs
│   ├── services/                 # API client layers & data normalizers
│   └── types/                    # TypeScript interfaces & DTO schemas
├── reporting-backend/            # FastAPI Python Backend
│   ├── app/
│   │   ├── core/                 # Config, Supabase client, Gemini model config
│   │   ├── routes/               # API Endpoints (Knowledge, CSAT, Reports, Admin)
│   │   └── services/             # Business Logic, RAG Engine, Ingestion, Caching
│   ├── supabase/migrations/      # SQL DDL, RPC Functions, pgvector & FTS indexes
│   └── scripts/                  # Maintenance & batch processing scripts
├── render.yaml                   # Infrastructure-as-Code for Render deployment
└── README.MD                     # Master Project Documentation
```

---

## 🚀 Menjalankan Lokal

### Runtime yang Disarankan:
```txt
Node.js >= 20.19.0
Python 3.11.9
```

### 1. Backend Setup

```bash
cd reporting-backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

**Environment Variables Backend (`reporting-backend/.env`):**
```ini
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_API_TOKEN=your-secure-internal-token
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
JWT_SECRET_KEY=your-jwt-secret
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
```

### 2. Frontend Setup

```bash
cd reporting-dashboard
npm install
npm run dev -- -p 3000
```

**Environment Variables Frontend (`reporting-dashboard/.env.local`):**
```ini
NEXT_PUBLIC_API_URL=http://localhost:8001
ADMIN_API_TOKEN=your-secure-internal-token
ADMIN_UI_PASSWORD=your-admin-password
AUTH_SESSION_SECRET=your-session-secret-min-32-chars
```

---

## 🌐 Endpoint & URL Lokal

* **Frontend Dashboard**: `http://localhost:3000`
* **AI Knowledge Base UI**: `http://localhost:3000/ai/knowledge-base`
* **Backend API Root**: `http://localhost:8001`
* **Swagger OpenAPI Docs**: `http://localhost:8001/docs`

---

## 🔄 Workflow Pengembangan & Change Control

Setiap perubahan wajib mengikuti tata kelola standar:

```txt
Input User → Analisa & Check Project → Hasil Temuan → Plan Perbaikan → Persetujuan Aksi → Eksekusi / Update → Laporan Hasil → Selesai
```

---

## 📝 Changelog

### 2026-08-21
- **Real-Time Streaming (SSE)**: Menambahkan endpoint streaming `POST /knowledge/query-stream` (FastAPI `StreamingResponse`) dan reader `ReadableStream` di Next.js untuk tampilan respon real-time instan.
- **Native PostgreSQL Full-Text Search (FTS)**: Menambahkan kolom terindeks `fts tsvector` (GIN Index) pada tabel `knowledge_chunks` dan RPC `search_knowledge_chunks_fts` untuk hybrid search berkecepatan tinggi.
- **User Feedback Loop**: Menambahkan tracking rating pengguna (👍 / 👎) dengan endpoint `POST /knowledge/feedback`, metrik *satisfaction rate*, dan integrasi UI interaktif.
- **365-Day Semantic Query Caching**: Menambahkan tabel `knowledge_semantic_cache` dan RPC `match_semantic_cache` ($\ge 0.96$ similarity) untuk menyajikan respon instan (<50ms) dengan **Smart Auto-Invalidation** saat dokumen diperbarui.
- **Automated Re-index & Health Diagnostics Dashboard**: Menambahkan endpoint `/knowledge/maintenance/health`, `reindex-embeddings`, `reindex-entities`, dan `clear-cache` beserta panel interaktif diagnosa sistem vektor dan tombol 1-klik pemeliharaan di dashboard Knowledge Base.
- **Dokumentasi & Tech Stack Update**: Memperbarui README master dengan rincian lengkap arsitektur enterprise RAG, dependency stack, dan panduan deployment.

### 2026-08-04
- Menambahkan workflow pengembangan dan change control.
- Menambahkan tahapan analisa, temuan, plan perbaikan, persetujuan, eksekusi, validasi, dan laporan hasil.
- Menambahkan aturan perlindungan fitur eksisting dan analisa dampak lintas project.

### 2026-07-16
- Merapikan struktur frontend dengan menambahkan `config/`, `providers/`, `services/`, dan `types/`.
- Menambahkan guard token minimal untuk endpoint upload, cleanup soft-delete, dan report export.
- Menambahkan login admin dan middleware session untuk melindungi halaman dashboard/report/upload.
- Menyatukan theme system ke provider global dan rumah UI ke `components/ui`.

### 2026-07-13
- Menyatukan base URL frontend ke `NEXT_PUBLIC_API_URL`.
- Mengubah backend agar memakai `SUPABASE_SERVICE_ROLE_KEY`.
- Menambahkan dan menjalankan master RPC Supabase untuk dashboard utama.

### 2026-07-10
- Menyiapkan dasar deploy backend Render dan frontend Vercel.
- Memulai audit build, runtime, dan konsistensi feature dashboard.
