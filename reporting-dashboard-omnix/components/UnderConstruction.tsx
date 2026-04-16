"use client";
import { motion } from "framer-motion";
import { Construction, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UnderConstruction({ title }: { title: string }) {
  const router = useRouter();

  return (
    /* Perubahan: Tambahkan bg-[#0B1220] dan min-h-screen agar menutup space putih */
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-[#0B1220] text-white p-6 overflow-hidden">
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
        {/* ICON BOX */}
        <div className="w-24 h-24 rounded-3xl bg-cyan-500/10 flex items-center justify-center mb-8 border border-cyan-400/20 shadow-[0_0_50px_rgba(34,211,238,0.1)]">
          <Construction className="text-cyan-400 w-12 h-12 animate-bounce" />
        </div>

        {/* TEXT CONTENT */}
        <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight text-center">
          <span className="text-white">{title.split(' ')[0]}</span>{" "}
          <span className="text-slate-500">{title.split(' ').slice(1).join(' ')}</span>
        </h1>
        
        <p className="text-cyan-400 font-bold mb-6 uppercase tracking-[0.3em] text-xs bg-cyan-400/10 px-4 py-1.5 rounded-full border border-cyan-400/20">
          Under Construction
        </p>

        <p className="text-slate-400 text-center max-w-md mb-10 leading-relaxed text-sm md:text-base">
          Halaman ini sedang dalam tahap perakitan sistem <span className="text-white font-semibold">GUNDAM</span>. 
          Seluruh modul analytics dan metrik sedang dioptimasi.
        </p>

        {/* BUTTON */}
        <button 
          onClick={() => router.back()}
          className="group flex items-center gap-3 px-8 py-3.5 bg-white/5 hover:bg-cyan-500 hover:text-white border border-white/10 rounded-2xl transition-all duration-300 text-sm font-bold shadow-lg"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
          KEMBALI KE BASE
        </button>
      </motion.div>

      {/* BACKGROUND DECORATION (Agar tidak terlalu flat) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}