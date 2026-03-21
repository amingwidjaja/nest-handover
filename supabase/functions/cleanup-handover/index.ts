import { serve } from "https://deno.land/std/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js"

serve(async () => {

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  const { data } = await supabase
    .from("handover_items")
    .select("photo_url")
    .not("photo_url", "is", null)

  if (!data) return new Response("no files")

  const files = data.map(r => r.photo_url.split("/").pop())

  await supabase
    .storage
    .from("nest-evidence")
    .remove(files)

  return new Response("cleanup done")

})