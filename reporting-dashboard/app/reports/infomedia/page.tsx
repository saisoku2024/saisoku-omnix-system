"use client";

import { useState } from "react";
import {
  FileSpreadsheet,
  CalendarDays,
  Smartphone,
  Headphones,
  Download,
  Eye,
  RotateCcw,
  History,
} from "lucide-react";

export default function ReportCenterPage() {
  const [module, setModule] = useState<"digital" | "voice">("digital");

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <FileSpreadsheet className="h-8 w-8 text-sky-500" />
              Report Center
            </h1>

            <p className="mt-2 text-muted-foreground">
              Generate and export operational reports in Microsoft Excel format.
            </p>
          </div>

          <button className="flex items-center gap-2 rounded-lg border px-4 py-2 hover:bg-accent">
            <History className="h-4 w-4" />
            Export History
          </button>
        </div>
      </div>

      {/* Module */}
      <div className="grid grid-cols-2 gap-5">

        <button
          onClick={() => setModule("digital")}
          className={`rounded-2xl border p-6 text-left transition
          ${
            module === "digital"
              ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20"
              : "hover:bg-accent"
          }`}
        >
          <div className="flex items-center gap-4">
            <Smartphone className="h-8 w-8 text-sky-500" />
            <div>
              <h2 className="font-semibold text-lg">
                Digital Traffic
              </h2>

              <p className="text-sm text-muted-foreground">
                Omnichannel Report
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setModule("voice")}
          className={`rounded-2xl border p-6 text-left transition
          ${
            module === "voice"
              ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20"
              : "hover:bg-accent"
          }`}
        >
          <div className="flex items-center gap-4">
            <Headphones className="h-8 w-8 text-sky-500" />
            <div>
              <h2 className="font-semibold text-lg">
                Voice Traffic
              </h2>

              <p className="text-sm text-muted-foreground">
                Call Center Report
              </p>
            </div>
          </div>
        </button>

      </div>

      {/* Configuration */}
      <div className="rounded-2xl border bg-card p-6">

        <h2 className="mb-6 text-xl font-semibold">
          Report Configuration
        </h2>

        <div className="grid gap-5 md:grid-cols-2">

          <div>
            <label className="mb-2 block text-sm font-medium">
              Report Type
            </label>

            <select className="w-full rounded-lg border bg-background px-3 py-2">
              <option>Traffic</option>

              {module === "digital" && (
                <>
                  <option>KPI</option>
                  <option>CSAT</option>
                  <option>NPS</option>
                </>
              )}

              {module === "voice" && (
                <>
                  <option>KPI</option>
                  <option>QM Score</option>
                  <option>CSAT</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Channel
            </label>

            <select className="w-full rounded-lg border bg-background px-3 py-2">
              <option>All Channel</option>
              <option>WhatsApp</option>
              <option>Instagram</option>
              <option>Voice</option>
              <option>Email</option>
              <option>Live Chat</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Brand
            </label>

            <select className="w-full rounded-lg border bg-background px-3 py-2">
              <option>All Brand</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Main Category
            </label>

            <select className="w-full rounded-lg border bg-background px-3 py-2">
              <option>All Category</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Start Date
            </label>

            <div className="relative">
              <CalendarDays className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

              <input
                type="date"
                className="w-full rounded-lg border bg-background py-2 pl-10 pr-3"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              End Date
            </label>

            <div className="relative">
              <CalendarDays className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

              <input
                type="date"
                className="w-full rounded-lg border bg-background py-2 pl-10 pr-3"
              />
            </div>
          </div>

        </div>

        <div className="mt-8 flex justify-end gap-3">

          <button className="rounded-lg border px-5 py-2 hover:bg-accent flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>

          <button className="rounded-lg border px-5 py-2 hover:bg-accent flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </button>

          <button className="rounded-lg bg-green-600 px-5 py-2 text-white hover:bg-green-700 flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Excel
          </button>

        </div>

      </div>

      {/* Report Information */}
      <div className="rounded-2xl border bg-card p-6">

        <h2 className="mb-5 text-xl font-semibold">
          Report Information
        </h2>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

          <InfoCard title="Selected Report" value="Traffic Inbound" />
          <InfoCard title="Output Format" value="Microsoft Excel (.xlsx)" />
          <InfoCard title="Source" value="Omnix Cases" />
          <InfoCard title="Estimated Rows" value="15,240" />
          <InfoCard title="Generated By" value="Admin" />
          <InfoCard title="Last Generated" value="07 Jul 2026 16:25" />

        </div>

      </div>

    </div>
  );
}

function InfoCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <div className="text-sm text-muted-foreground">
        {title}
      </div>

      <div className="mt-2 text-lg font-semibold">
        {value}
      </div>
    </div>
  );
}