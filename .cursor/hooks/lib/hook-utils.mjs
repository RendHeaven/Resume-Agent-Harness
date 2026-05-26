// 共享 hook 工具：读取 stdin / 标准化路径 / 调用脚本
//
// Hook 退出码语义（Cursor）：
//   0  → 成功，使用 stdout JSON
//   2  → 阻断（permission: deny）
//   其他 → fail-open（动作仍执行，仅记录）

import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, sep } from "node:path";

export async function readJsonStdin() {
  return new Promise((res) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => {
      if (data.charCodeAt(0) === 0xfeff) data = data.slice(1);
      try {
        res(data.trim() ? JSON.parse(data) : {});
      } catch {
        res({});
      }
    });
    // safety timeout for environments where stdin doesn't EOF promptly
    setTimeout(() => res({}), 5000).unref?.();
  });
}

export function normalizePath(p) {
  if (!p) return "";
  // strip workspace root if absolute; keep relative form
  const cwd = process.cwd();
  let abs = resolve(p);
  if (abs.toLowerCase().startsWith(cwd.toLowerCase())) {
    abs = abs.slice(cwd.length);
    if (abs.startsWith(sep)) abs = abs.slice(1);
  }
  return abs.split(sep).join("/");
}

export function runNode(scriptRelPath, args = [], { timeoutMs = 30000 } = {}) {
  const r = spawnSync(process.execPath, [scriptRelPath, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: timeoutMs,
  });
  return {
    code: r.status,
    stdout: r.stdout || "",
    stderr: r.stderr || "",
    error: r.error?.message,
  };
}

export function emitDeny(message, agentMessage = null) {
  process.stdout.write(
    JSON.stringify({
      continue: true,
      permission: "deny",
      user_message: message,
      agent_message: agentMessage || message,
    }) + "\n"
  );
  process.exit(2);
}

export function emitAllow() {
  process.stdout.write(JSON.stringify({ continue: true, permission: "allow" }) + "\n");
  process.exit(0);
}

export function emitNotice(msg) {
  // afterFileEdit / stop 的 stdout 被忽略；走 stderr 让 IDE 日志可见
  if (msg) process.stderr.write(`[hook] ${msg}\n`);
  process.exit(0);
}
