# ADR-003: Step 2 改为面试官评测（System Prompt 驱动）

## 状态

Accepted — 2026-05-26

## 背景

原 Step 2 为 Analyze（结构化问题清单 → `reports/`）。用户要求改为：根据 JD **生成面试官**，读取现有简历并给出**评分结果**，且本步骤**必须运用系统提示词**。

## 决策

1. **Step 2 重命名**：Analyze → **Interview（面试官评测）**
2. **新增 `prompts/` 层**：
   - `prompts/system/` — Harness 维护的 base + persona 模板（只读）
   - `prompts/runtime/` — 每次任务从 JD 实例化的面试官系统提示词
3. **输出迁移**：`reports/` → **`reviews/`**（`.md` 报告 + `.json` 分数）
4. Step 2 **必须**加载 `interviewer-base.system.md` + runtime 提示词后再评测
5. Step 3 Rewrite 引用 `reviews/` 中的 `top_gaps` 与 `rewrite_priorities`

## 后果

### 正面

- 评测角色与 JD 绑定，更贴近真实招聘场景
- 系统提示词可版本化、可复盘、可 eval 回归
- JSON 分数便于 Step 4 对比改写前后

### 负面 / 成本

- 每次任务多生成 1 个 runtime 提示词文件
- 原 `reports/` 路径废弃（Harness 早期无生产数据）

## 与 Step 4 Eval 的边界

| 步骤 | 时机 | 对象 | 目的 |
|------|------|------|------|
| Step 2 Interview | 改写前 | input 简历 | JD 匹配评分，指导 Rewrite |
| Step 4 Eval | 改写后 | output 简历 | 质量验收与回归 |
