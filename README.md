# Resume-Agent-Harness

> **Cursor 原生 Harness 工程**：在 Cursor IDE 内分析、改写、评测简历的标准化流水线。
>
> 没有 Web 服务、没有 API、没有外部依赖 —— 全部能力由 **Cursor Rules + Skill + Hooks + 零依赖 Node ESM 脚本 + JSON Schema 契约**组合而成。

---

## 是什么

把"改简历"这件事工程化为一条**五步状态机**：

```text
Step 1 Plan  →  Step 2 Interview  →  Step 3 Rewrite  →  Step 4 Eval  →  Step 5 Gap
   计划            面试官评测           悬念式改写        三面试官面板      JD 差距对照
```

每一步都有**输入契约 / 输出契约 / DoD / 自动校验**，跳步、捏造事实、覆盖只读区均被 Harness 强制拦截。

更深入的设计动机见 [ARCHITECTURE.md](ARCHITECTURE.md) 与 [AGENTS.md](AGENTS.md)。

---

## 前置准备

### 1. 环境

- Cursor IDE（启用 Hooks：Cursor Settings → Hooks）
- Node.js（仅用于跑 `scripts/*.mjs`，无 npm 依赖）
- 仓库根目录打开 Cursor 工作区，`.cursor/hooks.json` 会被自动加载

### 2. 准备输入文件（用户专属只读区，Agent 不得写入）

| 必备 | 路径 | 说明 |
|------|------|------|
| ✅ | `resumes/input/<name>.md` | 原始简历 |
| ✅ | `intake/<name>/requirements.md` | **JD 招聘要求（必填，门禁）** |
| 推荐 | `intake/<name>/direction.md` | 求职方向（目标岗位、偏好、限制） |
| 推荐 | `intake/<name>/projects.md` | 项目细节补充材料 |

> ⚠️ **JD 门禁**：`intake/<name>/requirements.md` 不存在或为空时，Agent 会拒绝执行任何步骤。
>
> ⚠️ **只读保护**：`intake/`、`resumes/input/`、`prompts/system/`、`schemas/`、`docs/adr/` 由 `before-shell-execution` hook 拦截 Agent 写入。

---

## 启动一次任务

在 Cursor 聊天框中输入触发语：

```text
按 resume-agent skill 处理 resumes/input/<name>.md，目标岗位见 intake/<name>/requirements.md
```

Cursor 会自动识别 `resume-agent` skill（`.cursor/skills/resume-agent/SKILL.md`）并按五步流程推进。

如需分步触发，见 [SKILL.md 示例触发语](.cursor/skills/resume-agent/SKILL.md#示例触发语)。

---

## 五步使用流程

### Step 1 — Plan（优化计划）

Agent 读取 `resumes/input/`、`intake/` 全部材料，先做**思维链推演**与**方向三角对齐**（direction × JD × resume）：

- 若发现**阻塞级方向矛盾** → 在聊天中反问并暂停，引导你更新 `intake/<name>/direction.md`
- 若通过 → 落盘 `plans/YYYY-MM-DD-<name>.md`（含思维链 + 求职意向总结 + 项目信息总结 + JD 匹配矩阵 + 后续指引）

> 你的动作：审阅 Plan，确认方向无误；如有补充信息请更新 `intake/`。

### Step 2 — Interview（面试官 baseline 评测）

Agent 用 JD 实例化出**岗位专属面试官人设**，以面试官身份**只读** `resumes/input/`，输出结构化评分：

| 产物 | 路径 |
|------|------|
| 岗位人设 | `prompts/runtime/YYYY-MM-DD-<name>.interviewer.system.md` |
| 评测报告 | `reviews/YYYY-MM-DD-<name>.md` |
| 结构化分数 | `reviews/YYYY-MM-DD-<name>.json`（6 维 × 100 分） |

> 你的动作：审阅 `top_gaps` 与 `rewrite_priorities`，作为 Step 3 的输入。

### Step 3 — Rewrite（悬念式改写）

Agent 按 [悬念设计简历模板](docs/templates/resume-suspense-template.md) 重组简历：

1. 先写入 `resumes/working/<name>.md`（中间稿）
2. 在聊天中展示改动摘要
3. **等待你确认** → 写入 `resumes/output/<name>.md`（定稿）

> 你的动作：审阅 working 稿，对比改动摘要，**口头确认**后 Agent 才会写入 output。
>
> ⚠️ Agent **不会**在未经确认时直接生成 output 定稿。

### Step 4 — Eval（三面试官面板）

Agent **并行启动 3 个子代理**（Task tool × 3），各带不同评审透镜：

| Panelist | 角色 | temperature | 关注 |
|----------|------|-------------|------|
| A | 技术深度面试官 | 0.2 | 架构深度、技术含金量 |
| B | 门槛筛选面试官 | 0.5 | JD 硬性逐条 + ATS 关键词 |
| C | 用人经理 | 0.8 | 职级 fit、业务 impact |

| 产物 | 路径 |
|------|------|
| 三份子代理报告 | `evals/panel/YYYY-MM-DD-<name>-r{N}-interviewer-{a,b,c}.{md,json}` |
| 主 Agent 汇总 | `evals/runs/YYYY-MM-DD-<name>-r{N}.json` |

**全票通过制**：仅当 `a.passed && b.passed && c.passed` 才能进入 Step 5。

**不及格自动循环**：合并三份 `rewrite_priorities` → 回到 Step 3 → 用新 round 重跑 Step 4，最多 3 轮，超出则停止等待人工。

### Step 5 — Gap（JD 差距对照）

对照已通过的定稿与 JD，**诚实**产出：

- JD 对照矩阵（能力缺失 / 证据不足 / 表达留白 / 已契合）
- 技能不足清单
- P0/P1/P2 改进建议（**面向真实成长，不建议你向简历编造内容**）
- 契合度区间（**禁止**声称 100%）

| 产物 | 路径 |
|------|------|
| 差距报告 | `gaps/YYYY-MM-DD-<name>.md` |
| 结构化数据 | `gaps/YYYY-MM-DD-<name>.json` |

✅ **本步完成 = 任务结束**。

---

## 目录结构速查

```text
resumes/input/      用户写 — 原始简历（只读保护）
intake/             用户写 — direction / requirements / projects（只读保护）
plans/              Agent 写 — Step 1 计划
prompts/system/     Harness 维护 — 基础提示词（只读保护）
prompts/runtime/    Agent 写 — Step 2 实例化岗位人设
reviews/            Agent 写 — Step 2 baseline 评测
resumes/working/    Agent 写 — Step 3 中间稿
resumes/output/     Agent 写（用户确认后） — Step 3 定稿
evals/panel/        子代理写 — Step 4 三份独立评测
evals/runs/         主 Agent 写 — Step 4 面板汇总
evals/dashboard.md  脚本自动生成 — 跨 case SLO 看板
gaps/               Agent 写 — Step 5 差距报告
schemas/            Harness 维护 — JSON Schema 契约（只读保护）
scripts/            Harness 维护 — 零依赖校验脚本
docs/adr/           变更决策记录（只读保护）
```

---

## Harness 自检命令

任意时刻你都可以手动跑这些零依赖 Node ESM 脚本：

```bash
# 校验任意输出 JSON（按路径自动选 schema）
node scripts/validate-output.mjs <path>

# 简历结构与 meta 引导语检查
node scripts/score-resume.mjs resumes/output/<name>.md

# input ↔ output 章节级 diff + JD 关键词保留率
node scripts/diff-resume.mjs resumes/input/<name>.md resumes/output/<name>.md intake/<name>/requirements.md

# PII 扫描（评测 / 差距记录强制）
node scripts/redact-pii.mjs <path>

# 计算下一安全轮次（防覆盖）
node scripts/next-round.mjs <name>

# 跨 case 汇总 → evals/dashboard.md
node scripts/aggregate-evals.mjs

# md 内部相对链接断链检查（Harness 变更门禁）
node scripts/check-doc-refs.mjs
```

大部分校验已由 `.cursor/hooks.json` 自动触发，无需手动跑。

---

## Hooks 自动校验

| 时机 | 行为 |
|------|------|
| `beforeShellExecution` | **阻断**危险命令（`rm -rf`、`git push --force`、`DROP DATABASE`）与对只读区的写入 |
| `afterFileEdit` | 按路径路由分发校验：JSON → schema 校验 + PII 扫描；简历 md → 结构与卫生检查 |
| `stop` | 检查 **8 项产出契约**完整性 + 刷新 `evals/dashboard.md` |

详见 [.cursor/hooks/README.md](.cursor/hooks/README.md)。

---

## 8 项输出契约（任务完成标志）

一次完整任务必须产出：

1. `plans/YYYY-MM-DD-<name>.md`
2. `prompts/runtime/YYYY-MM-DD-<name>.interviewer.system.md`
3. `reviews/YYYY-MM-DD-<name>.{md,json}`
4. `resumes/working/<name>.md`
5. `resumes/output/<name>.md`（用户确认后）
6. `evals/runs/YYYY-MM-DD-<name>-r{N}.json`
7. `evals/panel/...-r{N}-interviewer-{a,b,c}.{md,json}`
8. `gaps/YYYY-MM-DD-<name>.{md,json}` ← **任务完成标志**

`stop` hook 会自动检查这 8 项是否齐全。

---

## 工作原则

- **事实边界**：只能重组、润色、突出已有信息；缺数据用 `[待补充: ...]`，**不得编造**
- **小步验证**：先 working 稿，**用户确认**后再写入 output
- **全票验收**：Step 4 须 3 子代理全部通过
- **诚实差距**：Step 5 输出真实缺口与成长建议，不教你造假
- **PII 安全**：评测/差距记录强制脱敏

---

## 进阶阅读

- [AGENTS.md](AGENTS.md) — 仓库入口与原则
- [ARCHITECTURE.md](ARCHITECTURE.md) — 分层与依赖方向
- [docs/WORKFLOW.md](docs/WORKFLOW.md) — 人类操作手册
- [.cursor/skills/resume-agent/SKILL.md](.cursor/skills/resume-agent/SKILL.md) — 五步流程 canonical 定义
- [docs/plan-step-spec.md](docs/plan-step-spec.md) / [interview-step-spec.md](docs/interview-step-spec.md) / [rewrite-step-spec.md](docs/rewrite-step-spec.md) / [eval-step-spec.md](docs/eval-step-spec.md) / [gap-step-spec.md](docs/gap-step-spec.md) — 各步详细规格
- [docs/adr/](docs/adr/) — Harness 变更决策记录

---

## 触发语速查

| 场景 | 触发语 |
|------|--------|
| 全流程 | `按 resume-agent skill 处理 resumes/input/<name>.md，目标岗位见 intake/<name>/requirements.md` |
| 只跑 Step 1 | `按 resume-agent skill 执行 Step 1 Plan：name: <name>` |
| 只跑 Step 4 | `按 resume-agent skill 执行 Step 4 Eval：name: <name>, round: <N>` |
| 自检 | `跑 node scripts/check-doc-refs.mjs 并报告` |

完整示例见 [SKILL.md](.cursor/skills/resume-agent/SKILL.md#示例触发语)。
