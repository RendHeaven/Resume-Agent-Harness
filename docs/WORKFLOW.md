# 操作流程（用户视角）

> 本文件是**用户操作手册**。流程的 canonical 定义在 [../.cursor/skills/resume-agent/SKILL.md](../.cursor/skills/resume-agent/SKILL.md)；本文档只覆盖人工动作与触发语，避免与 SKILL 漂移。

## 前置准备

1. 在 Cursor 中打开 `resume-Agent` 仓库
2. 确认 Hooks 已启用（Cursor Settings → Hooks），仓库内 `.cursor/hooks.json` 会被自动加载
3. 准备原始简历到 `resumes/input/<name>.md`
4. **用户自行**准备求职方向、招聘要求、项目补充到 `intake/<name>/`（Agent 只读，不得代写）

## 五步流程概览

| 步骤 | 产出 | 详细规格 |
|------|------|----------|
| Step 1 Plan | `plans/YYYY-MM-DD-<name>.md` | [plan-step-spec.md](plan-step-spec.md) |
| Step 2 Interview | `prompts/runtime/...interviewer.system.md` + `reviews/*.{md,json}` | [interview-step-spec.md](interview-step-spec.md) |
| Step 3 Rewrite | `resumes/working/` → 用户确认 → `resumes/output/` | [rewrite-step-spec.md](rewrite-step-spec.md) |
| Step 4 Eval | `evals/panel/*.{md,json}` × 3 + `evals/runs/...-r{N}.json` | [eval-step-spec.md](eval-step-spec.md) |
| Step 5 Gap | `gaps/YYYY-MM-DD-<name>.{md,json}` —— **任务完成** | [gap-step-spec.md](gap-step-spec.md) |

详细顺序、DoD、禁止事项、不及格循环以 [SKILL.md](../.cursor/skills/resume-agent/SKILL.md) 为准。

## 触发语

```
按 resume-agent skill 处理 resumes/input/<name>.md，目标岗位见 intake/<name>/requirements.md
```

或分步触发（示例见 [SKILL.md](../.cursor/skills/resume-agent/SKILL.md#示例触发语)）。

## 不及格处理（Step 4 驱动）

`panel_passed === false` 时 Agent 自动循环 Rewrite → Eval（最多 3 轮）。round ≥ 3 仍失败，停止并等待用户决策。详见 [eval-step-spec.md](eval-step-spec.md)。

## Harness 自检命令

```bash
node scripts/check-doc-refs.mjs        # md 链接断链
node scripts/aggregate-evals.mjs       # 更新 evals/dashboard.md
node scripts/validate-output.mjs <p>   # 校验任意输出 JSON
node scripts/score-resume.mjs <md>     # 简历结构检查
node scripts/redact-pii.mjs <p>        # PII 扫描（评测/gap 强制）
```

## 复盘（5 分钟）

每次会话后回答：

1. Agent 是否捏造了事实？
2. 流程是否跳步？
3. Hook 是否漏检？
4. 评分是否准确？

根据答案更新对应控制面，并在 `docs/adr/` 记录。
