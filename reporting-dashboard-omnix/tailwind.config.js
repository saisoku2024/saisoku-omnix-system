import Sidebar from "@/components/Sidebar"
import "./globals.css"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { cn } from "@/lib/utils"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={cn("dark", GeistSans.variable, GeistMono.variable)}
    >
      <body className="flex min-h-screen bg-background text-foreground m-0 p-0 overflow-hidden font-sans">
        <Sidebar />

        <main className="flex-1 h-screen overflow-y-auto relative bg-background">
          {children}
        </main>
      </body>
    </html>
  )
}