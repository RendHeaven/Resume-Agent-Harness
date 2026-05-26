#!/usr/bin/env node
// 静态扫所有 .md / .mdc 文件中的相对链接，断链非零退出
//
// 提取：[text](relative/path[#anchor]) 中 path 不以 http://、https://、mailto: 开头者
// 跳过：纯锚点（#xxx）；data: 开头；以 / 开头的绝对路径；以 file:// 开头
//
// Usage: node scripts/check-doc-refs.mjs [<root>]
// Exit 0 = 全部存在；非零 = 至少一个断链

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, isAbsolute } from "node:path";

const ROOT = resolve(process.argv[2] || ".");
const SKIP_DIRS = new Set(["node_modules", ".git", ".cursor/agent-transcripts"]);

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (/\.(md|mdc)$/i.test(entry)) acc.push(p);
  }
  return acc;
}

const LINK_RE = /\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

function checkFile(file) {
  const text = readFileSync(file, "utf8");
  const errors = [];
  let m;
  LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(text)) !== null) {
    let href = m[2];
    if (/^(https?:|mailto:|tel:|data:|file:|#)/i.test(href)) continue;
    if (href.startsWith("<") && href.endsWith(">")) href = href.slice(1, -1);
    // strip anchor
    const hashIdx = href.indexOf("#");
    if (hashIdx >= 0) href = href.slice(0, hashIdx);
    if (!href) continue; // pure anchor
    // strip query
    const qIdx = href.indexOf("?");
    if (qIdx >= 0) href = href.slice(0, qIdx);

    let target;
    if (isAbsolute(href)) target = href;
    else target = resolve(dirname(file), href);

    if (!existsSync(target)) {
      // try url-decoded
      let decoded = null;
      try { decoded = decodeURIComponent(href); } catch {}
      if (decoded && decoded !== href) {
        const target2 = isAbsolute(decoded) ? decoded : resolve(dirname(file), decoded);
        if (existsSync(target2)) continue;
      }
      errors.push({ href: m[2], resolved: target });
    }
  }
  return errors;
}

const files = walk(ROOT);
let totalBroken = 0;
const failingFiles = [];
for (const f of files) {
  const errs = checkFile(f);
  if (errs.length === 0) continue;
  totalBroken += errs.length;
  failingFiles.push({ f, errs });
}

if (failingFiles.length === 0) {
  console.log(`OK    ${files.length} md/mdc files, 0 broken links`);
  process.exit(0);
}

console.error(`FAIL  ${totalBroken} broken link(s) across ${failingFiles.length} file(s):`);
for (const { f, errs } of failingFiles) {
  console.error(`  ${f}`);
  for (const e of errs) console.error(`    - ${e.href}  →  ${e.resolved}`);
}
process.exit(1);
