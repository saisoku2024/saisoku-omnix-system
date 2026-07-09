import {
  ExportRequest,
  PreviewRequest,
  ReportOptions,
} from "./types/report";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

const REPORT_API = `${API_BASE}/api/reports`;

async function handleResponse(response: Response) {
  if (!response.ok) {
    let message = "Request failed";

    try {
      const err = await response.json();

      console.error("========== API ERROR ==========");
      console.error("Status :", response.status);
      console.error("Response :", err);
      console.error("===============================");

      if (typeof err.detail === "string") {
        message = err.detail;
      } else {
        message = JSON.stringify(err);
      }
    } catch (e) {
      console.error(e);
    }

    throw new Error(message);
  }

  return response;
}

export async function getReportOptions(): Promise<ReportOptions> {
  const response = await fetch(`${REPORT_API}/options`);

  await handleResponse(response);

  return response.json();
}

export async function previewReport(
  payload: PreviewRequest
) {
  const response = await fetch(`${REPORT_API}/preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  await handleResponse(response);

  return response.json();
}

export async function exportDigital(
  payload: ExportRequest
) {
  const response = await fetch(`${REPORT_API}/export/digital`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  await handleResponse(response);

  return response.blob();
}

export async function exportInbound(
  payload: ExportRequest
) {
  const response = await fetch(`${REPORT_API}/export/inbound`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  await handleResponse(response);

  return response.blob();
}