import Link from "next/link"
import { FileQuestionIcon, HomeIcon, ArrowLeftIcon } from "lucide-react"

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-(--c-bg) px-4 py-12 text-(--c-text)">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 ring-4 ring-cyan-500/5">
          <FileQuestionIcon size={32} />
        </div>

        <p className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400">
          404 Not Found
        </p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Halaman Tidak Ditemukan
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-(--c-muted)">
          Halaman yang Anda tuju tidak ada atau telah dipindahkan ke alamat lain.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-(--c-accent) px-5 text-xs font-bold text-(--c-bg) transition hover:opacity-90"
          >
            <HomeIcon size={14} />
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
