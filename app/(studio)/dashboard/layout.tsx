export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen bg-[#FAF9F6] text-[#3E2723]">
      {children}
    </div>
  )
}
