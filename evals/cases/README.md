# evals/cases/ — 输入级回归 fixture

本目录存放 Harness 自检用的最小 fixture。每个 fixture 含完整四类输入（与 `intake/<name>/` 同结构）+ `expected-shape.json` 声明预期产出形态。

## 约束

- **只读**：不得删除或覆盖（见 [`.cursor/rules/harness-safety.mdc`](../../.cursor/rules/harness-safety.mdc)）
- **不附 golden output**：仅校验产出**形态**（应有 N 个 panel json、应通过/失败、应反问），不锁死内容创造性
- **不进入 `intake/`**：fixture 仅用于 Harness 自检，**不**作为真实任务输入

## 现有 fixture

| ID | 用途 | 预期 |
|----|------|------|
| [fixture-fullstack-mismatch/](fixture-fullstack-mismatch/) | direction 与 JD 严重不符 | Plan 阶段反问并暂停，**不**落盘 plan |
| [fixture-fresh-grad/](fixture-fresh-grad/) | 应届生投资深岗（8 年/带人/千万 DAU 均不达标） | Step 4 三轮 fail，最终 `next_action: user_escalation` |

## 用法

人工 / Harness 维护者按需在临时 case name 下复制 fixture 内容到 `intake/<test-name>/`，运行五步流程，对照 `expected-shape.json` 验收：

```bash
# 1. 复制（手动，避免 hooks 阻断只读区写入）
cp -r evals/cases/fixture-fresh-grad intake/test-fresh-grad
# 2. 跑流程（按 SKILL）
# 3. 对比 expected-shape.json
# 4. 清理 intake/test-fresh-grad/
```

> **不要直接在 `evals/cases/` 内运行流程**：`intake/` 是只读区，但 fixture 文件结构是为复制到 `intake/` 而设计的；fixture 自身不是任务输入。

## 添加新 fixture

1. 新建目录 `evals/cases/fixture-<id>/`
2. 写 4 个输入文件（direction / requirements / projects / resume）
3. 写 `expected-shape.json`：声明 `expected_blocking_questions`、`expected_artifacts`、关键判定字段
4. 在本 README 表格添加一行
5. 在 `docs/adr/` 留一条 ADR（如 fixture 验收新规则）
