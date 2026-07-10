import { useCallback, useState } from "react";

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

  const loadOptions = useCallback(async (): Promise<ReportOptions> => {
    setLoading(true);

    try {
      return await getReportOptions();
    } finally {
      setLoading(false);
    }
  }, []);

  const preview = useCallback(async (payload: PreviewRequest) => {
    setLoading(true);

    try {
      return await previewReport(payload);
    } finally {
      setLoading(false);
    }
  }, []);

  const exportDigitalExcel = useCallback(async (
    payload: ExportRequest
  ) => {
    setLoading(true);

    try {
      return await exportDigital(payload);
    } finally {
      setLoading(false);
    }
  }, []);

  const exportInboundExcel = useCallback(async (
    payload: ExportRequest
  ) => {
    setLoading(true);

    try {
      return await exportInbound(payload);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    loadOptions,
    preview,
    exportDigitalExcel,
    exportInboundExcel,
  };
}
