# evals/ — 质量反馈与回归

```text
evals/
  panel/        ← Step 4 三子代理面试官报告（每轮 × 3）
  runs/         ← Step 4 面板汇总（每轮 1 份）
  cases/        ← 输入级回归 fixture（仅 input + expected-shape.json，不含 golden output）
  dashboard.md  ← 跨 case 自动汇总（由 scripts/aggregate-evals.mjs 生成）
```

## 通过规则

**3/3 全票通过** — 见 [../docs/eval-step-spec.md](../docs/eval-step-spec.md)。

## 循环

不及格 → Step 3 Rewrite → Step 4 round+1（最多 3 轮）。

## Schema 校验

所有 `panel/*.json` 与 `runs/*.json` 必须通过 [../schemas/](../schemas/) 中的 schema 校验：

```bash
node scripts/validate-output.mjs evals/runs/<file>.json
```

## PII 安全

所有 `panel/` 与 `runs/` 写入后由 hook 触发 `redact-pii.mjs` 扫描；命中即非零退出。

## Dashboard

```bash
node scripts/aggregate-evals.mjs
```

更新 `evals/dashboard.md`：通过率、平均轮次、top gap 类别、低分维度分布、panelist 间方差。字段含义见 [../docs/observability.md](../docs/observability.md)。

## 回归 fixture

`evals/cases/<fixture-id>/` 含：

- `direction.md` / `requirements.md` / `projects.md` / `resume.md` — 输入级别样例（不进入 `intake/`，仅供 Harness 自检）
- `expected-shape.json` — 声明此 fixture 跑五步流程时的预期形态（应通过/失败、应反问、应有几份产出）

**不附 golden output**：避免锁死创造性，仅校验产出形态。
