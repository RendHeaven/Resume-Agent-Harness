# Step 5: Gap — JD 与简历差距对照规格

## 目标

简历已通过 Step 4 三面试官全票评测，但**不可能 100% 契合 JD**。本步骤对 **招聘要求 × 已通过定稿简历** 做系统性对照，诚实产出：

1. **用户自身技能不足**（JD 要求有、简历无/弱证据）
2. **需要改进的地方**（能力、经历、表达、可补充材料——面向真实成长，非简历造假）

本步骤**不改写简历**，产出差距报告供用户长期行动。

## 前置条件

- Step 4 `panel_passed === true`（指定轮次 `r{N}` 的 `evals/runs/...-r{N}.json`）
- `resumes/output/<name>.md` 为已通过评测的定稿
- `intake/<name>/requirements.md` 有效

**禁止**在 Step 4 未全票通过时执行 Step 5（应先完成 Rewrite → Eval 循环）。

## 系统提示词（必用）

加载 `prompts/system/gap-analyst.system.md`（Harness 只读）。

## 必读输入

| 材料 | 路径 | 用途 |
|------|------|------|
| JD | `intake/<name>/requirements.md` | 对照基准 |
| 定稿简历 | `resumes/output/<name>.md` | 已通过评测的呈现面 |
| Plan | `plans/YYYY-MM-DD-<name>.md` | 历史匹配矩阵、项目详情 |
| 项目补充 | `intake/<name>/projects.md` | 判断「未写进简历但用户具备」vs「真实缺失」 |
| Step 4 汇总 | `evals/runs/YYYY-MM-DD-<name>-r{N}.json` | 已通过轮次、panel 残留 gaps |
| 三份 Panel 报告 | `evals/panel/...-interviewer-{a,b,c}.json` | 合并面试官已识别的 gaps |

## 执行流程

```text
① 校验 panel_passed === true
    ↓
② 加载 gap-analyst.system.md
    ↓
③ 从 JD 提取完整要求清单（硬/软/加分）
    ↓
④ 逐条对照 output 简历 + projects 补充（非 input）
    ↓
⑤ 标注：已契合 / 部分契合 / 未契合 / 无法从材料判断
    ↓
⑥ 归纳技能不足 + 改进建议（分 P0/P1/P2）
    ↓
⑦ 估算契合度（诚实区间，不得声称 100%）
    ↓
⑧ 输出 gaps/YYYY-MM-DD-<name>.md + .json
```

## 输出

| 产物 | 路径 |
|------|------|
| 差距对照报告 | `gaps/YYYY-MM-DD-<name>.md` |
| 结构化差距 | `gaps/YYYY-MM-DD-<name>.json` |

模板见 [docs/templates/gap-analysis-template.md](templates/gap-analysis-template.md)。

## 报告必须包含

### 1. 契合度总览

- **估计契合度**：`XX% – YY%` 区间（附说明：通过评测 ≠ 完美匹配）
- 与 Step 4 面板均分的关系（参考，非重复打分）

### 2. JD × 简历对照矩阵（核心）

逐条 JD 要求：

| JD 条目 | 类型 | 简历证据 | 契合度 | 差距说明 |
|---------|------|----------|--------|----------|
| | 硬/软/加分 | 引用/无 | 高/中/低/无 | |

### 3. 技能不足清单

分类列出**真实缺失或证据不足**的能力：

- 硬技能（技术栈、工具、方法论）
- 领域知识（行业、业务）
- 职级能力（架构、带人、治理）
- 软性能力（沟通、协作、推动力）

**禁止**把「简历悬念留白未写细」误判为「不具备」——须区分：

| 类型 | 说明 |
|------|------|
| **能力缺失** | 材料中无任何依据，JD 要求明确 |
| **证据不足** | 可能有经历但未在简历中展开 |
| **表达留白** | 悬念设计刻意折叠，Interview 已通过 |

### 4. 改进建议（面向用户成长）

每条建议须包含：

- **改什么**（具体能力/经历/产出）
- **为什么**（对应哪条 JD）
- **怎么做**（可执行：项目实践、学习路径、证书、内部机会——**非**编造简历）
- **优先级** P0 / P1 / P2
- **预期影响**（对契合度提升的定性判断）

### 5. 已契合优势（简要）

列出已较好覆盖的 JD 要求，避免用户只看到自己的不足。

### 6. 与 Step 4 的衔接

- 合并三面试官 `top_gaps` 中**尚未通过真实能力提升解决**的项
- 标注哪些 gap 属于「简历层面已优化尽」、哪些属于「能力/经历真实缺口」

## 事实边界

- 对照依据：**output 简历** + **projects 补充** + **Plan**；不得假设 input 有而 output 删去的无依据内容
- **禁止**建议用户向简历添加不存在的技能或项目
- **禁止**为追求高契合度百分比而粉饰差距
- 契合度估计须保守、可解释

## DoD

- [ ] Step 4 全票通过已确认
- [ ] 已加载 `gap-analyst.system.md`
- [ ] JD 对照矩阵覆盖 ≥ 90% JD 核心条目
- [ ] 技能不足与改进建议分 P0/P1/P2
- [ ] 已区分「能力缺失 / 证据不足 / 表达留白」
- [ ] `gaps/YYYY-MM-DD-<name>.md` + `.json` 已创建
- [ ] 未修改 output 简历、input、intake

## 触发示例

```
按 resume-agent skill 执行 Step 5 Gap：
- name: sample
- eval_run: evals/runs/2026-05-26-sample-r1.json
- output: resumes/output/sample.md
- JD: intake/sample/requirements.md
```

## 与全流程的关系

```text
Step 4 panel_passed === true
    ↓
Step 5 Gap（本步）→ gaps/YYYY-MM-DD-<name>.md
    ↓
任务完成（五步闭环）
```

**禁止**跳过 Step 5 在 Step 4 通过后直接标记任务完成。
