export default function Loading() {
  return (
    <div className="w-full h-full p-8 space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="h-64 bg-gray-200 rounded w-full mt-8"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
}
