# ADR-006: 新增 Step 5 Gap（JD 差距对照）

## 状态

Accepted — 2026-05-26

## 背景

Step 4 全票通过只表示简历达到投递/面试门槛，与 JD 不可能 100% 契合。用户要求在通过后增加 **JD 与简历对照**，产出**技能不足**与**改进方向**（面向真实能力成长，非简历造假）。

## 决策

1. 工作流扩展为 **五步**：Plan → Interview → Rewrite → Eval → **Gap**
2. Step 4 `panel_passed === true` 后方可进入 Step 5
3. 新增 `prompts/system/gap-analyst.system.md` 系统提示词
4. 产出 `gaps/YYYY-MM-DD-<name>.md` + `.json`
5. **任务完成**定义移至 Step 5 完成后（非 Step 4）

## 后果

- 用户获得可执行的长期成长路线图
- 与 Step 4 验收解耦：Eval 管「能不能投」，Gap 管「还差什么」
- 须严格区分「能力缺失」与「悬念留白」
