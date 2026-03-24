import { NextResponse } from "next/server"

/**
 * PDF generation is handled exclusively by the Supabase Edge Function
 * `generate-receipts`, which claims rows via `claim_handover_receipt_job()` and
 * uploads to `paket/{user_id}/{handover_id}/receipt_{handover_id}.pdf`.
 *
 * Schedule: HTTP POST to the function URL on an interval (see Supabase Cron /
 * pg_cron / external scheduler). This route remains for backwards compatibility
 * and diagnostics only.
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      delegated: true,
      message:
        "Receipt PDFs are generated only by the Edge Function `generate-receipts`. " +
        "Ensure migration `029_receipt_worker_claim.sql` is applied and schedule POST " +
        "requests to that function (e.g. every minute)."
    },
    { status: 410 }
  )
}
