export default function Sidebar() {
  return (
    <div className="w-64 h-screen bg-white border-r p-4">
      <h2 className="font-bold text-lg mb-4">Omnix</h2>

      <ul className="space-y-2 text-sm">
        <li className="text-blue-600 font-medium">Dashboard</li>
        <li className="text-gray-500">Analytics</li>
        <li className="text-gray-500">Settings</li>
      </ul>
    </div>
  )
}