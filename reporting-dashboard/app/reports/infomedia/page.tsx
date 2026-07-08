"use client"

import { useEffect, useState } from "react";
import { useReport } from "@/features/report/hooks/useReport";
import { downloadExcel } from "@/features/report/utils/download";
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
  
  // Hapus report_type dari state form
  const [form, setForm] = useState({
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

  // Helper untuk menentukan tipe report secara dinamis
  const getReportType = () => (module === "digital" ? "traffic_digital" : "traffic_inbound");

  const handlePreview = async () => {
    if (!form.start_date || !form.end_date) {
      alert("Please select Start Date and End Date.");
      return;
    }

    try {
      await preview({
        ...form,
        report_type: getReportType(),
        channel: form.channel || undefined,
        brand: form.brand || undefined,
        main_category: form.main_category || undefined,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = async () => {
    if (!form.start_date || !form.end_date) {
      alert("Please select Start Date and End Date.");
      return;
    }

    try {
      const payload = {
        ...form,
        report_type: getReportType(), // Tentukan secara dinamis
        channel: form.channel || undefined,
        brand: form.brand || undefined,
        main_category: form.main_category || undefined,
      };

      let blob: Blob;
      if (module === "digital") {
        blob = await exportDigitalExcel(payload);
        downloadExcel(blob, `traffic_digital_${new Date().toISOString().slice(0, 10)}.xlsx`);
      } else {
        blob = await exportInboundExcel(payload);
        downloadExcel(blob, `traffic_inbound_${new Date().toISOString().slice(0, 10)}.xlsx`);
      }
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  return (
    <div className="p-5 gap-4 flex flex-col max-w-[1400px] mx-auto">
      {/* ... (Header dan Module Selector tetap sama) ... */}
      
      <Card>
        <CardHeader title="Report Configuration" />
        <div className="p-5 grid grid-cols-2 gap-4">
           {/* (Input Fields Channel, Brand, dll tetap sama) */}
           {/* Note: Report Type dropdown sudah tidak diperlukan lagi */}
           
           {/* ... Input Fields ... */}
        </div>
        
        {/* Tombol tetap sama, dengan handle yang sudah diupdate */}
      </Card>
    </div>
  )
}