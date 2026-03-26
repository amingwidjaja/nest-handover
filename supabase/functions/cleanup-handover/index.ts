/**
 * cleanup-handover — Edge Function untuk data retention
 *
 * Dipanggil setelah receipt_status = 'done' (PDF sudah generated).
 * Tugasnya:
 *   1. Hapus foto-foto dari Storage (hemat cost)
 *   2. Archive handover row (record_status = 'archived')
 *
 * Path storage: paket/[user_id]/[handover_id]/[filename]
 * Bug lama: .split("/").pop() hanya ambil filename, bukan full path.
 * Fix: pakai full photo_url path langsung.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  try {
    // Find handovers that are accepted + PDF done + not yet archived
    const { data: handovers, error: fetchErr } = await supabase
      .from("handover")
      .select("id, user_id")
      .eq("status", "accepted")
      .eq("receipt_status", "done")
      .eq("record_status", "active")
      .limit(50)

    if (fetchErr) {
      console.error("[cleanup] fetch handovers error:", fetchErr)
      return new Response(JSON.stringify({ error: fetchErr.message }), {
        status: 500,
        headers: corsHeaders,
      })
    }

    if (!handovers || handovers.length === 0) {
      return new Response(JSON.stringify({ message: "nothing to clean" }), {
        headers: corsHeaders,
      })
    }

    const handoverIds = handovers.map((h) => h.id)

    // Get all photo paths for these handovers
    const { data: items, error: itemsErr } = await supabase
      .from("handover_items")
      .select("handover_id, photo_url")
      .in("handover_id", handoverIds)
      .not("photo_url", "is", null)

    if (itemsErr) {
      console.error("[cleanup] fetch items error:", itemsErr)
    }

    // Get proof photos from receive_event
    const { data: events, error: eventsErr } = await supabase
      .from("receive_event")
      .select("handover_id, photo_url")
      .in("handover_id", handoverIds)
      .not("photo_url", "is", null)

    if (eventsErr) {
      console.error("[cleanup] fetch events error:", eventsErr)
    }

    // Collect all full storage paths (not just filenames!)
    const pathsToDelete: string[] = []

    for (const item of items ?? []) {
      if (item.photo_url && String(item.photo_url).trim()) {
        pathsToDelete.push(String(item.photo_url).trim())
      }
    }

    for (const evt of events ?? []) {
      if (evt.photo_url && String(evt.photo_url).trim()) {
        pathsToDelete.push(String(evt.photo_url).trim())
      }
    }

    // Delete from Storage in batches of 100
    let deletedCount = 0
    const BATCH = 100
    for (let i = 0; i < pathsToDelete.length; i += BATCH) {
      const batch = pathsToDelete.slice(i, i + BATCH)
      const { error: delErr } = await supabase.storage
        .from("nest-evidence")
        .remove(batch)

      if (delErr) {
        console.warn("[cleanup] storage delete error:", delErr.message)
      } else {
        deletedCount += batch.length
      }
    }

    // Archive handover rows (soft delete — preserve for legal/audit)
    const { error: archiveErr } = await supabase
      .from("handover")
      .update({ record_status: "archived" })
      .in("id", handoverIds)

    if (archiveErr) {
      console.error("[cleanup] archive error:", archiveErr)
    }

    // Clear photo_url from items and events (paths no longer valid)
    await supabase
      .from("handover_items")
      .update({ photo_url: null })
      .in("handover_id", handoverIds)

    await supabase
      .from("receive_event")
      .update({ photo_url: null })
      .in("handover_id", handoverIds)

    const result = {
      processed: handovers.length,
      photosDeleted: deletedCount,
      archived: !archiveErr,
    }

    console.log("[cleanup] done:", result)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("[cleanup] unexpected error:", err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
