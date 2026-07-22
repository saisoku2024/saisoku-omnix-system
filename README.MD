# SAISOKU OMNIX System

SAISOKU OMNIX adalah dashboard reporting yang menggabungkan data Omnix, Voice, CSAT, upload processing, dan report export dalam satu stack.

## Stack

- Frontend: `Next.js 16` di `reporting-dashboard`
- Backend: `FastAPI` di `reporting-backend`
- Database dan storage: `Supabase`
- Deploy: `Vercel` untuk frontend dan `Render` untuk backend

## Struktur Repo

```txt
saisoku-omnix-system/
|-- reporting-dashboard/
|-- reporting-backend/
|-- render.yaml
`-- README.MD
```

## Menjalankan Lokal

Runtime yang disarankan:

```txt
Node.js >=20.19.0
Python 3.11.9
```

### Backend

```bash
cd reporting-backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

Environment backend:

```txt
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_API_TOKEN=
ADMIN_USERNAME=
ADMIN_PASSWORD=
JWT_SECRET_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-2
```

Backend akan gagal start jika `SUPABASE_URL` atau `SUPABASE_SERVICE_ROLE_KEY`
belum diset. Ini disengaja agar konfigurasi Supabase yang salah tidak diam-diam
memakai placeholder.

### Frontend

```bash
cd reporting-dashboard
npm install
npm run dev -- --port 3000
```

Environment frontend:

```txt
NEXT_PUBLIC_API_URL=http://localhost:8001
ADMIN_API_TOKEN=
ADMIN_UI_PASSWORD=
AUTH_SESSION_SECRET=
```

`ADMIN_API_TOKEN` di frontend harus sama persis dengan `ADMIN_API_TOKEN` di
backend. Server route Next.js memakai token ini saat mem-proxy request ke
FastAPI.

Fitur `AI Knowledge Base` memakai Gemini API dari backend. Simpan
`GEMINI_API_KEY` hanya di Render/backend, bukan di browser.

## URL Lokal

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8001`
- Swagger: `http://localhost:8001/docs`

## Deploy

- Backend Render config ada di `render.yaml`
- Panduan backend ada di `reporting-backend/DEPLOY_RENDER.md`
- Frontend Vercel memakai `NEXT_PUBLIC_API_URL` yang mengarah ke backend Render
- Endpoint write/export dilindungi token minimal:
  - Render: `ADMIN_API_TOKEN`
  - Vercel: `ADMIN_API_TOKEN` dengan nilai yang sama, hanya dipakai server route Next.js
- Halaman dashboard dilindungi auth UI berbasis cookie:
  - Vercel: `ADMIN_UI_PASSWORD`
  - Vercel: `AUTH_SESSION_SECRET`
- AI Knowledge Base:
  - Render: `GEMINI_API_KEY`
  - Render: `GEMINI_MODEL`
  - Render: `GEMINI_EMBEDDING_MODEL`
- Setelah mengubah environment variable di Vercel atau Render, lakukan redeploy
  atau restart service agar runtime memakai nilai terbaru.

## Changelog

### 2026-07-16

- Merapikan struktur frontend dengan menambahkan `config/`, `providers/`, `services/`, dan `types/`
- Menambahkan guard token minimal untuk endpoint upload, cleanup soft-delete, dan report export
- Menambahkan login admin dan middleware session untuk melindungi halaman dashboard/report/upload
- Menyatukan theme system ke provider global
- Menyatukan rumah UI ke `components/ui`
- Memindahkan sidebar menu dan config ke `reporting-dashboard/config/`
- Memisahkan layer fetch dan normalisasi data ke `reporting-dashboard/services/`
- Membersihkan komponen demo dan legacy yang tidak dipakai

### 2026-07-13

- Menyatukan base URL frontend ke `NEXT_PUBLIC_API_URL`
- Mengubah backend agar memakai `SUPABASE_SERVICE_ROLE_KEY`
- Menambahkan dan menjalankan master RPC Supabase untuk dashboard utama
- Merapikan route backend lama agar tetap kompatibel

### 2026-07-10

- Membersihkan artifact lokal yang sempat ikut tracked ke Git
- Menyiapkan dasar deploy backend Render dan frontend Vercel
- Memulai audit build, runtime, dan konsistensi feature dashboard

## Catatan Repo

- Jangan commit file `.env`
- File hasil build, cache, dan dump listing folder tidak perlu disimpan di repo
