import Sidebar from "@/components/Sidebar"
import "./globals.css"
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn("dark", "font-sans", geist.variable)}>
      <body className="flex min-h-screen bg-background m-0 p-0 overflow-hidden">
        {/* SIDEBAR TERKUNCI DI KIRI */}
        <Sidebar />

        {/* AREA KONTEN DI KANAN */}
        <main className="flex-1 h-screen overflow-y-auto relative bg-background">
          {children}
        </main>
      </body>
    </html>
  )
}