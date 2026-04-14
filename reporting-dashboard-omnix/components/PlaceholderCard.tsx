type Props = {
  title: string
  desc: string
}

export default function PlaceholderCard({ title, desc }: Props) {
  return (
    <div className="bg-[#161b27] border border-[#2f3a52] rounded-xl p-5 opacity-60">
      <h3 className="text-sm font-bold mb-2">{title}</h3>
      <p className="text-xs text-gray-500 italic">{desc}</p>
    </div>
  )
}