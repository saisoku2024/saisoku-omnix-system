"use client"

import { useEffect, useState } from "react";
import { useReport } from "@/features/report/hooks/useReport";
import { downloadExcel } from "@/features/report/utils/download";
import type { ReportOptions, ExportRequest } from "@/features/report/types/report";
import { FileSpreadsheet, Smartphone, Headphones, History } from "lucide-react";
import Card from "@/shared/ui/Card";
import CardHeader from "@/features/omnix/components/CardHeader";

export default function ReportCenterPage() {
  const [module, setModule] = useState<"digital" | "voice">("digital");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  
  const { loadOptions, preview, exportDigitalExcel, exportInboundExcel } = useReport();
  const [options, setOptions] = useState<ReportOptions | null>(null);
  
  const [form, setForm] = useState({
    channel: "", brand: "", main_category: "", start_date: "", end_date: "",
    divisi: "", departemen: "", customer: "", nama_layanan: "",
    nama_sub_layanan: "", layanan_cc_non_cc: "", segment: "", sub_segment: "", kota: "",
  });

  const dateSuffix = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  useEffect(() => {
    loadOptions().then(setOptions).catch(console.error);
  }, [loadOptions]);

  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setForm({
      channel: "", brand: "", main_category: "", start_date: "", end_date: "",
      divisi: "", departemen: "", customer: "", nama_layanan: "",
      nama_sub_layanan: "", layanan_cc_non_cc: "", segment: "", sub_segment: "", kota: "",
    });
  };

  const handlePreview = async () => {
    if (!form.start_date || !form.end_date) return alert("Please select dates.");
    
    setPreviewLoading(true);
    try {
      await preview({
        ...form,
        report_type: module === "digital" ? "traffic_digital" : "traffic_inbound",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExport = async () => {
    if (!form.start_date || !form.end_date) return alert("Please select dates.");
    
    setExportLoading(true);
    try {
      const payload: ExportRequest = {
        ...form,
        channel: form.channel || undefined,
        brand: form.brand || undefined,
        main_category: form.main_category || undefined,
      };

      if (module === "digital") {
        const blob = await exportDigitalExcel(payload);
        downloadExcel(blob, `Traffic_Digital_${dateSuffix}.xlsx`);
      } else {
        const blob = await exportInboundExcel(payload);
        downloadExcel(blob, `Traffic_Inbound_${dateSuffix}.xlsx`);
      }
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExportLoading(false);
    }
  };

  // ... (JSX render tetap sama, gunakan previewLoading & exportLoading pada tombol)
}