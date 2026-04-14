export default function ChannelTable({ data }: { data?: any[] }) {
  if (!data || data.length === 0) {
    return <div className="text-gray-400">No channel data</div>
  }

  const total = data.reduce((acc, item) => acc + item.total, 0)

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border">
      <h3 className="font-semibold mb-4">Channel Performance</h3>

      <div className="space-y-4">
        {data.map((item, i) => {
          const percent = total ? (item.total / total) * 100 : 0

          return (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <span>{item.channel}</span>
                <span>{item.total}</span>
              </div>

              <div className="w-full bg-gray-100 h-2 rounded">
                <div
                  className="bg-blue-500 h-2 rounded"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}