"use client"

import { useState, useEffect } from "react"

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [type, setType] = useState("omnix")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)

  const handleUpload = async () => {
    if (!file) {
      setMessage("❌ Select file first")
      return
    }

    setLoading(true)
    setMessage("")
    setProgress(0)

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) return p
        return p + 5
      })
    }, 200)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", type)

      const res = await fetch("http://127.0.0.1:8001/api/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(interval)

      if (!res.ok) {
        throw new Error("Upload failed")
      }

      const json = await res.json()
      
      // ✅ SUCCESS HANDLER
      setProgress(100)
      setMessage(`✅ Success! ${json.rows_inserted} rows synchronized.`)
      
      // 🔥 AUTO-RESET UI
      setFile(null); // Kosongkan state file
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = ""; // Reset input HTML agar bisa pilih file yang sama lagi

    } catch (err) {
      clearInterval(interval)
      setMessage("❌ Connection error or server rejected.")
      setProgress(0)
    } finally {
      setLoading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave") setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-slate-200 p-6 md:p-12 font-sans selection:bg-cyan-500/30">
      
      {/* BACKGROUND DECORATION */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto scale-[0.9] origin-top">
        
        {/* HEADER SECTION */}
        <header className="mb-10 animate-in fade-in slide-in-from-top duration-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-1 bg-cyan-400 rounded-full" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-cyan-400 uppercase">System Core</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">
            Data <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">Synchronization</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-md">
            Integrate your metrics into GUNDAM Cloud Intelligence with high-speed processing.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom duration-1000">
          
          {/* CONFIGURATION PANEL */}
          <div className="lg:col-span-1 p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
            <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Configuration
            </h2>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">
                  Data Source Type
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {['omnix', 'voice', 'csat'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`text-left px-4 py-3 rounded-xl text-xs font-bold border transition-all ${
                        type === t 
                        ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
                        : 'bg-transparent border-white/5 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      {t.toUpperCase()} REPORT
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* UPLOAD REPOSITORY */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl flex flex-col">
            <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> File Repository
            </h2>

            <div 
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-10 transition-all duration-300 ${
                dragActive ? 'border-cyan-400 bg-cyan-400/5 scale-[0.99]' : 'border-white/10 bg-white/[0.01]'
              } ${file ? 'border-cyan-500/50' : ''}`}
            >
              <input 
                type="file" 
                id="file-upload" 
                className="hidden" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />

              <div className="text-center">
                {file ? (
                  <div className="animate-in zoom-in duration-300">
                    <p className="text-white font-bold text-sm mb-1">{file.name}</p>
                    <p className="text-[10px] text-cyan-400 uppercase tracking-widest">Ready to sync</p>
                  </div>
                ) : (
                  <label htmlFor="file-upload" className="cursor-pointer group">
                    <div className="mb-4 w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto group-hover:bg-cyan-500/20 transition-colors">
                        <span className="text-slate-400 group-hover:text-cyan-400">+</span>
                    </div>
                    <p className="text-sm text-slate-300">Click or drop file</p>
                  </label>
                )}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5">
              <button
                onClick={handleUpload}
                disabled={loading || !file}
                className={`w-full py-4 font-black rounded-xl transition-all duration-300 ${
                    loading || !file 
                    ? 'bg-white/5 text-slate-500 cursor-not-allowed' 
                    : 'bg-cyan-500 text-black hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] active:scale-[0.98]'
                }`}
              >
                {loading ? "SYNCHRONIZING..." : "SYNC TO CLOUD"}
              </button>

              {loading && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-cyan-400">
                    <span>PROGRESS</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div 
                        style={{ width: `${progress}%` }} 
                        className="h-full bg-cyan-400 transition-all duration-300" 
                    />
                  </div>
                </div>
              )}

              {message && (
                <div className={`mt-4 p-3 rounded-lg text-xs font-medium animate-in fade-in slide-in-from-bottom-2 ${
                    message.includes('Success') 
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="mt-12 text-xs text-slate-600 flex justify-between">
          <span>G-CLOUD ENGINE v2.4</span>
          <span>SYSTEM STATUS: OPTIMAL</span>
        </footer>
      </div>
    </div>
  )
}