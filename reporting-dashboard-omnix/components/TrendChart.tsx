import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

type Data = {
  month: string
  omnix: number
}

type Props = {
  data: Data[]
}

export default function TrendChart({ data }: Props) {
  return (
    <div className="lg:col-span-2 bg-[#161b27] border border-[#2f3a52] rounded-xl p-5 shadow-lg h-[350px]">
      <h3 className="text-sm font-bold mb-4">Case Trend</h3>

      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a3348" vertical={false} />
          <XAxis dataKey="month" stroke="#7a8aaa" fontSize={10} />
          <YAxis stroke="#7a8aaa" fontSize={10} />
          <Tooltip contentStyle={{ backgroundColor: '#1c2333', border: '1px solid #2f3a52' }} />
          <Bar dataKey="omnix" fill="#4d8fff" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}