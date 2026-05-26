# Step 4 Eval — 三面试官面板评测规格

## 目标

**重启 Step 2 面试官**，对改写后的定稿 `resumes/output/<name>.md` 重新评分。启用 **3 个子代理面试官**并行评测，**仅当三者全部通过**时任务才算通过；任一不及格则触发 **Rewrite → Eval 循环**。

## 前置条件

- Step 3 Rewrite 已完成，`resumes/output/<name>.md` 存在（用户已确认）
- Step 2 已生成 `prompts/runtime/YYYY-MM-DD-<name>.interviewer.system.md`（**Eval 复用，不重新发明人设**）
- Step 2 baseline 存在：`reviews/YYYY-MM-DD-<name>.json`

## 与 Step 2 的关系

| 维度 | Step 2 Interview（Baseline） | Step 4 Eval（Panel） |
|------|------------------------------|----------------------|
| 评测对象 | `resumes/input/<name>.md` | `resumes/output/<name>.md` |
| 面试官人设 | 生成 runtime 提示词 | **复用**同一 runtime 提示词 |
| 子代理 | 无（单面试官） | **3 个子代理**，各带不同评审透镜 |
| 通过规则 | 仅评分，不阻断 | **3/3 全票通过**才结束任务 |
| 输出目录 | `reviews/` | `evals/panel/` + `evals/runs/` |

## 系统提示词（必用）

每个子代理加载 **四层**提示词：

| 层级 | 路径 | 说明 |
|------|------|------|
| Base | `prompts/system/interviewer-base.system.md` | 通用面试官约束 |
| Eval 模式 | `prompts/system/interviewer-eval-mode.system.md` | 覆盖：评测 output、对比 baseline |
| Runtime | `prompts/runtime/YYYY-MM-DD-<name>.interviewer.system.md` | **Step 2 已生成，Eval 只读复用** |
| Lens | `prompts/system/interviewer-lens-{a,b,c}.system.md` | 子代理专属评审透镜 |

面板编排见 `prompts/system/eval-panel.system.md`。

## 三子代理定义

| ID | 透镜文件 | 角色 | 默认 temperature | 额外关注 |
|----|----------|------|------------------|----------|
| **A** | `interviewer-lens-a.system.md` | 技术深度面试官 | 0.2 | 核心技能、架构深度、项目技术含金量 |
| **B** | `interviewer-lens-b.system.md` | 门槛筛选面试官 | 0.5 | 硬性条件、JD 逐条核验、ATS 关键词保留率 |
| **C** | `interviewer-lens-c.system.md` | 用人经理 | 0.8 | 职级 fit、业务 impact、综合推荐度 |

三个子代理**独立**打分、**独立**写报告，互不参考对方分数（避免锚定效应）。

**Panelist 独立性强制**：不同 `temperature` 是独立性的最低保证；`provenance.temperature`、`provenance.prompt_shas`、`provenance.agent_model` 必须写入 panel JSON。详见 [docs/adr/007-panel-independence.md](adr/007-panel-independence.md)。

## 执行流程（含子代理）

```text
① 校验 output 定稿 + Step 2 runtime 提示词 + baseline review 存在
    ↓
② 加载 eval-panel.system.md（面板编排规则）
    ↓
③ 并行启动 3 个子代理（Task / 子 Agent）：
    各读 Base + Eval模式 + Runtime + Lens-X + output 简历
    ↓
④ 各子代理写入 evals/panel/YYYY-MM-DD-<name>-r{N}-interviewer-{a,b,c}.{md,json}
    ↓
⑤ 主 Agent 汇总 → evals/runs/YYYY-MM-DD-<name>-r{N}.json
    ↓
⑥ 判定 panel_passed（3/3 全部 passed）
    ├─ 是 → 任务完成 ✓
    └─ 否 → 合并 3 份 rewrite_priorities → 回到 Step 3 → 新一轮 Eval（r{N+1}）
```

### 子代理启动契约

主 Agent 须通过 **Task 工具**（或等效子 Agent）**并行**启动 3 个 subagent，每个 prompt 须包含：

1. 读取 `docs/eval-step-spec.md` 中「子代理 DoD」
2. 读取四层系统提示词路径
3. 评测 `resumes/output/<name>.md`
4. 对比 `reviews/YYYY-MM-DD-<name>.json`（baseline 分数）
5. 输出路径：`evals/panel/YYYY-MM-DD-<name>-r{N}-interviewer-{id}.{md,json}`

**禁止**主 Agent 代替三个子代理打分（须真实并行委派）。

## 单面试官通过标准

每位子代理 `passed: true` 须**同时**满足：

1. `total >= 70`
2. `recommendation` ∈ `{ strong_yes, yes }`（不得为 `maybe` 或 `no`）
3. JD 硬性条目核验：**无** `fail` 项（`partial` 允许但须在报告中说明）

## 面板通过标准（全票制）

```text
panel_passed = interviewer_a.passed AND interviewer_b.passed AND interviewer_c.passed
```

**仅当 `panel_passed === true` 时**，进入 Step 5 Gap；**五步全部完成**后任务结束。

## 不及格循环

当 `panel_passed === false`：

1. **合并**三位面试官的 `top_gaps` 与 `rewrite_priorities`（去重，按 P0 排序）
2. **对比 baseline**：若 output 总分低于 input baseline，须标注「改写退化」并优先修复
3. **回到 Step 3 Rewrite**（同一 `<name>`，新 working 稿，用户确认后更新 output）
4. **重新执行 Step 4**，轮次 `N+1`，**追加** panel/run 记录（**禁止覆盖**旧轮次）
5. 若 **N ≥ 3** 仍不通过 → 停止自动循环，向用户输出三轮汇总报告，等待人工决策

## 输出

### 子代理产出（每轮每面试官）

| 产物 | 路径 |
|------|------|
| 面板报告 | `evals/panel/YYYY-MM-DD-<name>-r{N}-interviewer-{a,b,c}.md` |
| 面板分数 | `evals/panel/YYYY-MM-DD-<name>-r{N}-interviewer-{a,b,c}.json` |

### 主 Agent 汇总（每轮）

| 产物 | 路径 |
|------|------|
| 面板汇总 | `evals/runs/YYYY-MM-DD-<name>-r{N}.json` |

汇总 JSON  schema 见 [docs/templates/eval-run-schema.json](templates/eval-run-schema.json)。

## 子代理 DoD

- [ ] 已加载 Base + Eval模式 + Runtime + 专属 Lens
- [ ] 评测对象为 `resumes/output/<name>.md`（非 input）
- [ ] 已对比 Step 2 baseline 并报告 delta
- [ ] 思维链 + 6 维度评分 + JD 核验表完整
- [ ] JSON 中 `interviewer_id` ∈ `{ a, b, c }`，`round` = N
- [ ] **`provenance` 字段完整**（`agent_model` / `temperature` / `prompt_shas.{base,runtime,eval_mode,lens}` / `generated_at`）
- [ ] **`pii_redacted: true`**，且 `scripts/redact-pii.mjs` 扫描通过
- [ ] `validate-output.mjs` 校验通过（schemas/panel-report.schema.json）

## 主 Agent DoD

- [ ] 3 个子代理均已并行启动并完成
- [ ] `evals/runs/YYYY-MM-DD-<name>-r{N}.json` 已写入
- [ ] `panel_passed` 判定正确
- [ ] 未通过时已触发 Rewrite 循环或已达 max rounds 并通知用户
- [ ] eval 记录无完整 PII

## 触发示例

```
按 resume-agent skill 执行 Step 4 Eval：
- name: sample
- round: 1
- output: resumes/output/sample.md
- baseline: reviews/2026-05-26-sample.json
- runtime_prompt: prompts/runtime/2026-05-26-sample.interviewer.system.md
```

## 禁止

- 跳过 Step 4 结束任务
- Step 4 未全票通过即执行 Step 5
- 未启动 3 子代理即判定通过
- 2/3 通过即放行
- 覆盖 `evals/runs/` 或 `evals/panel/` 历史轮次
- Eval 阶段修改 `resumes/input/`、`intake/`、`prompts/system/`
