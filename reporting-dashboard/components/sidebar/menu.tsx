import {
  ActivityIcon,
  AudioLinesIcon,
  BotIcon,
  FileSpreadsheetIcon,
  PieChartIcon,
  TerminalSquareIcon,
  UploadIcon,
} from "lucide-react"

import type { SidebarMenuItem } from "./types"

export const sidebarMenu: SidebarMenuItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <PieChartIcon />,
  },

  {
    title: "Monitoring",
    url: "#",
    icon: <ActivityIcon />,

    items: [
      {
        title: "Omnix",
        url: "/monitoring/omnix",
        icon: <TerminalSquareIcon />,
      },

      {
        title: "Voice",
        url: "/monitoring/voice",
        icon: <AudioLinesIcon />,
      },

      {
        title: "CSAT",
        url: "/monitoring/csat",
        icon: <BotIcon />,
      },
    ],
  },

  {
    title: "Analytics & Reporting",
    url: "#",
    icon: <FileSpreadsheetIcon />,

    items: [
      {
        title: "Principal Report",
        url: "/reports/principal",
        icon: <FileSpreadsheetIcon />,
      },

      {
        title: "Infomedia Reporting",
        url: "/reports/infomedia",
        icon: <FileSpreadsheetIcon />,
      },

      {
        title: "Custom Report Builder",
        url: "/reports/custom_report_builder",
        icon: <FileSpreadsheetIcon />,
      },
    ],
  },

  {
    title: "Data Management",
    url: "#",
    icon: <UploadIcon />,

    items: [
      {
        title: "Upload Data",
        url: "/upload",
        icon: <UploadIcon />,
      },

      {
        title: "Customer Journey",
        url: "/data-management/customer-journey",
        icon: <TerminalSquareIcon />,
      },
    ],
  },
]