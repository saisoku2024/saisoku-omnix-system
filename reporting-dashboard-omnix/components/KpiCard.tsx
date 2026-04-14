type Props = {
  title: string
  value: string | number
  color: string
}

export default function KpiCard({ title, value, color }: Props) {
  return (
    <div className={`bg-[#161b27] border-t-4 ${color} p-5 rounded-lg shadow-md`}>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
        {title}
      </p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}