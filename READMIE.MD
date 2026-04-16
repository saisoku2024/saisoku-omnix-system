# Omnix Reporting System 🚀
*Autonomous Fullstack Reporting Dashboard*

Sistem pelaporan otomatis yang mengintegrasikan data dari Omnix, Voice, dan CSAT ke dalam dashboard analitik menggunakan **Next.js** (Frontend) dan **FastAPI/Python** (Backend).

---

## 🛠️ Panduan Menjalankan Aplikasi (Startup Guide)

### 1. Persiapan Environment
Pastikan file `.env` sudah terisi di folder masing-masing:
- **Backend:** Membutuhkan `SUPABASE_URL` dan `SUPABASE_KEY`.
- **Frontend:** Membutuhkan `NEXT_PUBLIC_API_URL` (arahkan ke `http://localhost:8001`).

====================
MENJALANKAN BACKEND
====================
### 2. Menjalankan Backend (Port 8001)

Buka terminal baru:
cd reporting-backend
# Install dependency (jika baru pertama kali)
pip install -r requirements.txt

# Jalankan server FastAPI
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload

=====================
MENJALANKAN FRONT END
=====================
### 3. Menjalankan Frontend (Port 3002)

Buka terminal baru:
cd reporting-dashboard-omnix
# Install dependency (jika baru pertama kali)
npm install

# Jalankan server Next.js
npm run dev -- -p 3002

---

## 📈 Log Update & Maintenance

### [2024-05-22] - Refactor Arsitektur & Standarisasi
- **Refactor:** Migrasi ke Clean Architecture (app/models, app/schemas, app/services).
- **Setup Dasar:** Penambahan requirements.txt & .gitignore untuk keamanan data.
- **Konfigurasi:** Port tetap untuk Frontend (3002) dan Backend (8001).
- **Dokumentasi:** Pembuatan panduan startup satu pintu (README.md) dengan instruksi manual.

---

## ⚠️ Catatan Penting
- Akses Dokumentasi API (Swagger): http://localhost:8001/docs
- Akses Web Dashboard: http://localhost:3002
- Jangan upload file .env ke Git/Repository.