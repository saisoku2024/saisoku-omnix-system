"use client";
import Link from "next/link";

export default function Sidebar() {
  return (
    <div className="w-60 h-screen bg-slate-900 p-4 flex flex-col space-y-2 text-white">
      <h2 className="font-bold text-xl mb-4 text-blue-400">OMNIX</h2>
      
      <nav className="flex flex-col gap-1">
        <Link href="/home" className="p-2 hover:bg-slate-700 rounded transition">Home</Link>
        <Link href="/omnix" className="p-2 hover:bg-slate-700 rounded transition">Omnix Reporting</Link>
        <Link href="/voice" className="p-2 hover:bg-slate-700 rounded transition">Voice</Link>
        <Link href="/csat" className="p-2 hover:bg-slate-700 rounded transition">CSAT</Link>
        <Link href="/upload" className="p-2 hover:bg-slate-700 rounded transition">Upload Data</Link>
      </nav>
    </div>
  );
}