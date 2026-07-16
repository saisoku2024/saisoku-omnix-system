import { useCallback, useMemo, useState } from "react";

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
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);

  const loadOptions = useCallback(async (): Promise<ReportOptions> => {
    setLoadingOptions(true);

    try {
      return await getReportOptions();
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  const preview = useCallback(async (payload: PreviewRequest) => {
    setLoadingPreview(true);

    try {
      return await previewReport(payload);
    } finally {
      setLoadingPreview(false);
    }
  }, []);

  const exportDigitalExcel = useCallback(async (
    payload: ExportRequest
  ) => {
    setLoadingExport(true);

    try {
      return await exportDigital(payload);
    } finally {
      setLoadingExport(false);
    }
  }, []);

  const exportInboundExcel = useCallback(async (
    payload: ExportRequest
  ) => {
    setLoadingExport(true);

    try {
      return await exportInbound(payload);
    } finally {
      setLoadingExport(false);
    }
  }, []);

  const loading = useMemo(
    () => loadingOptions || loadingPreview || loadingExport,
    [loadingExport, loadingOptions, loadingPreview]
  );

  return {
    loading,
    loadingOptions,
    loadingPreview,
    loadingExport,
    loadOptions,
    preview,
    exportDigitalExcel,
    exportInboundExcel,
  };
}
