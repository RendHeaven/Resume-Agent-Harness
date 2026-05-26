# ADR-007: 面板面试官独立性与可复现性

- **状态**：已采纳
- **日期**：2026-05-26
- **取代**：—
- **被取代**：—

## 背景

Step 4 三面试官面板（Lens A/B/C）原始设计要求"独立打分、互不参考"，但实际执行存在两个问题：

1. **伪独立性**：A/B/C 默认跑同模型、同 base、相邻 prompt，相关性极高。三票其实是"一个面试官戴三顶帽子"，并未对冲单 LLM 偏差。
2. **不可复现**：`evals/panel/*.json` 不记录 `model` / `temperature` / `seed` / `prompt_sha`，规则或提示词变更后无法回放历史评测。

当 panelist 高度相关时，"3/3 全票通过"的安全假设崩塌——失败模式同步发生，看似严格实为安慰。

## 决策

### 1. Panelist 须使用不同 `temperature`

| Panelist | 默认 temperature | 角色 |
|----------|------------------|------|
| A（技术深度） | 0.2 | 严格推理，拒绝模糊证据 |
| B（门槛筛选） | 0.5 | 中性核验，平衡 |
| C（用人经理） | 0.8 | 放权给业务直觉，更愿冒险给"yes" |

> 不同 `temperature` 在同一 LLM 上仍非完全独立，但显著降低锚定相关性。若运行环境支持多 model，可在 ADR 升级时进一步指派不同模型。

### 2. 强制 `provenance` 写入

`evals/panel/*.json` 与 `evals/runs/*.json` **必须**包含 `provenance`：

- `agent_model`：执行 LLM 标识（如 `claude-4.6-sonnet`）
- `temperature`：本次实际值
- `seed`：可为 `null`（多数 API 不暴露）
- `prompt_shas`：所加载系统提示词的 sha1 前 12 位（base / runtime / lens / eval_mode）
- `generated_at`：ISO8601 时间戳

由 [`schemas/common.provenance.json`](../../schemas/common.provenance.json) 强制；`scripts/validate-output.mjs` 在 `afterFileEdit` hook 中自动校验。

### 3. 一致性方差检查

`scripts/aggregate-evals.mjs` 计算每轮三 panelist `total` 的样本方差：

- `variance > 100`（约 stdev > 10）→ 在 `evals/runs/*.json` 的 `flags[]` 加入 `high_variance`
- 在 `evals/dashboard.md` 全局统计行突出显示

`high_variance` 不阻断 panel_passed 判定（避免 paradox：方差大正说明独立性提升），但提示用户复盘是否 lens 设计/prompt 出现倾向。

### 4. baseline 退化检查

若 `delta_vs_baseline_avg < 0`（output 比 input baseline 还低），加入 `regression_vs_baseline` flag。

## 后果

### 正面

- 面板独立性从"声明式"升级为"参数级"。
- 历史评测可复现：`prompt_shas` + `temperature` + `agent_model` 锁住了所有可控变量。
- Dashboard 提供宏观信号，让 Harness 维护者发现 lens 是否同质化。

### 负面 / 取舍

- 单一 LLM 的不同 temperature 仍非真正独立；如要完全消除相关性，须支持多 model（暂不强制，受 SDK / 用户配置限制）。
- 高 temperature panelist（C，0.8）波动性大，可能拉低 pass 率；需观察 dashboard 数据，必要时调整。
- `prompt_shas` 计算给 Agent 增加一步（读文件 + sha1 前 12 位），微小开销。

## 实现要点

- [`prompts/system/eval-panel.system.md`](../../prompts/system/eval-panel.system.md) 在子代理 prompt 模板中传入 `temperature`、`seed`。
- [`prompts/system/interviewer-eval-mode.system.md`](../../prompts/system/interviewer-eval-mode.system.md) 强制 panel JSON 含 `provenance.temperature` 与 `prompt_shas`。
- [`schemas/panel-report.schema.json`](../../schemas/panel-report.schema.json) 与 [`schemas/eval-run.schema.json`](../../schemas/eval-run.schema.json) 必填 `provenance`。
- [`scripts/aggregate-evals.mjs`](../../scripts/aggregate-evals.mjs) 计算方差与 flag。

## 后续观察

- 若 dashboard 出现持续 `high_variance` 且 `pass_rate` 低于 SLO，启动 ADR 升级路径，引入多 model panelist。
