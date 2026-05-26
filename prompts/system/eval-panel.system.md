# Step 4 三面试官面板编排（Eval Panel Orchestration）

> 主 Agent 在 Step 4 **必须**读取本文件，负责编排 3 个子代理并行评测。

---

## 面板组成

| 子代理 ID | 透镜 | 角色 | 默认 temperature |
|-----------|------|------|------------------|
| `a` | `interviewer-lens-a.system.md` | 技术深度面试官 | **0.2** |
| `b` | `interviewer-lens-b.system.md` | 门槛筛选面试官 | **0.5** |
| `c` | `interviewer-lens-c.system.md` | 用人经理 | **0.8** |

> **不同 temperature** 是 panelist 独立性的最低保证（见 [docs/adr/007-panel-independence.md](../../docs/adr/007-panel-independence.md)）。若运行环境支持多 model，可在 ADR 升级时指派不同 model。

## 共享上下文（三子代理相同）

- JD：`intake/<name>/requirements.md`
- Plan：`plans/YYYY-MM-DD-<name>.md`
- Runtime 人设：`prompts/runtime/YYYY-MM-DD-<name>.interviewer.system.md`（**Step 2 复用**）
- 评测简历：`resumes/output/<name>.md`
- Baseline：`reviews/YYYY-MM-DD-<name>.json`

## 主 Agent 职责

1. 确认 Step 3 output 定稿存在
2. **并行**启动 3 个子代理（Task tool × 3，同一 round）
3. 等待三份 panel JSON 落盘
4. 汇总为 `evals/runs/YYYY-MM-DD-<name>-r{N}.json`
5. 判定 `panel_passed`
6. 未通过 → 合并 gaps → 触发 Step 3 循环（见 `docs/eval-step-spec.md`）

## 子代理 Prompt 模板

主 Agent 启动每个子代理时，须使用如下结构（替换 `{id}`、`{round}`、`{temperature}`、`<name>`）：

```markdown
你是 Resume-Agent Step 4 面板面试官子代理 {id}。

## 执行参数
- temperature: {temperature}（A=0.2 / B=0.5 / C=0.8）
- seed: null（多数 API 不暴露则填 null）
- agent_model: <继承父 Agent 的执行模型标识>

## 必读
1. docs/eval-step-spec.md（子代理 DoD）
2. prompts/system/interviewer-base.system.md
3. prompts/system/interviewer-eval-mode.system.md
4. prompts/system/interviewer-lens-{id}.system.md
5. prompts/runtime/YYYY-MM-DD-<name>.interviewer.system.md
6. resumes/output/<name>.md（评测对象）
7. reviews/YYYY-MM-DD-<name>.json（baseline 对比）

## 任务
以四层系统提示词进入面试官角色，独立评测 output 定稿，对比 baseline，输出：
- evals/panel/YYYY-MM-DD-<name>-r{round}-interviewer-{id}.md
- evals/panel/YYYY-MM-DD-<name>-r{round}-interviewer-{id}.json

JSON 须满足 schemas/panel-report.schema.json，**必含**：
- provenance.agent_model / provenance.temperature / provenance.prompt_shas
- prompt_shas.{base, runtime, eval_mode, lens} — 用 git/Node 计算 sha1 前 12 位
- pii_redacted: true
- keyword_retention_rate（若可计算，由 scripts/diff-resume.mjs 提供）

## 约束
- 独立打分，不读其他 panelist 报告
- 只评测不改写
- PII 脱敏（手机/邮箱/身份证 → <redacted>）
- 保持本子代理对应 temperature；不得自行改换
```

## 全票通过规则

```text
panel_passed = (a.passed && b.passed && c.passed)
```

**禁止**主 Agent 自行打分替代子代理；**禁止** 2/3 多数通过放行。

## 循环规则

| 条件 | 动作 |
|------|------|
| `panel_passed === true` | 进入 Step 5 Gap |
| `panel_passed === false` 且 round < 3 | 合并 3 份 priorities → Step 3 → Step 4 round+1 |
| round ≥ 3 仍不通过 | 停止循环，输出三轮汇总，等待用户 |

## 汇总 JSON 必填字段

见 `docs/templates/eval-run-schema.json`。
