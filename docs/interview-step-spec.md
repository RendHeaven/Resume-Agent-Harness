# Step 2: Interview — 面试官评测规格

## 目标

根据招聘要求（JD）**生成岗位专属面试官系统提示词**，以面试官身份**只读**现有简历，输出**结构化评分与书面反馈**，为 Step 3 Rewrite 提供优先级依据。

本步骤**不改写简历**，只评测。

## 前置条件

- Step 1 Plan 已完成（Plan 状态非 `待确认`）
- 无阻塞级方向问题
- `intake/<name>/requirements.md` 有效
- `prompts/system/interviewer-base.system.md` 存在

## 系统提示词（必用）

Step 2 **必须**使用两层系统提示词：

| 层级 | 路径 | 说明 |
|------|------|------|
| **Base** | `prompts/system/interviewer-base.system.md` | Harness 固定约束，Agent 只读，每次必加载 |
| **Runtime** | `prompts/runtime/YYYY-MM-DD-<name>.interviewer.system.md` | 由 Agent 根据 JD + Plan 实例化生成 |

### 生成 Runtime 提示词

1. 读取 `prompts/system/interviewer-persona.template.md`
2. 从 `intake/<name>/requirements.md` 提取：岗位名、职责、硬/软要求、加分项
3. 从 `plans/YYYY-MM-DD-<name>.md` 提取：匹配矩阵、JD 关键词、Rewrite 优先级（供对齐）
4. 填充模板，写入 `prompts/runtime/YYYY-MM-DD-<name>.interviewer.system.md`
5. 权重调整须有据（JD 明确侧重某维度时才调整，合计仍为 100）

**禁止**跳过系统提示词，直接用通用角色评分。

## 执行流程

```text
① 校验前置（Plan 完成、JD 有效）
    ↓
② 加载 prompts/system/interviewer-base.system.md
    ↓
③ 读取 JD + Plan → 生成 prompts/runtime/...interviewer.system.md
    ↓
④ 以 Base + Runtime 系统提示词进入面试官角色
    ↓
⑤ 只读 resumes/input/<name>.md → 思维链评测 → 打分
    ↓
⑥ 输出 reviews/YYYY-MM-DD-<name>.md + .json
```

## 输入

| 材料 | 路径 | 权限 |
|------|------|------|
| 基础系统提示词 | `prompts/system/interviewer-base.system.md` | 只读 |
| 人设模板 | `prompts/system/interviewer-persona.template.md` | 只读 |
| JD | `intake/<name>/requirements.md` | 只读 |
| Plan | `plans/YYYY-MM-DD-<name>.md` | 只读 |
| 简历 | `resumes/input/<name>.md` | 只读 |

## 输出

| 产物 | 路径 | 说明 |
|------|------|------|
| 实例化系统提示词 | `prompts/runtime/YYYY-MM-DD-<name>.interviewer.system.md` | 本次面试官人设 |
| 评测报告 | `reviews/YYYY-MM-DD-<name>.md` | 思维链 + 分项评分 + 反馈 |
| 结构化分数 | `reviews/YYYY-MM-DD-<name>.json` | 供 Rewrite / Eval 引用 |

模板见 [docs/templates/interview-review-template.md](templates/interview-review-template.md)。

## 评分维度（默认）

见 `interviewer-base.system.md`。Runtime 提示词可调整权重，但须说明理由且合计 100。

## 报告必须包含

1. **任务信息** — 关联 plan / jd / resume / runtime prompt 路径
2. **面试官人设摘要** — 从 runtime 提示词提炼
3. **评测思维链** — JD 核心标准 → 证据查找 → 打分理由
4. **JD 逐条核验表** — pass / partial / fail / not_found
5. **分项评分表** — 6 维度 + 总分
6. **主要差距（top_gaps）** — 按影响排序，≤ 5 条
7. **Rewrite 优先级建议** — 供 Step 3 使用，≤ 5 条
8. **与 Plan 的差异说明** — 若有

## 事实边界

- 评测对象**仅**为 `resumes/input/<name>.md`
- 证据引用须指向简历具体段落；无证据写「简历未体现」
- 不得捏造经历或假设隐含技能

## DoD（完成定义）

- [ ] 已加载 `interviewer-base.system.md`
- [ ] `prompts/runtime/YYYY-MM-DD-<name>.interviewer.system.md` 已生成
- [ ] `reviews/YYYY-MM-DD-<name>.md` 已创建，含思维链与 6 维度评分
- [ ] `reviews/YYYY-MM-DD-<name>.json` 已创建，字段完整
- [ ] 未修改 input / intake / prompts/system
- [ ] 未在本步骤改写简历

## 触发示例

```
按 resume-agent skill 执行 Step 2 Interview：
- name: sample
- plan: plans/2026-05-26-sample.md
- 简历: resumes/input/sample-resume.md
- JD: intake/sample/requirements.md
```

## 与后续步骤的关系

```text
Interview（本步）
  ↓ reviews/YYYY-MM-DD-<name>.md + .json
Rewrite（Step 3）  ← 须引用 top_gaps 与 rewrite_priorities
Eval（Step 4）     ← 复用 runtime 提示词 + 3 子代理全票评测 output；不及格 → 回到 Rewrite
```

**禁止**跳过 Interview 直接进入 Rewrite。
