import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // 1. Ambil yang perlu diproses
    const { data, error } = await supabase
      .from("handover")
      .select("id")
      .eq("status", "accepted")
      .neq("receipt_status", "done")
      .limit(5)

    if (error) {
      console.error("[cron] fetch error", error)
      return NextResponse.json({ ok: false })
    }

    for (const h of data || []) {
      try {
        console.log("[cron] processing", h.id)

        // set processing
        await supabase
          .from("handover")
          .update({ receipt_status: "processing" })
          .eq("id", h.id)

        // call generate
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/handover/generate-receipt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ handover_id: h.id }),
        })

      } catch (err) {
        console.error("[cron] retry later", h.id)

        await supabase
          .from("handover")
          .update({ receipt_status: "pending" })
          .eq("id", h.id)
      }
    }

    return NextResponse.json({ ok: true })

  } catch (e) {
    console.error("[cron] global error", e)
    return NextResponse.json({ ok: false })
  }
}