type Props = {
  title: string
  subtitle: string
}

export default function Header({ title, subtitle }: Props) {
  return (
    <div className="flex justify-between items-end">
      <div>
        <nav className="text-xs text-gray-500 mb-1">
          OMNIX › <span className="text-blue-400">Reporting</span>
        </nav>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-gray-400 font-medium">{subtitle}</p>
      </div>

      <div className="bg-[#1c2333] border border-[#2f3a52] px-4 py-2 rounded-md text-xs text-gray-300">
        Apr 2026
      </div>
    </div>
  )
}