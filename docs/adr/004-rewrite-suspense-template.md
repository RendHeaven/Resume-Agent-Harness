# ADR-004: Step 3 采用「信息留白与悬念设计」简历模板

## 状态

Accepted — 2026-05-26

## 背景

用户定义了资深工程师简历模板，核心理念为「重结果、留悬念、引对话」，采用渐进式披露：Summary → Skills → Work → Projects → Education，且各章节环环相扣。

## 决策

1.  Canonical 模板存于 `docs/templates/resume-suspense-template.md`
2. Step 3 Rewrite 规格存于 `docs/rewrite-step-spec.md`
3. 新增 `.cursor/rules/resume-editing.mdc`，作用于 `resumes/working/` 与 `resumes/output/`
4. 改写前须完成 Summary ↔ Skills ↔ Project 映射表
5. 输出清洁：无 HTML 注释、无 meta 悬念说明、无模板占位（`[待补充]` 除外）

## 后果

- Rewrite 有明确结构与风格，减少 Agent 自由发挥导致的结构漂移
- 「环环相扣」可自检，便于 Eval 回归
- Work 与 Project 职责边界清晰，避免信息重复

## 与 Interview 的衔接

Rewrite 须逐条响应 Interview 的 `rewrite_priorities` 与 `top_gaps`，并在 Summary/Projects 中落实 JD 匹配改进。
