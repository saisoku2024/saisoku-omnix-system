export const API_BASE = "http://localhost:8001/api";

const DEFAULT_YEAR = 2026;
const DEFAULT_GRANULARITY = "month";

function withDefaultQuery(path: string) {
  const joiner = path.includes("?") ? "&" : "?";
  return `${path}${joiner}year=${DEFAULT_YEAR}&granularity=${DEFAULT_GRANULARITY}`;
}

async function apiFetch(path: string) {
  try {
    const res = await fetch(`${API_BASE}${withDefaultQuery(path)}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      // Alih-alih throw error yang bikin crash, kita log saja
      console.warn(`Backend Error ${res.status} on path: ${path}`);
      return null; 
    }

    return await res.json();
  } catch (error) {
    // Menangani jika backend mati total (Network Error)
    console.error(`Network Error / Backend Mati:`, error);
    return null; 
  }
}

/* API Export tetap sama, tapi sekarang lebih aman karena apiFetch mengembalikan null jika gagal */
export async function getDashboardSummary() { return apiFetch("/dashboard/summary"); }
export async function getDashboardTrend() { return apiFetch("/dashboard/trend"); }
export async function getDashboardByChannel() { return apiFetch("/dashboard/by-channel"); }

// app/layout.tsx
import "./globals.css"; // WAJIB ADA agar Tailwind CSS aktif
import Sidebar from "@/components/layout/Sidebar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-[#0d1117] text-white overflow-hidden">
        <div className="flex h-screen w-screen">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-[#0d1117]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}