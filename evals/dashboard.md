# evals/dashboard.md

> 自动生成于 2026-05-26T15:18:06.121Z（来源：`evals/runs/*.json` + `gaps/*.json`）。字段说明见 [../docs/observability.md](../docs/observability.md)。

## 全局统计

- cases_total: **0**
- panel_passed_cases: **0**
- pass_rate: **0.0%**
- avg_rounds_to_pass: **-**
- high_variance_cases: **0** (sample variance > 100)

## Case 列表

> 暂无评测记录。运行 Step 4 后将自动汇总。

## Top Skill Gaps（来自 Step 5）

> 暂无 gap 报告。

## 字段说明

- `passed_at`：首次 panel_passed 为 true 的 round（null 表未通过）
- `variance`：本 case 最新轮次三 panelist total 的样本方差（>100 大致 stdev>10，触发 high_variance flag）
- `flags`：来自 eval-run.json 的标记，可能值见 schemas/eval-run.schema.json
