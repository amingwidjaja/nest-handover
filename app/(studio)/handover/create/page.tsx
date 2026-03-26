import { HandoverCreateForm } from "@/components/nest/handover-create-form"
import { loadHandoverEditableForPage } from "@/lib/handover-editable"

export default async function HandoverCreatePage({
  searchParams
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const sp = await searchParams
  const initialData = await loadHandoverEditableForPage(sp?.id)
  return <HandoverCreateForm initialData={initialData} />
}
