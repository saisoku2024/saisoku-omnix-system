# SAISOKU OMNIX Frontend

Frontend dashboard SAISOKU OMNIX dibangun dengan `Next.js 16`, `React 19`, `TypeScript`, dan `Tailwind CSS`.

## Folder Utama

```txt
reporting-dashboard/
|-- app/           # route pages Next.js
|-- components/    # shared UI, sidebar, shell components
|-- contexts/      # global React contexts
|-- features/      # feature modules per domain
|-- hooks/         # generic hooks
|-- lib/           # helper global
|-- providers/     # provider global aplikasi
|-- public/        # static assets
|-- services/      # layer fetch/integration
`-- types/         # global types lintas modul
```

## Menjalankan Lokal

```bash
npm install
npm run dev -- --port 3000
```

Buat `.env.local` untuk development lokal:

```txt
NEXT_PUBLIC_API_URL=http://127.0.0.1:8001
```

Kalau frontend lokal mau diarahkan ke backend Render, ganti nilainya menjadi:

```txt
NEXT_PUBLIC_API_URL=https://saisoku-omnix-system.onrender.com
```

Setelah ubah `.env.local`, restart dev server supaya base URL baru terbaca.

## Script

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Catatan Struktur

- Semua request backend sebaiknya lewat `lib/api.ts`
- Komponen domain disimpan di `features/<domain>/`
- Komponen UI reusable disimpan di `components/ui/`
- Type global lintas fitur disimpan di `types/`, sisanya tetap dekat fitur masing-masing
