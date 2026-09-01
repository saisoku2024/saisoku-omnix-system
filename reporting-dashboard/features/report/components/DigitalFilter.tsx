"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ReportOptions } from "../types/report";

type FormType = {
  report_type: string;
  channel: string;
  brand: string;
  main_category: string;
  start_date: string;
  end_date: string;
  divisi: string;
  departemen: string;
  customer: string;
  nama_layanan: string;
  nama_sub_layanan: string;
  layanan_cc_non_cc: string;
  segment: string;
  sub_segment: string;
  kota: string;
};

type Props = {
  form: FormType;
  setForm: Dispatch<SetStateAction<FormType>>;
  options: ReportOptions;
};

const selectClassName =
  "w-full h-10 rounded-lg border border-(--c-border) bg-(--c-control) px-3 text-sm text-(--c-text) [color-scheme:dark]";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

export default function DigitalFilter({
  form,
  setForm,
  options,
}: Props) {
  const now = new Date();
  const currentMonth = MONTHS[now.getMonth()] || "Sep";
  const currentQuarter = `Q${Math.floor(now.getMonth() / 3) + 1}`;
  const currentYear = now.getFullYear();
  const YEARS = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  const getInitialFromForm = () => {
    if (form.start_date) {
      const parts = form.start_date.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
          return {
            month: MONTHS[m - 1],
            quarter: `Q${Math.ceil(m / 3)}`,
            year: y,
          };
        }
      }
    }
    return {
      month: currentMonth,
      quarter: currentQuarter,
      year: currentYear,
    };
  };

  const initialPreset = getInitialFromForm();

  const [granularity, setGranularity] = useState<"monthly" | "quarterly" | "yearly" | "custom">("monthly");
  const [selectedMonth, setSelectedMonth] = useState(initialPreset.month);
  const [selectedQuarter, setSelectedQuarter] = useState(initialPreset.quarter);
  const [selectedYear, setSelectedYear] = useState(initialPreset.year);

  const applyPreset = (gran: "monthly" | "quarterly" | "yearly" | "custom", month: string, q: string, y: number) => {
    setGranularity(gran);
    if (gran === "custom") return;

    let start = "";
    let end = "";

    if (gran === "monthly") {
      const monthMap: Record<string, number> = {
        Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
        Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12
      };
      const m = monthMap[month] || (new Date().getMonth() + 1);
      const lastDay = new Date(y, m, 0).getDate();
      start = `${y}-${String(m).padStart(2, "0")}-01`;
      end = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    } else if (gran === "quarterly") {
      const qMap: Record<string, [number, number]> = {
        Q1: [1, 3], Q2: [4, 6], Q3: [7, 9], Q4: [10, 12]
      };
      const [startM, endM] = qMap[q] || [7, 9];
      const lastDay = new Date(y, endM, 0).getDate();
      start = `${y}-${String(startM).padStart(2, "0")}-01`;
      end = `${y}-${String(endM).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    } else if (gran === "yearly") {
      start = `${y}-01-01`;
      end = `${y}-12-31`;
    }

    setForm((prev) => ({
      ...prev,
      start_date: start,
      end_date: end,
    }));
  };

  return (
    <div className="space-y-4">
      {/* Granularity Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-(--c-border) bg-(--c-control) p-1.5">
        {[
          { id: "monthly", label: "Bulanan (Monthly)" },
          { id: "quarterly", label: "Kuartal (Quarterly)" },
          { id: "yearly", label: "Tahunan (Yearly)" },
          { id: "custom", label: "Rentang Custom" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => applyPreset(item.id as "monthly" | "quarterly" | "yearly" | "custom", selectedMonth, selectedQuarter, selectedYear)}
            className={`h-8 rounded-lg px-3 text-xs font-semibold transition-all ${
              granularity === item.id
                ? "bg-sky-500 text-white shadow-sm"
                : "text-(--c-muted) hover:text-(--c-text)"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Preset Controls */}
        {granularity === "monthly" && (
          <>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase text-(--c-muted)">Pilih Bulan</label>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  applyPreset("monthly", e.target.value, selectedQuarter, selectedYear);
                }}
                className={selectClassName}
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m} className="bg-(--c-control) text-(--c-text)">{m}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase text-(--c-muted)">Pilih Tahun</label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  const y = Number(e.target.value);
                  setSelectedYear(y);
                  applyPreset("monthly", selectedMonth, selectedQuarter, y);
                }}
                className={selectClassName}
              >
                {YEARS.map((y) => (
                  <option key={y} value={y} className="bg-(--c-control) text-(--c-text)">{y}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {granularity === "quarterly" && (
          <>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase text-(--c-muted)">Pilih Kuartal</label>
              <select
                value={selectedQuarter}
                onChange={(e) => {
                  setSelectedQuarter(e.target.value);
                  applyPreset("quarterly", selectedMonth, e.target.value, selectedYear);
                }}
                className={selectClassName}
              >
                {QUARTERS.map((q) => (
                  <option key={q} value={q} className="bg-(--c-control) text-(--c-text)">{q}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase text-(--c-muted)">Pilih Tahun</label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  const y = Number(e.target.value);
                  setSelectedYear(y);
                  applyPreset("quarterly", selectedMonth, selectedQuarter, y);
                }}
                className={selectClassName}
              >
                {YEARS.map((y) => (
                  <option key={y} value={y} className="bg-(--c-control) text-(--c-text)">{y}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {granularity === "yearly" && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase text-(--c-muted)">Pilih Tahun</label>
            <select
              value={selectedYear}
              onChange={(e) => {
                const y = Number(e.target.value);
                setSelectedYear(y);
                applyPreset("yearly", selectedMonth, selectedQuarter, y);
              }}
              className={selectClassName}
            >
              {YEARS.map((y) => (
                <option key={y} value={y} className="bg-(--c-control) text-(--c-text)">{y}</option>
              ))}
            </select>
          </div>
        )}

        {/* Channel */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase text-(--c-muted)">
            Channel
          </label>
          <select
            value={form.channel}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                channel: e.target.value,
              }))
            }
            className={selectClassName}
          >
            <option value="" className="bg-(--c-control) text-(--c-text)">All Channel</option>
            {options.channels.map((item) => (
              <option key={item} value={item} className="bg-(--c-control) text-(--c-text)">
                {item}
              </option>
            ))}
          </select>
        </div>

        {/* Main Category */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase text-(--c-muted)">
            Main Category
          </label>
          <select
            value={form.main_category}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                main_category: e.target.value,
              }))
            }
            className={selectClassName}
          >
            <option value="" className="bg-(--c-control) text-(--c-text)">All Category</option>
            {options.main_categories.map((item) => (
              <option key={item} value={item} className="bg-(--c-control) text-(--c-text)">
                {item}
              </option>
            ))}
          </select>
        </div>

        {/* Brand */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase text-(--c-muted)">
            Brand
          </label>
          <select
            value={form.brand}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                brand: e.target.value,
              }))
            }
            className={selectClassName}
          >
            <option value="" className="bg-(--c-control) text-(--c-text)">All Brand</option>
            {options.brands.map((item) => (
              <option key={item} value={item} className="bg-(--c-control) text-(--c-text)">
                {item}
              </option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase text-(--c-muted)">
            Date From
          </label>
          <input
            type="date"
            value={form.start_date}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                start_date: e.target.value,
              }))
            }
            className="w-full h-10 rounded-lg border border-(--c-border) bg-(--c-control) px-3 text-sm"
          />
        </div>

        {/* Date End */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase text-(--c-muted)">
            Date End
          </label>
          <input
            type="date"
            value={form.end_date}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                end_date: e.target.value,
              }))
            }
            className="w-full h-10 rounded-lg border border-(--c-border) bg-(--c-control) px-3 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
