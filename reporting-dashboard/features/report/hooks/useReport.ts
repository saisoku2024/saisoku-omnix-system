import { useState } from "react";

import {
  getReportOptions,
  previewReport,
  exportDigital,
  exportInbound,
} from "../api";

import {
  ExportRequest,
  PreviewRequest,
  ReportOptions,
} from "../types/report";

export function useReport() {
  const [loading, setLoading] = useState(false);

  const loadOptions = async (): Promise<ReportOptions> => {
    setLoading(true);

    try {
      return await getReportOptions();
    } finally {
      setLoading(false);
    }
  };

  const preview = async (payload: PreviewRequest) => {
    setLoading(true);

    try {
      return await previewReport(payload);
    } finally {
      setLoading(false);
    }
  };

  const exportDigitalExcel = async (
    payload: ExportRequest
  ) => {
    setLoading(true);

    try {
      return await exportDigital(payload);
    } finally {
      setLoading(false);
    }
  };

  const exportInboundExcel = async (
    payload: ExportRequest
  ) => {
    setLoading(true);

    try {
      return await exportInbound(payload);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    loadOptions,
    preview,
    exportDigitalExcel,
    exportInboundExcel,
  };
}