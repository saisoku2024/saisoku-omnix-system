"use client"

import { useState } from "react"

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState("")

  const handleUpload = async () => {
    if (!file) {
      setMessage("Pilih file dulu")
      return
    }

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("http://127.0.0.1:8001/api/upload", {
        method: "POST",
        body: formData,
      })

      const json = await res.json()

      setMessage("✅ Upload OK: " + json.filename)
    } catch (err) {
      console.error(err)
      setMessage("❌ Upload gagal")
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Upload Test</h1>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <br /><br />

      <button onClick={handleUpload}>
        Upload
      </button>

      <p>{message}</p>
    </div>
  )
}