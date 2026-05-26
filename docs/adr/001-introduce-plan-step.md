# ADR-001: 引入 Step 1 Plan 作为工作流起点

## 状态

Accepted — 2026-05-26

## 背景

原工作流为 Intake → Analyze → Rewrite → Eval（四步）。用户希望将简历优化拆为多步编排，第一步 **Plan** 在 Analyze 之前生成全面指导文档，汇总求职意向、项目信息、招聘要求。

## 决策

1. **新增 Step 1: Plan**，原 Intake 职责并入 Plan 的输入落盘阶段
2. **新目录**：
   - `intake/<name>/` — 存放 direction、requirements、projects
   - `plans/` — 存放 Plan 产出
3. **Plan 输出**必须包含三大主章节 + 后续步骤指引（见 `docs/plan-step-spec.md`）
4. **工作流顺序**：Plan → Analyze → Rewrite → Eval（四步；Plan 吸收原 Intake）
5. **Analyze 必须引用 Plan** 中的匹配矩阵与缺口清单
6. **eval run JSON** 增加 `plan` 字段

## 后果

### 正面

- 后续步骤有统一上下文，减少 Analyze / Rewrite 时的信息遗漏
- 匹配矩阵在 Plan 阶段建立，Analyze 可专注问题诊断
- 输入结构化，便于回归测试（`intake/sample/` 样例）

### 负面 / 成本

- 用户需准备 4 类输入（此前仅需简历 + 口头 JD）
- 与早期「纯 polish、不引 JD」决策部分重叠 — Plan 引入 JD 作为**总结与对齐**输入，不要求多版本 JD 匹配

## 未决事项

（无）

## 后续决策（ADR-001 补充）

- [x] **JD 必填**：用户仅提供简历、无 JD 时，**禁止**进入 Plan 及后续步骤；须强制用户补充 `requirements.md` 后再继续（2026-05-26 确认）
- [x] **`intake/` 只读**：与 `resumes/input/` 同级保护；Agent 不得创建、覆盖或删除 intake 文件，用户自行落盘（2026-05-26 确认）
