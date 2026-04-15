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
  Home,
  Store,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* =========================
   MENU STRUCTURE (UPDATED)
========================= */

const HOME = [
  { label: "Home", icon: Home, path: "/home" },
];

const CONTACT_CENTER = [
  { label: "OMNIX Monitoring", icon: BarChart3, path: "/omnix" },
  { label: "Voice Monitoring", icon: Phone, path: "/voice" },
  { label: "CSAT Monitoring", icon: Star, path: "/csat" },
];

const COMPLAIN = [
  { label: "Marketplace", icon: Store, path: "/marketplace" },
  { label: "Service Center / Retail", icon: Headphones, path: "/service" },
];

const UPLOAD = [
  { label: "Upload Menu", icon: UploadCloud, path: "/upload" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

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
      {/* HEADER */}
      <div className="h-20 flex items-center px-4 relative">

        {/* LOGO + TITLE */}
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
                <h1 className="font-bold text-lg">
                  <span className="text-white">GUNDAM </span>
                  <span className="text-cyan-400">Workspace</span>
                </h1>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* TECH TOGGLE BUTTON */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute right-[-14px] w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-400/30 backdrop-blur flex items-center justify-center shadow-md hover:scale-110 transition"
        >
          {collapsed ? (
            <ChevronRight size={16} className="text-cyan-400" />
          ) : (
            <ChevronLeft size={16} className="text-cyan-400" />
          )}
        </button>
      </div>

      {/* MENU */}
      <div className="flex-1 px-3 space-y-6 overflow-y-auto no-scrollbar">

        {/* HOME */}
        <Section collapsed={collapsed}>
          {HOME.map((item) => (
            <MenuItem
              key={item.path}
              {...item}
              collapsed={collapsed}
              active={pathname === item.path}
              onClick={() => router.push(item.path)}
            />
          ))}
        </Section>

        <Divider />

        {/* CONTACT CENTER */}
        <Section title="Contact Center Reporting" collapsed={collapsed}>
          {CONTACT_CENTER.map((item) => (
            <MenuItem
              key={item.path}
              {...item}
              collapsed={collapsed}
              active={pathname === item.path}
              onClick={() => router.push(item.path)}
            />
          ))}
        </Section>

        <Divider />

        {/* COMPLAIN HANDLING */}
        <Section title="Complain Handling" collapsed={collapsed}>
          {COMPLAIN.map((item) => (
            <MenuItem
              key={item.path}
              {...item}
              collapsed={collapsed}
              active={pathname === item.path}
              onClick={() => router.push(item.path)}
            />
          ))}
        </Section>

        <Divider />

        {/* UPLOAD */}
        <Section collapsed={collapsed}>
          {UPLOAD.map((item) => (
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
        <div className="p-4 border-t border-white/5 text-xs">
          <p className="font-semibold text-white">
            GUNDAM
          </p>
          <p className="text-[10px] text-slate-400 leading-tight mt-1">
            Global Unified Network Dashboard  
            Analytics Metrics
          </p>
        </div>
      )}
    </motion.aside>
  );
}

/* ========================= */
function Section({ title, children, collapsed }: any) {
  return (
    <div>
      {title && !collapsed && (
        <p className="text-[10px] text-slate-500 uppercase px-3 mb-2 tracking-widest">
          {title}
        </p>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
}

/* ========================= */
function Divider() {
  return <div className="h-px bg-white/5 mx-2" />;
}

/* ========================= */
function MenuItem({
  icon: Icon,
  label,
  active,
  collapsed,
  onClick,
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
      {active && (
        <motion.div
          layoutId="active"
          className="absolute left-0 w-1 h-6 bg-cyan-400 rounded-r"
        />
      )}

      <Icon className="w-5 h-5" />

      {!collapsed && (
        <span className="text-sm font-medium">{label}</span>
      )}

      {collapsed && (
        <div className="absolute left-full ml-3 px-2 py-1 text-xs bg-black text-white rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
          {label}
        </div>
      )}
    </div>
  );
}