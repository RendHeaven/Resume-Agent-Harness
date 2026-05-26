# ADR-008: 悬念设计 ↔ ATS 关键词的显式权衡

- **状态**：已采纳
- **日期**：2026-05-26

## 背景

Resume-Agent 同时持有两条规则，它们在边界上互相矛盾：

1. [`docs/templates/resume-suspense-template.md`](../templates/resume-suspense-template.md) 要求 Process **折叠 HOW**，用专业术语作钩子诱导面试官追问。
2. [`prompts/system/interviewer-lens-b.system.md`](../../prompts/system/interviewer-lens-b.system.md) 把"悬念设计是否导致关键信息缺失影响 ATS 筛选"列入否决条件。

两规则同时由 LLM 自由心证，**没有客观仲裁**：

- 悬念过深 → 关键词被"机制名"等抽象词替代 → ATS 漏掉 → Lens B 否决
- 悬念过浅 → 失去"引面试官追问"的设计目标 → Lens A/C 抱怨"流水账"

ADR 需要确定：**关键词保留与悬念折叠的边界在哪？谁来仲裁？**

## 决策

### 1. 保留层级硬规则

JD 核心技术名词必须在 **§2 专业技能** 或 **§4 项目标题层**未折叠出现至少 1 次。

`Process` 正文允许折叠为机制名/架构决策；§3 工作经历允许只写宏观职责。这一分层让简历有"上层关键词全覆盖、下层悬念引追问"的复合结构。

### 2. 客观度量替代主观判断

定义：

```text
keyword_retention_rate = 在 output 中出现的 JD 关键词数 / JD 关键词总数
```

由 [`scripts/diff-resume.mjs`](../../scripts/diff-resume.mjs) 计算，启发式提取 JD 中：

- 大写/驼峰技术 token（如 `Kafka`、`gRPC`、`K8s`）
- 中文 2–8 字技能短语（如 "高并发"、"分布式"、"消息队列"）

阈值：**0.8**。

### 3. Lens B 否决条件改写

旧（主观）：
> 悬念设计是否导致 **关键信息缺失** 影响 ATS 筛选？

新（客观）：
> `keyword_retention_rate < 0.8` 且 `keywords_missing` 中含 JD 核心技术名词 → `passed: false`

软性词（如"沟通能力"）缺失只标 `partial`，不否决。

### 4. 自检前置

Step 3 Rewrite 在用户确认 output 前，**必须**跑一次 `diff-resume.mjs`，确保保留率 ≥ 0.8。模板自检清单已加入此项。

## 后果

### 正面

- 边界从 LLM 自由心证升级为脚本计算的可解释数字。
- Step 3 与 Step 4 共用同一度量，不存在"作者觉得藏得好、面试官觉得没看见"的争论。
- 关键词列表从 JD 自动提取，迭代 JD 即自动迭代度量，无需维护额外字典。

### 负面 / 取舍

- 启发式关键词提取不完美：可能把无关大写词（公司名、人名）当成技术名词，或漏掉中文复合短语。**缓解**：`scripts/diff-resume.mjs` 的 `STOP` 列表过滤通用词；用户可在 PR 中扩充。
- 阈值 0.8 是经验值；若实际 case 频繁因软性词被错误压低，可调整脚本的"软性词降权"逻辑或在 ADR 升级时修订阈值。
- 客观度量只覆盖"出现/未出现"，不评估"出现得多深"。仍需 Lens A/C 主观判断深度——但深度与门槛筛选解耦，分工清晰。

## 实现要点

- [`docs/templates/resume-suspense-template.md`](../templates/resume-suspense-template.md) — 末尾新增「关键词保留规则」章节
- [`prompts/system/interviewer-lens-b.system.md`](../../prompts/system/interviewer-lens-b.system.md) — 否决条件替换为客观规则
- [`scripts/diff-resume.mjs`](../../scripts/diff-resume.mjs) — 关键词提取与保留率计算
- [`schemas/panel-report.schema.json`](../../schemas/panel-report.schema.json) — `keyword_retention_rate` 字段（可选 0–1）

## 后续观察

- dashboard 加 `low_keyword_retention` flag（任一 panelist `keyword_retention_rate < 0.8`）
- 若多个 case 因关键词提取误判被否决，启动 ADR 升级修正提取算法或阈值
