# Resume-Agent 入口

本仓库是一个 **Cursor 原生 Harness 工程**，用于在 IDE 内分析、改写、评测简历。没有 Web 服务或 API。

## 阅读顺序

1. [ARCHITECTURE.md](ARCHITECTURE.md) — Harness 分层与依赖方向
2. [docs/WORKFLOW.md](docs/WORKFLOW.md) — 人类操作手册
3. [docs/plan-step-spec.md](docs/plan-step-spec.md) — Step 1 Plan
4. [docs/interview-step-spec.md](docs/interview-step-spec.md) — Step 2 面试官评测
5. [docs/rewrite-step-spec.md](docs/rewrite-step-spec.md) — Step 3 简历重写
6. [docs/templates/resume-suspense-template.md](docs/templates/resume-suspense-template.md) — 悬念设计简历模板
7. [docs/eval-step-spec.md](docs/eval-step-spec.md) — Step 4 三面试官面板
8. [prompts/system/interviewer-base.system.md](prompts/system/interviewer-base.system.md) — 面试官 base 系统提示词
9. [prompts/system/eval-panel.system.md](prompts/system/eval-panel.system.md) — Step 4 面板编排
10. [docs/gap-step-spec.md](docs/gap-step-spec.md) — Step 5 JD 差距对照
11. [.cursor/skills/resume-agent/SKILL.md](.cursor/skills/resume-agent/SKILL.md) — 标准五步工作流

## 启动一次任务

在 Cursor 中说：

> 按 resume-agent skill 处理 `resumes/input/<文件名>`，目标岗位见 `evals/cases/` 中的 JD。

## 输出契约

| 产物 | 路径 | 说明 |
|------|------|------|
| 原始简历 | `resumes/input/` | 只读，用户维护，Agent 不得覆盖 |
| 任务输入 | `intake/<name>/` | 只读，用户维护（direction / requirements / projects） |
| 优化计划 | `plans/YYYY-MM-DD-<name>.md` | Step 1 产出：思维链 + 意向 / 项目 / JD 总结 |
| 面试官系统提示词 | `prompts/runtime/YYYY-MM-DD-<name>.interviewer.system.md` | Step 2 从 JD 实例化 |
| 面试官评测 | `reviews/YYYY-MM-DD-<name>.md` + `.json` | Step 2 评分与反馈 |
| 中间稿 | `resumes/working/` | Step 3 悬念模板草稿 |
| 定稿 | `resumes/output/` | 用户确认后的最终版本（悬念模板结构） |
| 面板评测 | `evals/panel/...-r{N}-interviewer-{a,b,c}.*` | Step 4 三子代理报告 |
| 面板汇总 | `evals/runs/YYYY-MM-DD-<name>-r{N}.json` | Step 4 全票判定与循环控制 |
| 差距对照 | `gaps/YYYY-MM-DD-<name>.md` + `.json` | Step 5 技能不足与改进建议（**任务完成**） |

## 工作原则

- **事实边界**：只能重组、润色、突出已有信息，不得捏造公司、职位、年限、项目成果
- **目标导向**：每次任务必须声明目标岗位、语言、限制
- **小步验证**：先 working 稿，用户确认后再写入 output
- **全票验收**：Step 4 须 3 子代理全部通过方可进入 Step 5
- **差距对照**：Step 5 诚实产出 JD 契合缺口与成长建议，完成后任务结束
- **PII 安全**：eval 日志中不得写入手机号、邮箱等明文敏感信息

## 禁止事项

- **JD 必填**：无有效 `intake/<name>/requirements.md` 时不得开始任务
- 不得删除、覆盖或写入 `resumes/input/` 与 `intake/`（用户专属输入区）
- 不得在 eval 记录中写入完整 PII
- 不得执行 `git push --force`、`rm -rf` 等危险命令
- 不得跳过 Plan 或 Interview 直接改写
- 不得在没有用户确认的情况下将 working 稿标记为 output 定稿

## 常用命令（零依赖 Node ESM）

```bash
# 简历结构与 meta 引导语检查
node scripts/score-resume.mjs resumes/output/<name>.md

# input ↔ output 章节级 diff + JD 关键词保留率
node scripts/diff-resume.mjs resumes/input/<name>.md resumes/output/<name>.md intake/<name>/requirements.md

# 校验任意输出 JSON（自动按路径选 schema）
node scripts/validate-output.mjs evals/runs/2026-05-26-sample-r1.json

# PII 扫描（评测 / 差距记录强制）
node scripts/redact-pii.mjs evals/runs/2026-05-26-sample-r1.json

# 计算下一安全轮次
node scripts/next-round.mjs sample

# 跨 case 汇总 → evals/dashboard.md
node scripts/aggregate-evals.mjs

# md 相对链接断链检查
node scripts/check-doc-refs.mjs
```

## 持续优化

当质量不达标时，按以下顺序排查并只改一个控制面：

1. `.cursor/rules/` — 行为偏差
2. `.cursor/skills/resume-agent/SKILL.md` — 流程混乱
3. `evals/rubric.md` — 验收标准不准
4. `.cursor/hooks/` — 漏检

每次改动在 `docs/adr/` 记录一条 ADR。
