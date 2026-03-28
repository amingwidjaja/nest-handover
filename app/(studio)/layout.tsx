import { StudioHeader } from "@/components/nest/studio-header"
import { StudioFooter } from "@/components/nest/studio-footer"

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#FAF9F6] text-[#3E2723]">
      <StudioHeader />
      <main className="flex-1 pt-16 pb-24 px-6 overflow-y-auto">
        {children}
      </main>
      <StudioFooter />
    </div>
  )
}
