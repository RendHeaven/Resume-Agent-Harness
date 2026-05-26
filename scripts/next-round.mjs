#!/usr/bin/env node
// 计算指定 case 的下一安全 Step 4 round 序号，防止覆盖
//
// Usage: node scripts/next-round.mjs <name>
// 输出：单行整数 N（下一轮 = max(已存在 r{N}) + 1，初始为 1）
// 退出码 0：正常返回；非零：参数错误

import { readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const name = process.argv[2];
if (!name) {
  console.error("usage: node scripts/next-round.mjs <name>");
  process.exit(2);
}

const dir = resolve("evals/runs");
let next = 1;
if (existsSync(dir)) {
  const re = new RegExp(`^\\d{4}-\\d{2}-\\d{2}-${name.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}-r(\\d+)\\.json$`);
  let max = 0;
  for (const f of readdirSync(dir)) {
    const m = f.match(re);
    if (m) max = Math.max(max, Number(m[1]));
  }
  next = max + 1;
}
console.log(next);
