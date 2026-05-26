#!/usr/bin/env node
// PII 扫描器：评测/差距记录强制
// 模式：手机号(中国 1[3-9]xxxx 11 位) / 邮箱 / 18 位身份证
// 命中即非零退出，输出行号 + 模式名（不输出原文，避免日志泄露）
//
// 仅对 evals/** 与 gaps/** 强制；其他路径 SKIP（仍扫描但 exit 0，警告而已）。
//
// Usage: node scripts/redact-pii.mjs <path> [<path> ...]

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const PATTERNS = [
  { name: "phone-cn", re: /(?<![0-9])1[3-9][0-9]{9}(?![0-9])/g },
  { name: "email", re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
  { name: "id-card-cn", re: /(?<![0-9])[1-9][0-9]{5}(?:19|20)[0-9]{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12][0-9]|3[01])[0-9]{3}[0-9Xx](?![0-9])/g },
];

const ALLOWLIST_TOKENS = ["<redacted>", "[PII]", "[REDACTED]", "example.com", "user@example", "13800138000"];

function isStrictPath(p) {
  const n = p.replace(/\\/g, "/");
  return n.startsWith("evals/") || n.includes("/evals/") || n.startsWith("gaps/") || n.includes("/gaps/");
}

function scanFile(path) {
  const abs = resolve(path);
  if (!existsSync(abs)) return { ok: false, reason: "not-found", hits: [] };
  const text = readFileSync(abs, "utf8");
  const lines = text.split(/\r?\n/);
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const { name, re } of PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line)) !== null) {
        const matched = m[0];
        if (ALLOWLIST_TOKENS.some((t) => matched.includes(t))) continue;
        hits.push({ line: i + 1, pattern: name });
      }
    }
  }
  return { ok: true, hits };
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("usage: node scripts/redact-pii.mjs <path> [<path> ...]");
  process.exit(2);
}

let strictFails = 0;
for (const p of args) {
  const r = scanFile(p);
  if (!r.ok) {
    console.error(`MISS  ${p}  (${r.reason})`);
    if (isStrictPath(p)) strictFails++;
    continue;
  }
  if (r.hits.length === 0) {
    console.log(`OK    ${p}  no PII`);
  } else {
    const strict = isStrictPath(p);
    const tag = strict ? "FAIL " : "WARN ";
    (strict ? console.error : console.warn)(`${tag} ${p}  ${r.hits.length} hit(s)`);
    for (const h of r.hits) (strict ? console.error : console.warn)(`      - line ${h.line}: ${h.pattern}`);
    if (strict) strictFails++;
  }
}
process.exit(strictFails === 0 ? 0 : 1);
