"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Lock, User, Eye, EyeOff, Loader2, ShieldAlert, BarChart3 } from "lucide-react"
import { toast } from "sonner"
import { apiUrl } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      toast.error("Semua field wajib diisi")
      return
    }

    setLoading(true)
    setErrorMsg(null)

    try {
      const response = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Terjadi kesalahan saat login")
      }

      // Simpan cookie auth_token (berlaku 1 hari)
      const maxAge = 60 * 60 * 24 // 24 jam
      document.cookie = `auth_token=${data.access_token}; path=/; max-age=${maxAge}; SameSite=Lax`

      toast.success("Login berhasil! Mengalihkan...")
      
      // Tunggu toast dan redirect
      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 800)

    } catch (err: any) {
      console.error("Login error:", err)
      setErrorMsg(err.message || "Gagal terhubung ke server backend")
      toast.error(err.message || "Gagal terhubung ke server backend")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-950 font-[Plus_Jakarta_Sans,Inter,sans-serif]">
      {/* Background Animated Gradient Blobs */}
      <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-sky-500/10 blur-[120px] transition-all duration-1000" />
      <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[120px] transition-all duration-1000" />
      
      {/* Mesh Background Grid */}
      <div 
        className="absolute inset-0 opacity-[0.02]" 
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-4"
      >
        {/* Brand Logo & Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.3)]"
          >
            <BarChart3 className="h-6 w-6 text-white" />
          </motion.div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">SAISOKU OMNIX</h1>
          <p className="text-sm text-slate-400">Integrated CRM & Analytics Dashboard</p>
        </div>

        {/* Login Card */}
        <Card className="border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-xl font-semibold text-white">Selamat Datang</CardTitle>
            <CardDescription className="text-slate-400">
              Masukkan kredensial Anda untuk masuk ke sistem pelaporan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Alert Error */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400"
                  >
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Username Input */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300 text-xs font-medium">Username</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <User className="h-4 w-4" />
                  </span>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Masukkan username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    className="border-slate-800 bg-slate-950/50 pl-10 text-white placeholder-slate-600 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-300 text-xs font-medium">Password</Label>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Lock className="h-4 w-4" />
                  </span>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="border-slate-800 bg-slate-950/50 pl-10 pr-10 text-white placeholder-slate-600 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-500 text-white hover:bg-sky-400 font-medium py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(14,165,233,0.15)] flex items-center justify-center gap-2"
                style={{ height: "40px" }}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  "Masuk ke Dashboard"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-slate-600">
          &copy; {new Date().getFullYear()} SAISOKU OMNIX System. All rights reserved.
        </p>
      </motion.div>
    </div>
  )
}
