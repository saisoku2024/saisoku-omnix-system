"use client";

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

export default function DigitalFilter({
  form,
  setForm,
  options,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

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
          className="w-full h-10 rounded-lg border border-(--c-border) bg-(--c-control) px-3 text-sm"
        >
          <option value="">All Category</option>

          {options.main_categories.map((item) => (
            <option key={item} value={item}>
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
          className="w-full h-10 rounded-lg border border-(--c-border) bg-(--c-control) px-3 text-sm"
        >
          <option value="">All Brand</option>

          {options.brands.map((item) => (
            <option key={item} value={item}>
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
  );
}