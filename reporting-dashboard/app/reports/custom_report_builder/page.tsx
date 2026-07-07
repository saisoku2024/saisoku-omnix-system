import React from "react"
import { HardHat } from "lucide-react"

export default function UnderConstructionPage() {
  return (
    <div className="flex h-full min-h-[70vh] flex-col items-center justify-center p-8 text-center font-sans antialiased">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-100/50 dark:bg-blue-900/20">
        <HardHat className="h-12 w-12 text-[#0ea5e9]" />
      </div>
      
      <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        Under Construction
      </h1>
      
      <p className="max-w-[450px] text-base text-slate-500 dark:text-slate-400">
        Fitur ini sedang dalam tahap pengembangan. Silakan kembali lagi nanti untuk melihat pembaruan terbaru di SAISOKU OMNIX Dashboard.
      </p>
    </div>
  )
}