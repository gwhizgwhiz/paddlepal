// supabase/functions/process-analysis/index.ts

// @ts-ignore: Deno runtime import
import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
// pull in Supabase client via esm.sh
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.28.0";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase    = createClient(supabaseUrl, serviceKey);

const BUCKET = "match-videos";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let payload: { id?: string };
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const analysisId = payload.id;
  if (!analysisId) {
    return new Response("Missing analysis ID", { status: 400 });
  }

  // 1) Fetch the queued analysis
  const { data: row, error: selectErr } = await supabase
    .from("analyses")
    .select("user_id, video_path")
    .eq("id", analysisId)
    .single();

  if (selectErr || !row) {
    console.error("Fetch error:", selectErr);
    return new Response("Not found", { status: 404 });
  }

  const { user_id, video_path } = row;
  // right before download in index.ts
console.log("📥 Downloading from bucket ‘match-videos’: path =", video_path);
console.log("📥 Attempting download of path:", video_path);



  // 2) Download the video
  const { data: fileData, error: downloadErr } = await supabase
    .storage
    .from(BUCKET)
    .download(video_path);

  if (downloadErr || !fileData) {
    console.error("Download error:", downloadErr);
    await supabase
      .from("analyses")
      .update({ status: "error" })
      .eq("id", analysisId);
    return new Response("Download failed", { status: 500 });
  }

  // 3) Run AI analysis (stub)
  const result = {
    note: `Processed by Edge Function at ${new Date().toISOString()}`,
  };

  // 4) Update the analysis row
  const { error: updateErr } = await supabase
    .from("analyses")
    .update({
      status: "complete",
      result_json: result,
      completed_at: new Date().toISOString(),
    })
    .eq("id", analysisId);

  if (updateErr) {
    console.error("Update error:", updateErr);
    return new Response("Update failed", { status: 500 });
  }

  // 5) Clean up the video file
  const { error: removeErr } = await supabase
    .storage
    .from(BUCKET)
    .remove([video_path]);

  if (removeErr) {
    console.warn("Cleanup warning:", removeErr);
  }

  return new Response(JSON.stringify({ success: true, analysisId }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
