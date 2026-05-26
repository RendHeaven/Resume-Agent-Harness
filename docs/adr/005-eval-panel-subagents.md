# ADR-005: Step 4 三面试官面板评测与子代理循环

## 状态

Accepted — 2026-05-26

## 背景

用户要求 Step 4 重启 Step 2 面试官对改写后简历重评；不及格则循环 Rewrite；引入 **3 个子代理面试官**，**全票通过**才算任务完成。

## 决策

1. Step 4 **复用** Step 2 的 `prompts/runtime/*.interviewer.system.md`，评测对象改为 `resumes/output/`
2. 新增 Eval 模式覆盖层 `interviewer-eval-mode.system.md` + 面板编排 `eval-panel.system.md`
3. 三子代理透镜：`interviewer-lens-{a,b,c}.system.md`（技术 / 门槛 / 用人经理）
4. 主 Agent **并行**启动 3 子代理（Task），禁止代打
5. 通过规则：`panel_passed = a.passed && b.passed && c.passed`；单人 pass：total≥70 且 recommendation∈{strong_yes,yes} 且无 JD fail
6. 不及格 → 合并 priorities → Step 3 → Step 4（round+1），最多 3 轮
7. 产出：`evals/panel/`（子代理）+ `evals/runs/`（汇总）

## 后果

- Step 4 成本更高（3× 评测），但降低单一面试官误判
- 全票制可能更严格，需依赖循环 Rewrite 收敛
- 主 Agent 须正确编排子代理，Skill 中明确禁止主 Agent 代评
