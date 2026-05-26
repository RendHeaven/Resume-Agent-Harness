#!/usr/bin/env node
// 按文件路径自动选 schema 校验输出 JSON
//   reviews/*.json         → schemas/review.schema.json
//   evals/panel/*.json     → schemas/panel-report.schema.json
//   evals/runs/*.json      → schemas/eval-run.schema.json
//   gaps/*.json            → schemas/gap.schema.json
//
// Usage: node scripts/validate-output.mjs <path> [<path> ...]
// Exit 0 = 全部通过；非零 = 至少一个失败

import { readFileSync, existsSync } from "node:fs";
import { resolve, sep } from "node:path";
import { loadSchema, validate } from "./lib/json-schema-mini.mjs";

const SCHEMA_MAP = [
  { match: (p) => p.includes(`reviews${sep}`) && p.endsWith(".json"), schema: "schemas/review.schema.json" },
  { match: (p) => p.includes(`evals${sep}panel${sep}`) && p.endsWith(".json"), schema: "schemas/panel-report.schema.json" },
  { match: (p) => p.includes(`evals${sep}runs${sep}`) && p.endsWith(".json"), schema: "schemas/eval-run.schema.json" },
  { match: (p) => p.includes(`gaps${sep}`) && p.endsWith(".json"), schema: "schemas/gap.schema.json" },
];

function pickSchema(p) {
  // normalize separators for cross-platform pattern match
  const norm = p.split(/[\\/]/).join(sep);
  for (const m of SCHEMA_MAP) if (m.match(norm)) return m.schema;
  return null;
}

function checkOne(path) {
  const abs = resolve(path);
  if (!existsSync(abs)) return { ok: false, errors: [`${path}: file not found`] };

  const schemaPath = pickSchema(path);
  if (!schemaPath) {
    return { ok: true, skipped: true, errors: [], schema: null };
  }

  let data;
  try {
    let raw = readFileSync(abs, "utf8");
    if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1); // strip UTF-8 BOM
    data = JSON.parse(raw);
  } catch (e) {
    return { ok: false, errors: [`${path}: invalid JSON — ${e.message}`] };
  }

  const schema = loadSchema(schemaPath);
  const errors = validate(data, schema);
  return { ok: errors.length === 0, errors, schema: schemaPath };
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("usage: node scripts/validate-output.mjs <path> [<path> ...]");
  process.exit(2);
}

let failed = 0;
for (const p of args) {
  const r = checkOne(p);
  if (r.skipped) {
    console.log(`SKIP  ${p}  (no schema mapping; supported paths: reviews/*.json, evals/panel/*.json, evals/runs/*.json, gaps/*.json)`);
    continue;
  }
  if (r.ok) {
    console.log(`OK    ${p}  (${r.schema})`);
  } else {
    failed++;
    console.error(`FAIL  ${p}  (${r.schema || "no-schema"})`);
    for (const e of r.errors) console.error(`      - ${e}`);
  }
}
process.exit(failed === 0 ? 0 : 1);
