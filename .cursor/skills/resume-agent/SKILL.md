---
name: resume-agent
description: >-
  标准简历分析与改写工作流。Use when the user asks to analyze, rewrite,
  improve, or evaluate a resume; mentions 简历、改简历、优化简历、ATS;
  or references files in resumes/input/.
---
# Resume-Agent Skill

在 Cursor 内执行简历质量提升的标准五步流程。

## 何时使用

- 用户要求分析、改写、优化简历
- 用户引用 `resumes/input/` 中的文件
- 用户提到岗位匹配、ATS、简历评分
- 用户要求执行 Plan / 制定简历优化计划

## 前置读取

1. [AGENTS.md](../../../AGENTS.md)
2. [docs/plan-step-spec.md](../../../docs/plan-step-spec.md) — Step 1 详细规格
3. [docs/interview-step-spec.md](../../../docs/interview-step-spec.md) — Step 2 面试官评测规格
4. [docs/rewrite-step-spec.md](../../../docs/rewrite-step-spec.md) — Step 3 简历重写规格
5. [docs/templates/resume-suspense-template.md](../../../docs/templates/resume-suspense-template.md) — 悬念设计简历模板（Rewrite 必遵循）
6. [prompts/system/interviewer-base.system.md](../../../prompts/system/interviewer-base.system.md) — Step 2 必加载系统提示词
7. [docs/eval-step-spec.md](../../../docs/eval-step-spec.md) — Step 4 三面试官面板
8. [prompts/system/eval-panel.system.md](../../../prompts/system/eval-panel.system.md) — 面板编排
9. [docs/gap-step-spec.md](../../../docs/gap-step-spec.md) — Step 5 JD 差距对照
10. [prompts/system/gap-analyst.system.md](../../../prompts/system/gap-analyst.system.md) — Step 5 系统提示词

## 五步工作流

### Step 1: Plan

**目标**：基于四类输入，生成全面计划文档，为后续 Interview / Rewrite 提供统一指导。

**输入**：

| 材料 | 路径 |
|------|------|
| 现有简历 | `resumes/input/<name>.md` |
| 求职方向 | `intake/<name>/direction.md` |
| 招聘要求 | `intake/<name>/requirements.md` |
| 现有项目内容 | `intake/<name>/projects.md` |

用户在聊天中提供的内容，Agent 须引导用户保存到 `intake/` 对应路径；**Agent 不得写入 `intake/`**（与 `resumes/input/` 同级只读保护）。

**前置门禁（必须先过）**：

执行 Plan 前，校验 `intake/<name>/requirements.md` 是否为**有效 JD**（见 [docs/plan-step-spec.md](../../../docs/plan-step-spec.md) 门禁标准）。

- **未通过**：停止流程，告知用户缺少 JD，引导补充；**不得**生成 Plan，**不得**进入 Step 2
- **通过**：进入思维链推演与方向校验

**思维链与方向反问（Plan 核心）**：

1. **推演**：读取四类输入，按 [docs/plan-step-spec.md](../../../docs/plan-step-spec.md) 完成思维链（输入理解 → 方向三角对齐 → 矛盾识别 → 推演结论）
2. **校验**：检查 direction × JD × resume 是否存在 **阻塞级方向问题**
3. **反问**：若存在阻塞级问题 → **立即在聊天中列出疑问并暂停**，引导用户更新 `intake/<name>/direction.md`，**不得落盘 Plan**
4. **落盘**：方向校验通过后，写入 `plans/YYYY-MM-DD-<name>.md`（含「零、思维链」+ 三大章节 + 后续指引）

**输出**：`plans/YYYY-MM-DD-<name>.md`

必须包含（详见 [docs/plan-step-spec.md](../../../docs/plan-step-spec.md)）：

0. **思维链** — 输入理解、方向三角对齐、矛盾识别、推演结论、待确认项
1. **求职意向总结** — 目标岗位、职业定位、偏好、与现状初判
2. **现有项目信息总结** — 项目清单、详情、可挖掘亮点、信息缺口
3. **招聘要求总结** — 硬/软要求、关键词、匹配矩阵
4. **后续步骤指引** — Interview 关注重点、Rewrite 优先项、待用户补充清单

**约束**：

- 只做归纳与对齐，**不改动** `resumes/input/` 原文
- **禁止**捏造项目、成果、技能；缺口用 `[待补充: ...]`
- 匹配矩阵须如实标注「强 / 中 / 弱 / 无依据」
- **方向阻塞级矛盾须反问并暂停**，不得带矛盾落盘 Plan 或进入 Step 2

**DoD**：

- JD 门禁已通过
- 思维链已写入 Plan，方向三角对齐完成
- 无未解决阻塞级方向问题（有则已反问并暂停）
- `plans/YYYY-MM-DD-<name>.md` 已创建且三大主章节非空
- 模板见 [docs/templates/plan-template.md](../../../docs/templates/plan-template.md)

### Step 2: Interview（面试官评测）

**前置条件**：Step 1 Plan 已完成（含有效 JD、思维链已通过、无阻塞级方向问题）。Plan 状态为 `待确认` 时**禁止**进入本步。

**目标**：根据 JD 生成**岗位专属面试官系统提示词**，以面试官身份只读现有简历，输出**结构化评分与反馈**。

**系统提示词（必用，不得跳过）**：

1. **加载** `prompts/system/interviewer-base.system.md`（Harness 只读）
2. **读取** JD + Plan，按 `prompts/system/interviewer-persona.template.md` **生成**
   `prompts/runtime/YYYY-MM-DD-<name>.interviewer.system.md`
3. **以 Base + Runtime 系统提示词**进入面试官角色，只读 `resumes/input/<name>.md`

**输出**：

| 产物 | 路径 |
|------|------|
| 实例化系统提示词 | `prompts/runtime/YYYY-MM-DD-<name>.interviewer.system.md` |
| 评测报告 | `reviews/YYYY-MM-DD-<name>.md` |
| 结构化分数 | `reviews/YYYY-MM-DD-<name>.json` |

报告须含：**评测思维链**、JD 逐条核验、6 维度评分（总分 100）、top_gaps、Rewrite 优先级。

评分维度与格式见 [docs/interview-step-spec.md](../../../docs/interview-step-spec.md) 与 [interviewer-base.system.md](../../../prompts/system/interviewer-base.system.md)。

**约束**：

- **只评测、不改写**；不得读取 working / output 稿
- 每个判断须引用简历证据或标注「简历未体现」
- 须独立验证 Plan 匹配矩阵，差异须在报告中说明
- **禁止**修改 `prompts/system/`、`resumes/input/`、`intake/`

**DoD**：

- Base + Runtime 系统提示词已加载/生成
- `reviews/YYYY-MM-DD-<name>.md` 与 `.json` 已创建
- 模板见 [docs/templates/interview-review-template.md](../../../docs/templates/interview-review-template.md)

### Step 3: Rewrite（悬念设计重写）

**前置条件**：Step 2 Interview 已完成。

**目标**：按 **「信息留白与悬念设计」模板**，将 input 重组为环环相扣的 Markdown 简历。

**必读**：[docs/templates/resume-suspense-template.md](../../../docs/templates/resume-suspense-template.md)、[docs/rewrite-step-spec.md](../../../docs/rewrite-step-spec.md)

**执行**：

1. 读取 input、Plan、Interview 报告/JSON、projects 补充
2. 完成 **Summary ↔ Skills ↔ Work ↔ Project 映射表**
3. 按模板渐进式披露顺序写入 `resumes/working/<name>.md`
4. 环环相扣自检 + 响应 Interview `rewrite_priorities` / `top_gaps`
5. 展示改动摘要，**等待用户确认**后写入 `resumes/output/<name>.md`

**结构约束**（详见模板）：

| 章节 | 定位 |
|------|------|
| 自我评价 | 论点 + 最强战绩，3 条核心标签 |
| 专业技能 | 武器库，与 Summary 标签对齐 |
| 工作经历 | 宏观上下文，1–2 行/段，细节折叠 |
| 项目经历 | STAR：强痛点 + 留白 Process + 数字 Output |
| 教育经历 | 学历背书 |

**改写约束**：

- 遵循 `.cursor/rules/resume-editing.mdc`
- **环环相扣**：Summary 每条须有 Skills 论据 + Project 实证（或无依据则降级）
- **悬念在内容层**：Process 留术语钩子，**禁止**输出「留下悬念」等 meta 文字
- 不得捏造事实；缺失量化用 `[待补充: ...]`
- 输出 **禁止** HTML 注释与模板引导语

**DoD**：

- 映射表已完成，自检通过
- `resumes/working/<name>.md` 存在且符合五章节结构
- 用户确认后 `resumes/output/<name>.md` 存在

### Step 4: Eval（三面试官面板）

**前置条件**：Step 3 完成，`resumes/output/<name>.md` 存在；Step 2 runtime 提示词与 baseline review 存在。

**目标**：**重启 Step 2 面试官**，对 output 定稿重新评分。启用 **3 个子代理**并行评测，**全票通过**方可进入 Step 5。

**必读**：

- [docs/eval-step-spec.md](../../../docs/eval-step-spec.md)
- [prompts/system/eval-panel.system.md](../../../prompts/system/eval-panel.system.md)
- [prompts/system/interviewer-eval-mode.system.md](../../../prompts/system/interviewer-eval-mode.system.md)

**系统提示词（每子代理四层）**：

1. `interviewer-base.system.md`
2. `interviewer-eval-mode.system.md`
3. `prompts/runtime/YYYY-MM-DD-<name>.interviewer.system.md`（**Step 2 复用**）
4. `interviewer-lens-{a,b,c}.system.md`

**执行**：

1. **并行启动 3 个子代理**（Task × 3），各独立评测 `resumes/output/<name>.md`
2. 各写入 `evals/panel/YYYY-MM-DD-<name>-r{N}-interviewer-{a,b,c}.{md,json}`
3. 主 Agent 汇总 → `evals/runs/YYYY-MM-DD-<name>-r{N}.json`
4. 判定 `panel_passed = a.passed && b.passed && c.passed`

**单人通过**：`total >= 70` 且 `recommendation` ∈ `{strong_yes, yes}` 且无 JD 硬性 `fail`

**全票通过**：三人全部 `passed: true`

**不及格循环**（`panel_passed === false`）：

1. 合并 3 份 `rewrite_priorities` 与 `top_gaps`
2. 回到 **Step 3 Rewrite** → 用户确认 output
3. **重新 Step 4**，`round = N+1`（追加记录，不覆盖）
4. **round ≥ 3** 仍失败 → 停止自动循环，输出三轮汇总，等待用户

**禁止**：主 Agent 代打 3 票；2/3 通过放行；跳过 Step 4 结束任务

**DoD**：

- 3 子代理均已并行完成
- 汇总 JSON 已写入，`panel_passed` 已判定
- 通过则进入 Step 5；未通过则已触发循环或已达 max rounds
- PII 已脱敏

### Step 5: Gap（JD 差距对照）

**前置条件**：Step 4 `panel_passed === true`。

**目标**：对照 **JD × 已通过定稿简历**，诚实产出用户**技能不足**与**需改进之处**（面向真实成长，非简历造假）。

**必读**：[docs/gap-step-spec.md](../../../docs/gap-step-spec.md)、[prompts/system/gap-analyst.system.md](../../../prompts/system/gap-analyst.system.md)

**执行**：

1. 加载 `gap-analyst.system.md`
2. 读取 JD、output 定稿、Plan、projects、Step 4 panel 汇总与三份 panel JSON
3. 逐条 JD 对照，区分：能力缺失 / 证据不足 / 表达留白 / 已契合
4. 输出契合度区间（**禁止**声称 100%）
5. 写入 `gaps/YYYY-MM-DD-<name>.md` + `.json`

**报告须含**：JD 对照矩阵、技能不足清单、P0/P1/P2 改进建议、已契合优势、与 Step 4 panel gaps 衔接。

**禁止**：Step 4 未通过即执行；建议编造简历；跳过 JD 逐条对照。

**DoD**：

- `gaps/YYYY-MM-DD-<name>.md` + `.json` 已创建
- 模板见 [docs/templates/gap-analysis-template.md](../../../docs/templates/gap-analysis-template.md)
- **本步完成后任务方可结束**

## 禁止跳步

- 不得在无有效 JD 时执行任何步骤
- 不得跳过 Step 1 Plan
- 不得跳过 Step 2 Interview 直接改写
- 不得跳过 Step 4 Eval
- 不得 Step 4 通过却跳过 Step 5 结束任务
- 不得覆盖 `resumes/input/`

## 不及格循环（Step 4 驱动）

当 `panel_passed === false`：

1. 从 `evals/runs/...-r{N}.json` 读取 `merged_rewrite_priorities`
2. 执行 **Step 3 Rewrite**（针对 output 差距）
3. 用户确认后执行 **Step 4 Eval** round N+1（轮次用 `node scripts/next-round.mjs <name>` 计算，防覆盖）
4. 最多自动循环 **3 轮**；超出则 `next_action: user_escalation`

**禁止**覆盖历史 `evals/panel/` 与 `evals/runs/` 记录。

## Harness 自检

任意时刻，用户或 Agent 可触发以下自检命令（零依赖 Node ESM）：

```bash
# md 内部链接断链（Harness 变更门禁）
node scripts/check-doc-refs.mjs

# 跨 case 汇总 → evals/dashboard.md
node scripts/aggregate-evals.mjs

# 校验任意输出 JSON（按路径自动选 schema）
node scripts/validate-output.mjs <path>

# 简历结构与 meta 卫生
node scripts/score-resume.mjs <md>

# JD 关键词保留率（Step 3 自检 / Lens B 否决依据）
node scripts/diff-resume.mjs <input.md> <output.md> <jd.md>

# PII 扫描（评测/gap 强制）
node scripts/redact-pii.mjs <path>

# 计算下一安全 Step 4 round
node scripts/next-round.mjs <name>
```

详细字段含义见 [docs/observability.md](../../../docs/observability.md)。

## 示例触发语

**Step 1 Plan**：

```
按 resume-agent skill 执行 Step 1 Plan：
- 简历：resumes/input/sample-resume.md
- 求职方向：intake/sample/direction.md
- 招聘要求：intake/sample/requirements.md
- 项目补充：intake/sample/projects.md
```

**Step 2 Interview**：

```
按 resume-agent skill 执行 Step 2 Interview：
- name: sample
- plan: plans/2026-05-26-sample.md
- 简历: resumes/input/sample-resume.md
- JD: intake/sample/requirements.md
```

**Step 3 Rewrite**：

```
按 resume-agent skill 执行 Step 3 Rewrite：
- name: sample
- plan: plans/2026-05-26-sample.md
- interview: reviews/2026-05-26-sample.json
- 简历: resumes/input/sample-resume.md
```

**Step 4 Eval**：

```
按 resume-agent skill 执行 Step 4 Eval：
- name: sample
- round: 1
- output: resumes/output/sample.md
- baseline: reviews/2026-05-26-sample.json
- runtime_prompt: prompts/runtime/2026-05-26-sample.interviewer.system.md
```

**Step 5 Gap**：

```
按 resume-agent skill 执行 Step 5 Gap：
- name: sample
- eval_run: evals/runs/2026-05-26-sample-r1.json
- output: resumes/output/sample.md
- JD: intake/sample/requirements.md
```
