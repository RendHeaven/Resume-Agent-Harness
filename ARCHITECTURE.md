# Resume-Agent 架构

## 设计原则

**Agent = Model + Harness**

- **Model 层**：Cursor Agent（Composer 等），负责理解与生成
- **Harness 层**：本仓库中的 rules、skills、hooks、evals，负责边界、验证、记忆与迭代

本仓库 **不包含** Web API、数据库或前端。所有交互在 Cursor IDE 内完成。

## 分层结构

```text
docs/          → 知识与标准（只读参考）
.cursor/       → 运行时约束（rules / skills / hooks.json）
prompts/       → 系统提示词（system 只读 + runtime 实例化）
schemas/       → 输出 JSON Schema（review / panel-report / eval-run / gap）
intake/        → 任务输入（direction / requirements / projects）
resumes/       → 业务产物（input / working / output）
plans/         → Step 1 优化计划
reviews/       → Step 2 面试官 baseline 评测
gaps/          → Step 5 JD 差距对照
evals/         → Step 4 面板（panel / runs / cases / dashboard.md）
scripts/       → 零依赖 Node ESM 校验脚本（validate / redact / score / diff / aggregate / check-doc-refs / next-round）
```

## 依赖方向

```text
docs/ ──read──> .cursor/rules, .cursor/skills
.cursor/rules ──governs──> resumes/, plans/, reviews/, prompts/runtime/, evals/, gaps/
.cursor/hooks.json ──invokes──> scripts/*.mjs
prompts/system/ ──read──> Step 2 / Step 4 / Step 5
schemas/ ──validate──> reviews/*.json, evals/**/*.json, gaps/*.json
scripts/ ──validate──> resumes/, evals/, gaps/
evals/dashboard.md ──feeds back──> .cursor/rules, .cursor/skills, docs/adr/
```

**禁止**：

- `scripts/` 不得写入业务逻辑或调用外部 API
- `resumes/input/` 与 `intake/` 不得被 Agent 覆盖、删除或写入
- `prompts/system/` 不得被 Agent 修改
- `evals/runs/` 不得包含明文 PII

## Harness 三类控制

### Feed-forward（事前约束）

- `AGENTS.md` — 入口导航
- `.cursor/rules/` — 事实边界、编辑规范、安全约束
- `.cursor/skills/resume-agent/SKILL.md` — 五步工作流（Plan → Interview → Rewrite → Eval → Gap）
- `prompts/system/` — Step 2 面试官 base 系统提示词

### Feedback（事后验收）

- `.cursor/hooks.json` — `afterFileEdit` 路由 + `beforeShellExecution` 只读区拦截 + `stop` 契约自检
- `schemas/*.json` — Step 2 / 4 / 5 输出的 JSON Schema（含 `provenance` 公共字段）
- `scripts/validate-output.mjs` — 按路径自动选 schema 校验产物
- `scripts/redact-pii.mjs` — 评测/差距记录 PII 扫描
- `scripts/score-resume.mjs` — 简历结构与 meta 引导语检查
- `scripts/diff-resume.mjs` — input ↔ output 章节级 diff + JD 关键词保留率
- `scripts/next-round.mjs` — 计算下一安全 `r{N}`
- `scripts/check-doc-refs.mjs` — md 内部链接断链检测

### Memory（持续优化）

- `evals/cases/` — 输入级回归 fixture（`expected-shape.json` 声明应有产出）
- `evals/runs/` — 历史评测
- `evals/dashboard.md` — 由 `scripts/aggregate-evals.mjs` 自动生成
- `docs/adr/` — 规则变更记录

## 数据流

```text
用户 Prompt
  → Cursor Agent（受 rules + skill 约束）
  → 写入 plans/, prompts/runtime/, reviews/, resumes/working
  → evals/panel/, evals/runs/ → gaps/
  → hooks 校验
  → 用户确认 → resumes/output
  → eval run 记录
  → 人工复盘 → 更新 rules/rubric/skill/hooks
```

## 目录职责

| 目录 | 写入者 | 读取者 |
|------|--------|--------|
| `intake/<name>/` | 用户 | Agent（只读，禁止写入） |
| `plans/` | Agent | Agent, 用户, Interview |
| `prompts/system/` | Harness 维护 | Agent（只读） |
| `prompts/runtime/` | Agent | Agent, 用户 |
| `reviews/` | Agent | 用户, Rewrite, Eval（baseline） |
| `evals/panel/` | 子代理 | 用户, 主 Agent 汇总 |
| `evals/runs/` | 主 Agent | 用户, Step 5, 循环控制 |
| `gaps/` | Agent | 用户 |
| `resumes/input/` | 用户 | Agent（只读） |
| `resumes/working/` | Agent | Agent, hooks |
| `resumes/output/` | Agent（用户确认后） | hooks, scripts |
| `evals/cases/` | 用户（fixture） | 回归脚本（只读） |
| `evals/dashboard.md` | `scripts/aggregate-evals.mjs` | 用户 |
| `schemas/` | Harness 维护 | scripts/validate-output.mjs |
| `scripts/` | Harness 维护 | hooks / 用户手动 |
| `docs/` | 用户 / Agent（ADR） | Agent, 用户 |
