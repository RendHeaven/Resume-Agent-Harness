# schemas/ — 输出契约（只读）

本目录存放 Step 2 / 4 / 5 输出 JSON 的正式 JSON Schema（Draft 2020-12）。

| 文件 | 适用产物 |
|------|----------|
| [common.provenance.json](common.provenance.json) | 公共字段 `provenance`，被其他 schema 引用 |
| [review.schema.json](review.schema.json) | `reviews/YYYY-MM-DD-<name>.json`（Step 2） |
| [panel-report.schema.json](panel-report.schema.json) | `evals/panel/...-interviewer-{a,b,c}.json`（Step 4） |
| [eval-run.schema.json](eval-run.schema.json) | `evals/runs/YYYY-MM-DD-<name>-r{N}.json`（Step 4 汇总） |
| [gap.schema.json](gap.schema.json) | `gaps/YYYY-MM-DD-<name>.json`（Step 5） |

## 约束

- **只读**：变更须先在 `docs/adr/` 留 ADR
- 字段 `additionalProperties: false`：禁止自由扩展
- `provenance` 强制 `agent_model` + `prompt_shas.base` + `generated_at`
- `pii_redacted: true` 是常量约束，由 `scripts/redact-pii.mjs` 复核

## 校验

```bash
node scripts/validate-output.mjs <path>
```

校验器零依赖（不引入 ajv 等），实现见 [../scripts/validate-output.mjs](../scripts/validate-output.mjs)。
