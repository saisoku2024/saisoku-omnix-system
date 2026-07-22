import {
  ActivityIcon,
  AudioLinesIcon,
  BotIcon,
  FileSpreadsheetIcon,
  PieChartIcon,
  ShieldCheckIcon,
  TerminalSquareIcon,
  Trash2Icon,
  UploadIcon,
  UsersIcon,
} from "lucide-react"

import type { SidebarMenuItem, SidebarUser, Team } from "@/types/sidebar"

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
      {
        title: "Data Cleanup",
        url: "/data-management/data-cleanup",
        icon: <Trash2Icon />,
      },
    ],
  },
  {
    title: "Management System",
    url: "#",
    icon: <ShieldCheckIcon />,
    roles: ["super_admin", "admin"],
    items: [
      {
        title: "User & Access Control",
        url: "/management-system/users",
        icon: <UsersIcon />,
      },
      {
        title: "Audit Logs & Activity",
        url: "/management-system/audit-logs",
        icon: <ActivityIcon />,
      },
    ],
  },
]

export const sidebarUser: SidebarUser = {
  name: "Admin",
  email: "admin@omnix.com",
  avatar: "https://i.pravatar.cc/100",
}

export const sidebarTeams: Team[] = [
  {
    name: "INSIGHT WORKSPACE",
    logo: (
      <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
        <rect width="28" height="28" rx="7" fill="#0ea5e9" />
        <rect x="7" y="16" width="3" height="6" rx="1.5" fill="white" opacity="0.55" />
        <rect x="12" y="11" width="3" height="11" rx="1.5" fill="white" opacity="0.78" />
        <rect x="17" y="6" width="3" height="16" rx="1.5" fill="white" />
      </svg>
    ),
    plan: "Analytics Platform",
  },
]
