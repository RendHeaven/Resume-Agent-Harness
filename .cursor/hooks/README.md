# .cursor/hooks/ — Resume-Agent Harness Hook 脚本

由 [`../hooks.json`](../hooks.json) 注册，三个事件：

| 事件 | 脚本 | 行为 |
|------|------|------|
| `beforeShellExecution` | [before-shell-execution.mjs](before-shell-execution.mjs) | 阻断危险命令（rm -rf / git push -f / DROP DATABASE）+ 阻断对只读区（intake/、resumes/input/、prompts/system/、schemas/、docs/adr/）的写入命令 |
| `afterFileEdit` | [after-file-edit.mjs](after-file-edit.mjs) | 按编辑路径分发 `scripts/*.mjs` 校验：reviews/evals/gaps JSON → schema + PII；resumes/working/output md → 结构检查 |
| `stop` | [stop.mjs](stop.mjs) | 检查当日 case 的 8 项产出契约 + 刷新 `evals/dashboard.md` |

## 退出码语义（Cursor）

- `0` → 成功，使用 stdout JSON
- `2` → 阻断（仅 beforeShellExecution 有效；afterFileEdit/stop 是通知钩子）
- 其他 → fail-open

## 设计动机

- **跨平台**：用 Node 写而非 bash/PowerShell，Win/Mac/Linux 一致
- **零依赖**：不引入 npm 包
- **failure → notice 而非阻断**：afterFileEdit 失败不锁会话，让 Agent 在下一回合自行修复（消息走 stderr，IDE 日志可见）
- **阻断只用在 shell 层**：唯一真正能 deny 的是 `beforeShellExecution`，所以把仓库边界写在那里

## 共享工具

[lib/hook-utils.mjs](lib/hook-utils.mjs) — stdin 读取、路径标准化、子进程调度、emitDeny/emitAllow/emitNotice。

## 调试

每个 hook 在 stderr 写 `[hook] ...` 通知；查看 Cursor IDE 输出面板的 Hooks 频道。
