"use client";

import type { PreviewRow } from "@/features/report/types/report";

type Props = {
  data: PreviewRow[];
};

export default function ReportPreviewTable({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-(--c-border) bg-(--c-control) px-4 py-8 text-center text-sm text-(--c-muted)">
        No data available
      </div>
    );
  }

  // Mengambil daftar kolom dari keys objek pertama
  const columns = Object.keys(data[0]);

  return (
    <div className="overflow-hidden rounded-xl border border-(--c-border) bg-(--c-surface)">
      <div className="border-b border-(--c-border) bg-(--c-control) px-4 py-3">
        <h3 className="text-sm font-semibold text-(--c-text)">Preview Table</h3>
      </div>
      <div className="max-h-[420px] overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="sticky top-0 bg-(--c-control) text-[11px] uppercase text-(--c-muted)">
            <tr>
              {columns.map((col) => (
                <th key={col} className="whitespace-nowrap px-4 py-3 font-semibold">{col.replace(/_/g, " ")}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-(--c-border)">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-(--c-control)">
                {columns.map((col) => (
                  <td key={col} className="whitespace-nowrap px-4 py-2.5 text-(--c-text)">
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
