'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type OmnixCase = {
  id: number
  ticket_id: string | null
  interaction_at: string | null
  channel: string | null
  main_category: string | null
  category: string | null
  subcategory: string | null
  agent_name: string | null
}

type VoiceSummary = {
  total_calls: number
  avg_wait_time_sec: number
  avg_talk_time_sec: number
  avg_hold_time_sec: number
  answered_calls: number
  abandoned_calls: number
}

type CsatSummary = {
  total_responses: number
  avg_rating: number
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8001'

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState('omnix')
  const [message, setMessage] = useState('')
  const [lastUploadId, setLastUploadId] = useState('')
  const [totalCount, setTotalCount] = useState<number>(0)
  const [rows, setRows] = useState<OmnixCase[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [voiceSummary, setVoiceSummary] = useState<VoiceSummary>({
    total_calls: 0,
    avg_wait_time_sec: 0,
    avg_talk_time_sec: 0,
    avg_hold_time_sec: 0,
    answered_calls: 0,
    abandoned_calls: 0,
  })

  const [csatSummary, setCsatSummary] = useState<CsatSummary>({
    total_responses: 0,
    avg_rating: 0,
  })

  const loadOmnixData = async () => {
    setLoadingData(true)

    const countRes = await supabase
      .from('omnix_cases')
      .select('*', { count: 'exact', head: true })

    if (!countRes.error && typeof countRes.count === 'number') {
      setTotalCount(countRes.count)
    }

    const rowsRes = await supabase
      .from('omnix_cases')
      .select(
        'id, ticket_id, interaction_at, channel, main_category, category, subcategory, agent_name'
      )
      .order('id', { ascending: false })
      .limit(10)

    if (!rowsRes.error && rowsRes.data) {
      setRows(rowsRes.data)
    }

    setLoadingData(false)
  }

  const loadVoiceSummary = async () => {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/dashboard/voice/summary?granularity=month&year=2026&month=3`
      )

      const result = await res.json()

      if (res.ok && result?.summary) {
        setVoiceSummary(result.summary)
      }
    } catch (error) {
      console.error('Failed to load voice summary', error)
    }
  }

  const loadCsatSummary = async () => {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/dashboard/csat/summary?granularity=month&year=2026&month=3`
      )

      const result = await res.json()

      if (res.ok && result?.summary) {
        setCsatSummary(result.summary)
      }
    } catch (error) {
      console.error('Failed to load csat summary', error)
    }
  }

  const loadAllData = async () => {
    await Promise.all([
      loadOmnixData(),
      loadVoiceSummary(),
      loadCsatSummary(),
    ])
  }

  useEffect(() => {
    loadAllData()
  }, [])

  const handleUpload = async () => {
    if (!file) {
      setMessage('Pilih file dulu')
      return
    }

    setUploading(true)
    setMessage('Uploading...')

    try {
      const filePath = `raw/${Date.now()}-${file.name}`

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file)

      if (uploadError) {
        setMessage(`Upload file gagal: ${uploadError.message}`)
        return
      }

      const { data, error: dbError } = await supabase
        .from('uploads')
        .insert({
          file_name: file.name,
          file_type: fileType,
          storage_path: filePath,
          processing_status: 'uploaded',
        })
        .select()
        .single()

      if (dbError) {
        setMessage(`Simpan log gagal: ${dbError.message}`)
        return
      }

      setLastUploadId(data.id)
      setMessage(`Upload berhasil. Upload ID: ${data.id}`)
    } catch (error) {
      setMessage('Terjadi error saat upload')
    } finally {
      setUploading(false)
    }
  }

  const handleProcess = async () => {
    if (!lastUploadId) {
      setMessage('Belum ada upload yang bisa diproses')
      return
    }

    setProcessing(true)
    setMessage(`Processing upload ID: ${lastUploadId}...`)

    try {
      const res = await fetch(`${BACKEND_URL}/process/${lastUploadId}`, {
        method: 'POST',
      })

      let result: any = null
      try {
        result = await res.json()
      } catch {
        result = null
      }

      if (!res.ok) {
        setMessage(`Process gagal: ${result?.detail || `HTTP ${res.status}`}`)
        return
      }

      setMessage(
        `Process berhasil. File type: ${result.file_type}, Total rows: ${result.total_rows}, Inserted: ${result.inserted_rows}`
      )

      await loadAllData()
    } catch (error) {
      setMessage(`Gagal connect ke backend: ${BACKEND_URL}`)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <main className="max-w-6xl mx-auto p-8 space-y-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Reporting Dashboard OMNIX</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="omnix">OMNIX</option>
            <option value="voice">Voice</option>
            <option value="csat">CSAT</option>
          </select>

          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="border p-2 rounded w-full md:col-span-2"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>

          <button
            onClick={handleProcess}
            disabled={processing || !lastUploadId}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {processing ? 'Processing...' : 'Process File'}
          </button>

          <button
            onClick={loadAllData}
            disabled={loadingData}
            className="bg-gray-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Refresh Data
          </button>
        </div>

        <p>{message}</p>

        <p className="text-xs text-gray-500">Backend: {BACKEND_URL}</p>

        {lastUploadId && (
          <p className="text-sm text-gray-400">
            Last Upload ID: {lastUploadId}
          </p>
        )}
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-2">OMNIX</h2>
          <p>Total Data OMNIX: {loadingData ? 'Loading...' : totalCount}</p>
        </div>

        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-2">Voice</h2>
          <p>Total Calls: {voiceSummary.total_calls}</p>
          <p>Avg Wait: {voiceSummary.avg_wait_time_sec} sec</p>
          <p>Avg Talk: {voiceSummary.avg_talk_time_sec} sec</p>
          <p>Answered: {voiceSummary.answered_calls}</p>
          <p>Abandoned: {voiceSummary.abandoned_calls}</p>
        </div>

        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-2">CSAT</h2>
          <p>Total Responses: {csatSummary.total_responses}</p>
          <p>Avg Rating: {csatSummary.avg_rating}</p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="border rounded p-4 overflow-x-auto">
          <h2 className="text-xl font-semibold mb-4">10 Data Terbaru OMNIX</h2>

          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">ID</th>
                <th className="p-2">Ticket ID</th>
                <th className="p-2">Interaction At</th>
                <th className="p-2">Channel</th>
                <th className="p-2">Main Category</th>
                <th className="p-2">Category</th>
                <th className="p-2">Subcategory</th>
                <th className="p-2">Agent</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-gray-400">
                    Belum ada data
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b">
                    <td className="p-2">{row.id}</td>
                    <td className="p-2">{row.ticket_id || '-'}</td>
                    <td className="p-2">{row.interaction_at || '-'}</td>
                    <td className="p-2">{row.channel || '-'}</td>
                    <td className="p-2">{row.main_category || '-'}</td>
                    <td className="p-2">{row.category || '-'}</td>
                    <td className="p-2">{row.subcategory || '-'}</td>
                    <td className="p-2">{row.agent_name || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}