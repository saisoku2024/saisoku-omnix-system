import Sidebar from "@/components/layout/Sidebar";

export default function RootLayout({ children }) {
return ( <html> <body className="bg-slate-900 text-white"> <div className="flex"> <Sidebar /> <div className="flex-1 p-6">{children}</div> </div> </body> </html>
);
}
