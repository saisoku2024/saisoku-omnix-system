"use client"

import { useEffect, useState } from "react";
import { useReport } from "@/features/report/hooks/useReport";
import { downloadExcel } from "@/features/report/utils/download"; // Import helper download
import type { ReportOptions } from "@/features/report/types/report";
import { 
  FileSpreadsheet, 
  Smartphone, 
  Headphones, 
  History,
} from "lucide-react"

import Card from "@/shared/ui/Card"
import CardHeader from "@/features/omnix/components/CardHeader"

export default function ReportCenterPage() {
  const [module, setModule] = useState<"digital" | "voice">("digital");
  const {
    loading,
    loadOptions,
    preview,
    exportDigitalExcel,
    exportInboundExcel,
  } = useReport();

  const [options, setOptions] = useState<ReportOptions | null>(null);
  const [form, setForm] = useState({
    report_type: "",
    channel: "",
    brand: "",
    main_category: "",
    start_date: "",
    end_date: "",
    divisi: "",
    departemen: "",
    customer: "",
    nama_layanan: "",
    nama_sub_layanan: "",
    layanan_cc_non_cc: "",
    segment: "",
    sub_segment: "",
    kota: "",
  });

  useEffect(() => {
    const init = async () => {
      try {
        const result = await loadOptions();
        setOptions(result);
      } catch (err) {
        console.error("Failed to load report options", err);
      }
    };
    init();
  }, [loadOptions]);

  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setForm({
      report_type: "",
      channel: "",
      brand: "",
      main_category: "",
      start_date: "",
      end_date: "",
      divisi: "",
      departemen: "",
      customer: "",
      nama_layanan: "",
      nama_sub_layanan: "",
      layanan_cc_non_cc: "",
      segment: "",
      sub_segment: "",
      kota: "",
    });
  };

  const handlePreview = async () => {
    try {
      const result = await preview({
        report_type: form.report_type,
        channel: form.channel || undefined,
        brand: form.brand || undefined,
        main_category: form.main_category || undefined,
        start_date: form.start_date,
        end_date: form.end_date,
      });
      console.log(result);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = async () => {
    try {
      const payload = {
        ...form,
        channel: form.channel || undefined,
        brand: form.brand || undefined,
        main_category: form.main_category || undefined,
      };

      let blob: Blob;

      if (module === "digital") {
        blob = await exportDigitalExcel(payload);
        downloadExcel(
          blob,
          `traffic_digital_${new Date().toISOString().slice(0, 10)}.xlsx`
        );
      } else {
        blob = await exportInboundExcel(payload);
        downloadExcel(
          blob,
          `traffic_inbound_${new Date().toISOString().slice(0, 10)}.xlsx`
        );
      }
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  return (
    <div className="p-5 gap-4 flex flex-col max-w-[1400px] mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between pb-4 border-b border-(--c-border)">
        <div>
          <h1 className="flex items-center gap-3 text-[17px] font-semibold text-(--c-text)">
            <FileSpreadsheet className="h-5 w-5 text-sky-500" />
            Report Center
          </h1>
        </div>
        <button className="flex h-9 items-center gap-2 rounded-lg border border-(--c-border) bg-(--c-control) px-4 text-sm font-medium transition-colors hover:bg-(--c-surface)">
          <History className="h-4 w-4" />
          Export History
        </button>
      </div>

      {/* MODULE SELECTOR */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[
          { id: "digital", label: "Digital Traffic", desc: "Omnichannel Report", icon: Smartphone },
          { id: "voice", label: "Voice Traffic", desc: "Call Center Report", icon: Headphones },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setModule(item.id as "digital" | "voice")}
            className={`group rounded-xl border p-4 px-5 text-left transition-all ${
              module === item.id 
                ? "border-sky-500 bg-sky-500/10" 
                : "border-(--c-border) bg-(--c-surface) hover:border-sky-500/40 hover:bg-(--c-control)"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${module === item.id ? "bg-sky-500/15" : "bg-(--c-control)"}`}>
                <item.icon className="h-5 w-5 text-sky-500" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-(--c-text)">{item.label}</h2>
                <p className="text-[12px] text-(--c-muted)">{item.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* CONFIGURATION CARD */}
      <Card>
        <CardHeader title="Report Configuration" />
        <div className="p-5 grid grid-cols-2 gap-4">
          
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase text-(--c-muted)">Report Type</label>
            <select 
              value={form.report_type}
              onChange={(e) => handleInputChange("report_type", e.target.value)}
              className="w-full h-10 rounded-lg border border-(--c-border) bg-(--c-control) px-3 text-sm outline-none focus:border-sky-500 transition-all"
            >
              <option value="">Select Report Type</option>
              {options?.report_types.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase text-(--c-muted)">Channel</label>
            <select 
              value={form.channel}
              onChange={(e) => handleInputChange("channel", e.target.value)}
              className="w-full h-10 rounded-lg border border-(--c-border) bg-(--c-control) px-3 text-sm outline-none focus:border-sky-500 transition-all"
            >
              <option value="">Select Channel</option>
              {options?.channels.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase text-(--c-muted)">Brand</label>
            <select 
              value={form.brand}
              onChange={(e) => handleInputChange("brand", e.target.value)}
              className="w-full h-10 rounded-lg border border-(--c-border) bg-(--c-control) px-3 text-sm outline-none focus:border-sky-500 transition-all"
            >
              <option value="">Select Brand</option>
              {options?.brands.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase text-(--c-muted)">Main Category</label>
            <select 
              value={form.main_category}
              onChange={(e) => handleInputChange("main_category", e.target.value)}
              className="w-full h-10 rounded-lg border border-(--c-border) bg-(--c-control) px-3 text-sm outline-none focus:border-sky-500 transition-all"
            >
              <option value="">Select Main Category</option>
              {options?.main_categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase text-(--c-muted)">Start Date</label>
            <input 
              type="date"
              value={form.start_date}
              onChange={(e) => handleInputChange("start_date", e.target.value)}
              className="w-full h-10 rounded-lg border border-(--c-border) bg-(--c-control) px-3 text-sm outline-none focus:border-sky-500 transition-all" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase text-(--c-muted)">End Date</label>
            <input 
              type="date"
              value={form.end_date}
              onChange={(e) => handleInputChange("end_date", e.target.value)}
              className="w-full h-10 rounded-lg border border-(--c-border) bg-(--c-control) px-3 text-sm outline-none focus:border-sky-500 transition-all" 
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 p-5 pt-0 border-t border-(--c-border) pt-5">
          <button onClick={handleReset} className="h-9 px-4 rounded-lg border border-(--c-border) font-medium text-sm hover:bg-(--c-control)">Reset</button>
          <button onClick={handlePreview} className="h-9 px-4 rounded-lg border border-(--c-border) font-medium text-sm hover:bg-(--c-control)">Preview</button>
          <button onClick={handleExport} className="h-9 px-4 rounded-lg bg-sky-600 text-white font-medium text-sm hover:bg-sky-700">Export Excel</button>
        </div>
      </Card>
    </div>
  )
}