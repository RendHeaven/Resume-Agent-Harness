#!/usr/bin/env node
// beforeShellExecution: 阻断危险命令 + 阻断对只读区的写入命令
//
// 阻断（exit 2）：
//   - 写入 intake/、resumes/input/、prompts/system/、schemas/、docs/adr/
//   - rm -rf / Remove-Item -Recurse -Force / git push --force / DROP DATABASE
// 允许：其他命令（含 read 操作 / 写入 working/output/plans/reviews/evals/gaps）
//
// 仅启发式：基于 command 字符串模式匹配。绕过仍可能（例如间接 IO），
// 因此不替代 .cursor/rules 与 schema 校验，作为第一道防线。

import { readJsonStdin, emitAllow, emitDeny } from "./lib/hook-utils.mjs";

const DANGEROUS = [
  { re: /\bgit\s+push\s+(--force|-f)\b/i, msg: "禁止 git push --force" },
  { re: /\brm\s+-rf?\b/i, msg: "禁止 rm -rf；如需清理请明确路径并征得用户确认" },
  { re: /Remove-Item.*-Recurse.*-Force/i, msg: "禁止 Remove-Item -Recurse -Force" },
  { re: /\bDROP\s+DATABASE\b/i, msg: "禁止 DROP DATABASE" },
  { re: /\bDROP\s+TABLE\b/i, msg: "禁止 DROP TABLE" },
];

// 判断命令是否会写入只读区
// 匹配模式：> path / >> path / Set-Content / Out-File / Add-Content / echo "..." > path
//          / cp / mv / move / copy / touch / mkdir 后跟受保护路径
const READONLY_DIRS = [
  "intake/",
  "resumes/input/",
  "prompts/system/",
  "schemas/",
  "docs/adr/",
];

function looksLikeWriteToReadonly(cmd) {
  const lower = cmd.replace(/\\/g, "/").toLowerCase();
  // direct redirection: foo > intake/x or foo >> intake/x
  for (const dir of READONLY_DIRS) {
    const d = dir.toLowerCase();
    // redirection
    if (new RegExp(`>>?\\s+["']?${d.replace(/\//g, "\\/")}`, "i").test(lower)) return dir;
    // common write commands followed by path
    const writeRe = new RegExp(
      `\\b(cp|mv|copy|move|touch|mkdir|rm|del|set-content|out-file|add-content|new-item|write-output|tee)\\b[^\\n]*?["']?(\\.\\/)?${d.replace(/\//g, "\\/")}`,
      "i"
    );
    if (writeRe.test(lower)) return dir;
  }
  return null;
}

const input = await readJsonStdin();
const cmd = input?.command || "";

if (cmd) {
  for (const { re, msg } of DANGEROUS) {
    if (re.test(cmd)) emitDeny(`Resume-Agent Harness: ${msg}`);
  }
  const dir = looksLikeWriteToReadonly(cmd);
  if (dir) {
    emitDeny(
      `Resume-Agent Harness: 检测到对只读区 \`${dir}\` 的写入命令；该目录由用户/Harness 维护，Agent 不得写入。`
    );
  }
}

emitAllow();
