"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Phone,
  Star,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MENU = [
  { label: "Omnix", icon: BarChart3, path: "/omnix" },
  { label: "Voice", icon: Phone, path: "/voice" },
  { label: "CSAT", icon: Star, path: "/csat" },
];

const TOOLS = [
  { label: "Upload", icon: UploadCloud, path: "/upload", highlight: true },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // persist collapse
  useEffect(() => {
    const saved = localStorage.getItem("sidebar");
    if (saved) setCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar", String(collapsed));
  }, [collapsed]);

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 260 }}
      className="h-screen bg-[#0B1220] border-r border-white/5 flex flex-col relative"
    >
      {/* GLOW */}
      <div className="absolute top-0 left-0 w-full h-40 bg-cyan-500/10 blur-3xl" />

      {/* HEADER */}
      <div className="h-20 flex items-center px-4 relative">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg">
            <LayoutDashboard className="text-white w-5 h-5" />
          </div>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <h1 className="font-bold text-white text-lg">QUANTIX</h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                  Intelligence
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* COLLAPSE BTN */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute right-[-12px] w-7 h-7 rounded-full bg-[#1E293B] border border-white/10 flex items-center justify-center"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* MENU */}
      <div className="flex-1 px-3 space-y-6 overflow-y-auto no-scrollbar">
        <Section title="Monitoring" collapsed={collapsed}>
          {MENU.map((item) => (
            <MenuItem
              key={item.path}
              {...item}
              collapsed={collapsed}
              active={pathname === item.path}
              onClick={() => router.push(item.path)}
            />
          ))}
        </Section>

        <Section title="System" collapsed={collapsed}>
          {TOOLS.map((item) => (
            <MenuItem
              key={item.path}
              {...item}
              collapsed={collapsed}
              active={pathname === item.path}
              onClick={() => router.push(item.path)}
            />
          ))}
        </Section>
      </div>

      {/* FOOTER */}
      {!collapsed && (
        <div className="p-4 border-t border-white/5">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
            <p className="text-white font-semibold">System Active</p>
            <p className="text-slate-400 text-[10px]">
              Monitoring all services
            </p>
          </div>
        </div>
      )}
    </motion.aside>
  );
}

/* ========================= */
function Section({ title, children, collapsed }: any) {
  return (
    <div>
      {!collapsed && (
        <p className="text-[10px] text-slate-500 uppercase px-3 mb-2 tracking-widest">
          {title}
        </p>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
}

/* ========================= */
function MenuItem({
  icon: Icon,
  label,
  active,
  collapsed,
  onClick,
  highlight,
}: any) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all",
        active
          ? "bg-cyan-500/10 text-cyan-400"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      )}
    >
      {/* ACTIVE BAR */}
      {active && (
        <motion.div
          layoutId="active"
          className="absolute left-0 w-1 h-6 bg-cyan-400 rounded-r"
        />
      )}

      <Icon className="w-5 h-5" />

      {/* LABEL */}
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm font-medium"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* BADGE */}
      {highlight && !collapsed && (
        <span className="ml-auto text-[9px] px-2 py-0.5 bg-cyan-500 text-black rounded">
          NEW
        </span>
      )}

      {/* TOOLTIP */}
      {collapsed && (
        <div className="absolute left-full ml-3 px-2 py-1 text-xs bg-black text-white rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
          {label}
        </div>
      )}
    </div>
  );
}