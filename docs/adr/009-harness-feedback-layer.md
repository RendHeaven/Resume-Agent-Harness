# ADR-009: Harness Feedback 层补全（hooks + scripts + schemas）

- **状态**：已采纳
- **日期**：2026-05-26
- **关联**：[ADR-007](007-panel-independence.md)、[ADR-008](008-suspense-vs-ats-tradeoff.md)

## 背景

ADR-001 ~ 006 建立了 Resume-Agent 的工作流（Plan / Interview / Rewrite / Eval / Gap）、模板与三面试官面板。然而审计发现：

- [ARCHITECTURE.md](../../ARCHITECTURE.md) / [AGENTS.md](../../AGENTS.md) / [.cursor/rules/harness-safety.mdc](../../.cursor/rules/harness-safety.mdc) 引用了 `.cursor/hooks.json`、`scripts/score-resume.mjs`、`scripts/diff-resume.mjs`、`evals/rubric.md`、`evals/cases/`，但这些文件**全部不存在**
- 所谓"Feedback 层"等于零；Harness 的"硬约束"只是 prompt 层面的自律
- `evals/` 输出 JSON 没有真正的 schema validator，`pii_redacted: true` 是 Agent 自报的字段

本 ADR 总结一次性补齐 Feedback 层的取舍。

## 决策

### 1. 三层硬约束补齐

| 层 | 内容 |
|----|------|
| **Schema** | `schemas/{review, panel-report, eval-run, gap}.schema.json` + 公共 `provenance` |
| **Scripts** | `scripts/{validate-output, redact-pii, score-resume, diff-resume, next-round, aggregate-evals, check-doc-refs}.mjs` |
| **Hooks** | `.cursor/hooks.json` 注册 `beforeShellExecution` / `afterFileEdit` / `stop` 三事件 |

### 2. 零依赖原则

所有脚本仅用 Node 内置模块（`fs`、`path`、`child_process`、`crypto`），不引入任何 npm 包。

**取舍**：自行实现 JSON Schema 子集校验器（[`scripts/lib/json-schema-mini.mjs`](../../scripts/lib/json-schema-mini.mjs)），覆盖本仓 schema 实际用到的关键字。**牺牲**：完整 Draft 2020-12 兼容性（不支持 `format` 严格校验、远程 `$ref`）。**收益**：仓库 zero-install，新人 clone 即可运行；hook 启动延迟可忽略。

### 3. Hook 失败 → 通知而非阻断（除 beforeShellExecution）

`afterFileEdit` 是 Cursor 通知钩子，stdout 被忽略，无法 deny。设计上把校验失败信息写入 stderr 让 IDE 日志可见，让 Agent 在下一回合自行修复，而不是把会话锁死。

唯一真正的 deny 点是 `beforeShellExecution`：拦截危险命令（`rm -rf` / `git push --force` / `DROP DATABASE`）和对只读区（`intake/`、`resumes/input/`、`prompts/system/`、`schemas/`、`docs/adr/`）的写入命令。

### 4. 单一事实源

工作流描述以 [`.cursor/skills/resume-agent/SKILL.md`](../../.cursor/skills/resume-agent/SKILL.md) 为 canonical：

- [`docs/WORKFLOW.md`](../WORKFLOW.md) 改为面向用户的"操作手册"，流程细节链向 SKILL
- [`.cursor/rules/resume-core.mdc`](../../.cursor/rules/resume-core.mdc) 只保留禁令清单与 8 项契约清单，流程描述删除并链回 SKILL

**取舍**：rules 不能完全空洞（`alwaysApply: true` 需要有实质内容），保留禁令与 8 项契约是合理粒度。

### 5. 跨平台

用户工作环境是 Windows + PowerShell；hook 脚本与 scripts 均用 Node 写而非 bash/PS，确保 Win/Mac/Linux 一致行为。

## 后果

### 正面

- 文档真实落地：`scripts/check-doc-refs.mjs` 静态检测断链，已修复 SKILL.md 中本就存在的 `../../` 错误（应为 `../../../`）。
- 输出 JSON 全部可校验、可复现：`provenance` 锁住 `agent_model` / `temperature` / `prompt_shas`。
- PII / 关键词保留 / round 序号从"自报"升级为"脚本计算 + hook 强制"。
- 三 panelist 通过不同 temperature 显式区分（[ADR-007](007-panel-independence.md)），脱离"伪独立"。
- 悬念↔ATS 边界从"主观判断"升级为"客观度量 + 脚本计算"（[ADR-008](008-suspense-vs-ats-tradeoff.md)）。

### 负面 / 取舍

- 自实现 schema 校验器代码量 ~150 行，须随 schema 演进维护；若未来 schema 复杂度上升（如需 `format` 严格校验），可能须引入 ajv 升级路径。
- `afterFileEdit` 失败仅通知，绕过仍可能；信任 Agent 自查 + 用户复盘的组合。
- Hooks 受 Cursor 设置影响（用户须 enable）；`docs/WORKFLOW.md` 已提示前置准备。
- 关键词提取启发式可能误判，[ADR-008](008-suspense-vs-ats-tradeoff.md) 已说明缓解。

### 不在范围

- **未跑端到端 sample**（用户决定 no_skip）：本次仅落 Harness，未真实调用面试官子代理验证整条管线
- **未引入 ajv / 完整 JSON Schema 兼容**
- **未引入多 model panelist**（[ADR-007](007-panel-independence.md) 留升级路径）
- **未实现 ATS 关键词词典维护工具**（启发式提取已经够用）

## 后续观察

- dashboard `pass_rate` 与 `avg_rounds_to_pass` 是否达 SLO（≥ 90% / < 2.0）
- `high_variance` flag 频率：若持续高发，启动多 model panelist 升级
- `low_keyword_retention` flag 频率：若持续高发，调整启发式或阈值

## 实现清单

| 文件 | 角色 |
|------|------|
| [`schemas/`](../../schemas/) | 输出契约（4 个 schema + provenance） |
| [`scripts/`](../../scripts/) | 7 个 Node ESM 校验脚本 + 共享 lib |
| [`.cursor/hooks.json`](../../.cursor/hooks.json) | 三事件注册 |
| [`.cursor/hooks/`](../../.cursor/hooks/) | 三 hook 脚本 + 共享 lib |
| [`evals/cases/`](../../evals/cases/) | 2 个回归 fixture |
| [`docs/observability.md`](../observability.md) | dashboard 字段说明 |
| [`docs/adr/007-panel-independence.md`](007-panel-independence.md) | panelist 独立性决策 |
| [`docs/adr/008-suspense-vs-ats-tradeoff.md`](008-suspense-vs-ats-tradeoff.md) | 关键词保留率决策 |
