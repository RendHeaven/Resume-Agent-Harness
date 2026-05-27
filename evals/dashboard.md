# evals/dashboard.md

> 自动生成于 2026-05-27T06:12:06.815Z（来源：`evals/runs/*.json` + `gaps/*.json`）。字段说明见 [../docs/observability.md](../docs/observability.md)。

## 全局统计

- cases_total: **1**
- panel_passed_cases: **1**
- pass_rate: **100.0%**
- avg_rounds_to_pass: **1**
- high_variance_cases: **0** (sample variance > 100)

## Case 列表

| case | rounds | passed_at | last_round | avg | min | variance | flags |
|------|--------|-----------|-----------|-----|-----|----------|-------|
| jialuxin-harness | 1 | 1 | 1 | 93 | 85 | 32.67 | high_variance |

## Top Skill Gaps（来自 Step 5）

| category/type | count |
|---------------|-------|
| hard_skill/evidence_insufficient | 4 |
| seniority/evidence_insufficient | 3 |
| hard_skill/capability_missing | 2 |
| hard_skill/expression_suspended | 1 |
| domain_knowledge/capability_missing | 1 |
| soft_skill/capability_missing | 1 |
| soft_skill/evidence_insufficient | 1 |

## 字段说明

- `passed_at`：首次 panel_passed 为 true 的 round（null 表未通过）
- `variance`：本 case 最新轮次三 panelist total 的样本方差（>100 大致 stdev>10，触发 high_variance flag）
- `flags`：来自 eval-run.json 的标记，可能值见 schemas/eval-run.schema.json
