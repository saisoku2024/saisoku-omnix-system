"use client";

type Props = {
  data: any[];
};

export default function ReportPreviewTable({ data }: Props) {
  return (
    <div className="border rounded-lg p-4">
      <h3>Preview Table</h3>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}