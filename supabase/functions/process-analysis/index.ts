// supabase/functions/process-analysis/index.ts

// @ts-ignore: Deno runtime import
import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
// @ts-ignore: Deno runtime import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.28.0";
// @ts-ignore: Deno runtime import
import { encode } from "https://deno.land/std@0.181.0/encoding/base64.ts";

declare const Deno: {
  env: { get(key: string): string | undefined };
};

const supabaseUrl    = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const openAiApiKey   = Deno.env.get("OPENAI_API_KEY")!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: CORS_HEADERS });
  }

  let payload: { id?: string; features?: any };
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400, headers: CORS_HEADERS });
  }

  const id = payload.id;
  const features = payload.features;
  if (!id || !features) {
    return new Response("Missing id or features", { status: 400, headers: CORS_HEADERS });
  }

  const prompt = `
You are a sports scientist and expert pickleball coach.
Here are the match features I extracted from a video:
${JSON.stringify(features, null, 2)}

1) Give me a one-sentence PERFORMANCE SUMMARY.
2) List KEY METRICS as bullets (e.g. "Average shot speed: 2.3 units/s").
3) Provide THREE SPECIFIC, ACTIONABLE RECOMMENDATIONS, each tied to one metric.
4) Echo back any time-stamped events in "events".

Return exactly this JSON shape:
{
  "summary": "...",
  "metrics": ["...", "...", "..."],
  "recommendations": ["...", "...", "..."],
  "events": [ /* original events */ ]
}
`;

  const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openAiApiKey}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      model:       "gpt-3.5-turbo",
      messages:    [{ role: "system", content: prompt }],
      temperature: 0.3,
      max_tokens:  300,
    }),
  });

  if (!aiRes.ok) {
    const err = await aiRes.text();
    console.error("OpenAI error:", err);
    await supabase.from("analyses").update({ status: "error" }).eq("id", id);
    return new Response("AI inference failed", { status: 502, headers: CORS_HEADERS });
  }

  const aiJson = await aiRes.json();
  let result;
  try {
    result = JSON.parse(aiJson.choices[0].message.content);
  } catch (e) {
    console.error("Parse error:", aiJson.choices[0].message.content);
    await supabase.from("analyses").update({ status: "error" }).eq("id", id);
    return new Response("Invalid AI response", { status: 502, headers: CORS_HEADERS });
  }

  const { error: updateErr } = await supabase
    .from("analyses")
    .update({
      status:       "complete",
      result_json:  result,
      completed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateErr) {
    console.error("Update error:", updateErr);
    return new Response("Update failed", { status: 500, headers: CORS_HEADERS });
  }

  return new Response(JSON.stringify({ success: true }), {
    status:  200,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
});
