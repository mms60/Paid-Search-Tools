import test from "node:test";
import assert from "node:assert/strict";
test("tool package includes crawler, schema and connector endpoints", async()=>{
  const fs=await import("node:fs");
  for(const f of ["netlify/functions/start-scan.mjs","netlify/functions/scan-background.mjs","netlify/functions/schema-generate.mjs","netlify/functions/stripe-webhook.mjs","supabase/migrations/001_paid_ai_tools.sql","public/app.js"]){
    assert.ok(fs.existsSync(new URL("../"+f,import.meta.url)),`Missing ${f}`);
  }
});
