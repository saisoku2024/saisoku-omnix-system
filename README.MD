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
GEMINI_MODEL=gemini-3.5-flash
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

## Workflow Pengembangan dan Change Control

Setiap permintaan perubahan wajib mengikuti alur berikut:

```txt
Input User
   ↓
Analisa & Check Project
   ↓
Hasil Temuan
   ↓
Plan Perbaikan
   ↓
Persetujuan Aksi
   ↓
Proses Perbaikan / Update
   ↓
Laporan Hasil
   ↓
Selesai
```

### 1. Input User

Sistem mencatat:

- Tujuan permintaan
- Masalah atau kebutuhan
- Scope perubahan
- Fitur yang terkait
- Acceptance criteria
- Batasan dan risiko yang diketahui

Pada tahap ini belum boleh dilakukan perubahan kode.

### 2. Analisa dan Check Project

Sebelum menyusun solusi, seluruh bagian yang berpotensi terdampak harus diperiksa, meliputi:

- Struktur frontend Next.js
- Route, component, service, hook, state, dan type
- Endpoint serta logic backend FastAPI
- Schema, query, RPC, migration, database, dan storage Supabase
- Authentication, authorization, token, dan security
- Environment variable
- Integrasi Omnix, Voice, CSAT, upload processing, dan export report
- Konfigurasi Vercel, Render, dan `render.yaml`
- Dependency dan public API contract
- Existing changes yang belum selesai

Analisa wajib memisahkan:

- Fakta yang ditemukan
- Asumsi
- Risiko
- Dependency
- File atau modul yang terdampak

### 3. Hasil Temuan

Hasil analisa harus menjelaskan:

- Masalah utama
- Root cause
- Bukti atau lokasi masalah
- Fitur yang terdampak
- Risiko apabila tidak diperbaiki
- Risiko regresi
- Tingkat risiko: Low, Medium, High, atau Critical

Tahap ini hanya menghasilkan laporan dan tidak mengubah kode.

### 4. Plan Perbaikan

Plan wajib berisi:

- Solusi yang direkomendasikan
- Daftar file atau modul yang akan diubah
- File yang tidak boleh diubah
- Urutan perubahan
- Dampak terhadap frontend, backend, database, storage, dan deployment
- Rencana testing dan validasi
- Rencana rollback
- Non-goals atau hal yang sengaja tidak dikerjakan

Perbaikan harus menggunakan perubahan paling kecil dan aman. Refactor besar,
perubahan dependency, perubahan schema, perubahan public contract, atau perubahan
fitur tidak boleh dilakukan tanpa persetujuan khusus.

### 5. Persetujuan Aksi

Setiap perubahan atau aksi mutasi wajib menunggu persetujuan eksplisit user.

Persetujuan harus mencakup:

- Scope perubahan
- File atau modul yang terdampak
- Risiko perubahan
- Dampak terhadap fitur eksisting
- Rencana testing
- Rencana deployment jika diperlukan

Jika user belum memberikan persetujuan, proses berhenti pada tahap plan.

Persetujuan hanya berlaku untuk scope yang telah disetujui. Perubahan tambahan di
luar scope wajib dianalisa dan disetujui kembali.

### 6. Proses Perbaikan atau Update

Setelah disetujui:

- Ubah kode seminimal mungkin
- Pertahankan fitur dan behavior eksisting
- Jangan menimpa perubahan user yang tidak terkait
- Jangan menghapus data atau file tanpa persetujuan
- Pertahankan backward compatibility jika memungkinkan
- Terapkan perubahan berdasarkan dependency order
- Validasi seluruh consumer atau module yang menggunakan perubahan tersebut
- Catat perubahan dan keputusan teknis

Jika ditemukan dampak baru yang material selama proses, eksekusi harus dihentikan
sementara untuk meminta persetujuan tambahan.

### 7. Laporan Hasil

Laporan akhir wajib berisi:

- Ringkasan perubahan
- File atau modul yang diubah
- File yang tidak diubah
- Fitur baru atau behavior yang diperbaiki
- Fitur eksisting yang telah diverifikasi
- Hasil lint, test, build, dan validasi runtime
- Environment atau deployment yang perlu diperbarui
- Risiko yang masih tersisa
- Catatan rollback jika diperlukan

Jika suatu validasi tidak dapat dijalankan, statusnya harus ditulis sebagai
`Not Verified`, bukan dianggap berhasil.

### 8. Selesai

Permintaan dianggap selesai apabila:

- Scope yang disetujui telah diimplementasikan
- Acceptance criteria terpenuhi
- Tidak ada perubahan di luar scope
- Fitur eksisting tetap berjalan
- Validasi terkait telah dilakukan
- Risiko dan keterbatasan telah dilaporkan
- Dokumentasi yang terdampak telah diperbarui

## Aturan Perlindungan Fitur Eksisting

Fitur eksisting tidak boleh diubah, dihapus, atau diubah perilakunya secara tidak sengaja.

Jika kebutuhan perbaikan mengharuskan perubahan terhadap fitur eksisting:

1. Identifikasi fitur dan consumer yang terdampak.
2. Jelaskan behavior sebelum dan sesudah perubahan.
3. Analisa seluruh dampak lintas frontend, backend, database, storage, security, dan deployment.
4. Sertakan risiko regresi dan rencana rollback.
5. Minta persetujuan eksplisit user.
6. Implementasikan perubahan hanya setelah disetujui.
7. Verifikasi kembali seluruh fitur yang terdampak.

## Status Workflow

Status pekerjaan menggunakan state berikut:

```txt
RECEIVED
→ ANALYZING
→ FINDINGS_READY
→ PLAN_READY
→ WAITING_APPROVAL
→ IN_PROGRESS
→ VERIFYING
→ COMPLETED
```

Status alternatif:

```txt
BLOCKED
REJECTED
CANCELLED
```

`IN_PROGRESS` tidak boleh dimulai sebelum status `WAITING_APPROVAL` mendapatkan persetujuan user.

## Changelog

### 2026-08-04

- Menambahkan workflow pengembangan dan change control.
- Menambahkan tahapan analisa, temuan, plan perbaikan, persetujuan, eksekusi, validasi, dan laporan hasil.
- Menambahkan aturan perlindungan fitur eksisting dan analisa dampak lintas project.

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
