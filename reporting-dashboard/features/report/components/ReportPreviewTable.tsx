"use client";

type Props = {
  data: any[];
};

export default function ReportPreviewTable({ data }: Props) {
  if (!data || data.length === 0) {
    return <div className="p-4 border rounded-lg text-sm text-gray-500">No data available</div>;
  }

  // Mengambil daftar kolom dari keys objek pertama
  const columns = Object.keys(data[0]);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="p-4 border-b bg-gray-50/50">
        <h3 className="font-semibold text-sm">Preview Table</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-4 py-3 font-semibold">{col.replace(/_/g, " ")}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col} className="px-4 py-2 text-gray-700">
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