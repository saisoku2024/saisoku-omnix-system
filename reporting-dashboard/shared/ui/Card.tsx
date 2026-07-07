"use client"

import React from "react"

const cardStyle: React.CSSProperties = {
  position: "relative",
  background: "linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.01) 100%), var(--c-surface)",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: 18,
  overflow: "hidden",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 8px 24px rgba(0,0,0,0.22)",
  transition: "transform 220ms cubic-bezier(0.4,0,0.2,1), border-color 220ms ease, box-shadow 220ms ease",
}

export default function Card({ children, style, className = "" }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div style={{ ...cardStyle, ...style }} className={`group hover:-translate-y-0.5 hover:border-white/8 hover:shadow-[0_12px_32px_rgba(0,0,0,0.28)] ${className}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/6" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.03),transparent_55%)]" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}