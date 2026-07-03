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
    isActive: true,
  },

  {
    title: "Detail Monitoring",
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
    title: "Principal Report",
    url: "/reports/principal",
    icon: <FileSpreadsheetIcon />,
  },

  {
    title: "Upload Data",
    url: "/upload",
    icon: <UploadIcon />,
  },
]