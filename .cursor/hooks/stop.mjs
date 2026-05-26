#!/usr/bin/env node
// stop: 任务完成时检查 8 项产出契约 + 触发 dashboard 自动更新
//
// 8 项契约见 .cursor/rules/resume-core.mdc。本脚本只 warn（不阻断），
// 因为 Agent 可能合理地"分阶段完成"（先做 Plan、后续会话再继续）。
// 真正的强制由 SKILL 流程 + rules + schema 完成。
//
// 同时：跑 aggregate-evals.mjs 刷新 evals/dashboard.md。

import { readdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { readJsonStdin, runNode, emitNotice } from "./lib/hook-utils.mjs";

const _ = await readJsonStdin();

// 找出当前会话可能涉及的 case：扫 plans/ 中今日的文件名
function findActiveCases() {
  const out = new Set();
  const today = new Date().toISOString().slice(0, 10);
  const dirs = ["plans", "reviews", "evals/runs", "gaps"];
  for (const d of dirs) {
    const p = resolve(d);
    if (!existsSync(p)) continue;
    for (const f of readdirSync(p)) {
      const m = f.match(/^(\d{4}-\d{2}-\d{2})-([^.]+?)(-r\d+)?\.(md|json)$/);
      if (!m) continue;
      if (m[1] === today) out.add(m[2]);
    }
  }
  return [...out];
}

const cases = findActiveCases();

const messages = [];

if (cases.length > 0) {
  for (const name of cases) {
    const today = new Date().toISOString().slice(0, 10);
    const expected = [
      { kind: "plan", paths: [`plans/${today}-${name}.md`] },
      { kind: "interview-prompt", paths: [`prompts/runtime/${today}-${name}.interviewer.system.md`] },
      { kind: "interview-review", paths: [`reviews/${today}-${name}.md`, `reviews/${today}-${name}.json`] },
      { kind: "working", paths: [`resumes/working/${name}.md`] },
      { kind: "output", paths: [`resumes/output/${name}.md`] },
      { kind: "eval-run", paths: globMatch(`evals/runs`, new RegExp(`^${today}-${name}-r\\d+\\.json$`)) },
      { kind: "panel", paths: globMatch(`evals/panel`, new RegExp(`^${today}-${name}-r\\d+-interviewer-[abc]\\.json$`)) },
      { kind: "gap", paths: [`gaps/${today}-${name}.md`, `gaps/${today}-${name}.json`] },
    ];

    const missing = [];
    for (const { kind, paths } of expected) {
      const ok = paths.length > 0 && paths.every((p) => existsSync(resolve(p)));
      if (!ok) missing.push(kind);
    }

    if (missing.length > 0) {
      messages.push(`case=${name}: 缺少 ${missing.length}/8 项契约: ${missing.join(", ")}`);
    } else {
      messages.push(`case=${name}: 8/8 契约齐全 ✓`);
    }
  }
}

// dashboard 刷新（best-effort）
const agg = runNode("scripts/aggregate-evals.mjs", []);
if (agg.code === 0) messages.push("evals/dashboard.md refreshed");
else messages.push(`aggregate-evals.mjs failed (exit=${agg.code})`);

emitNotice(messages.join("\n"));

function globMatch(dir, re) {
  const p = resolve(dir);
  if (!existsSync(p)) return [];
  return readdirSync(p)
    .filter((f) => re.test(f))
    .map((f) => join(dir, f).replace(/\\/g, "/"));
}
