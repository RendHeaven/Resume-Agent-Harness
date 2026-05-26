#!/usr/bin/env node
// afterFileEdit: 按编辑路径分发到对应 scripts/*.mjs 校验
//
// stdin 含 file_path（相对 workspace 根）
//
// 路由表：
//   reviews/*.json         → validate-output.mjs
//   evals/panel/*.json     → validate-output.mjs + redact-pii.mjs
//   evals/runs/*.json      → validate-output.mjs + redact-pii.mjs
//   gaps/*.json            → validate-output.mjs + redact-pii.mjs
//   resumes/working/*.md   → score-resume.mjs
//   resumes/output/*.md    → score-resume.mjs
//
// 失败：发到 stderr 让 IDE 显示，但**不阻断**（afterFileEdit 是通知钩子，
// stdout 被忽略；阻断须在 beforeShellExecution / preToolUse 层做）。
// 设计动机：失败信息通过 IDE 日志反馈给 Agent，让 Agent 在下一回合自行修复，
// 而不是把会话锁死在 hook 里。

import { readJsonStdin, normalizePath, runNode, emitNotice } from "./lib/hook-utils.mjs";

const ROUTES = [
  { re: /^reviews\/.+\.json$/i, scripts: ["scripts/validate-output.mjs"] },
  { re: /^evals\/panel\/.+\.json$/i, scripts: ["scripts/validate-output.mjs", "scripts/redact-pii.mjs"] },
  { re: /^evals\/runs\/.+\.json$/i, scripts: ["scripts/validate-output.mjs", "scripts/redact-pii.mjs"] },
  { re: /^gaps\/.+\.json$/i, scripts: ["scripts/validate-output.mjs", "scripts/redact-pii.mjs"] },
  { re: /^resumes\/(working|output)\/.+\.md$/i, scripts: ["scripts/score-resume.mjs"] },
];

const input = await readJsonStdin();
const file = normalizePath(input?.file_path || "");

if (!file) emitNotice("");

const route = ROUTES.find((r) => r.re.test(file));
if (!route) emitNotice("");

const failures = [];
for (const script of route.scripts) {
  const r = runNode(script, [file]);
  if (r.code !== 0) {
    failures.push(`${script} exit=${r.code}\n${(r.stdout + r.stderr).trim()}`);
  }
}

if (failures.length === 0) {
  emitNotice(`${file} ✓ ${route.scripts.length} check(s) passed`);
} else {
  emitNotice(`${file} ✗ ${failures.length} check(s) failed:\n${failures.join("\n---\n")}`);
}
