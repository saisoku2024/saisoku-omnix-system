export interface PreviewRequest {
  report_type: string;
  start_date: string;
  end_date: string;
  channel?: string;
  brand?: string;
  main_category?: string;
}

export interface ExportRequest {
  report_type: string;

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

  channel?: string;
  brand?: string;
  main_category?: string;
}

export interface ReportOptions {
  report_types: {
    label: string;
    value: string;
  }[];

  channels: string[];

  brands: string[];

  main_categories: string[];
}

export type PreviewRow = Record<string, string | number | boolean | null>;

export type PreviewResponse = PreviewRow[];
