# 可观测性 — Dashboard 字段说明

`evals/dashboard.md` 由 [`scripts/aggregate-evals.mjs`](../scripts/aggregate-evals.mjs) 自动生成。本文档说明各字段含义与建议 SLO。

## 全局统计

| 字段 | 含义 | 建议 SLO |
|------|------|----------|
| `cases_total` | 已记录的 case 数（基于 `evals/runs/*.json` 唯一 `case` 字段） | — |
| `panel_passed_cases` | 至少一轮 `panel_passed === true` 的 case 数 | 接近 100% |
| `pass_rate` | `panel_passed_cases / cases_total` | ≥ 90% |
| `avg_rounds_to_pass` | 通过 case 的"首次通过 round"平均值 | < 2.0 |
| `high_variance_cases` | 三 panelist `total` 样本方差 > 100 的 case 数（约 stdev > 10） | 越低越好 |

## Case 列表字段

| 字段 | 含义 |
|------|------|
| `case` | 来自 `evals/runs/*.json` 的 `case` 字段 |
| `rounds` | 该 case 已记录的 run 数（每轮一份 `r{N}.json`） |
| `passed_at` | 首次 `panel_passed === true` 的 round；`null` 表至今未通过 |
| `last_round` | 最近一轮的 N |
| `avg` | `panel_totals.average`（最近一轮） |
| `min` | `panel_totals.min`（最近一轮，3 panelist 中最低分） |
| `variance` | `panel_totals.a/b/c` 的样本方差（最近一轮） |
| `flags` | 来自最近一轮 `flags[]` |

## Flags

来源 [schemas/eval-run.schema.json](../schemas/eval-run.schema.json) `flags[]`：

| flag | 触发条件 |
|------|----------|
| `high_variance` | panelist 间 total 样本方差 > 100（约 stdev > 10） |
| `regression_vs_baseline` | `delta_vs_baseline_avg < 0`（output 比 input baseline 还低） |
| `low_keyword_retention` | 任一 panelist `keyword_retention_rate < 0.8` |

## Top Skill Gaps

汇总自 `gaps/*.json` 的 `skill_gaps[]`，按 `category/type` 分类计数，取 top 10。用于发现高频缺口、指导 rules / skill 迭代。

## 用法

```bash
node scripts/aggregate-evals.mjs
```

每次完成 Step 4 / Step 5 后建议手动跑一次（也可由 hook 在 stop 时触发）。
