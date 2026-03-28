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
      <main className="flex-1 flex flex-col pt-16 pb-24 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden px-6 pt-4">
          {children}
        </div>
      </main>
      <StudioFooter />
    </div>
  )
}
