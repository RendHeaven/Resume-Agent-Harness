# ADR-010: Rewrite 步骤强制行数上限 80 + 禁止水字数

- **状态**：已采纳
- **日期**：2026-05-27
- **关联**：[ADR-004](004-rewrite-suspense-template.md)、[ADR-008](008-suspense-vs-ats-tradeoff.md)、[ADR-009](009-harness-feedback-layer.md)

## 背景

Step 3 Rewrite 此前仅在 prompt 与文档层面要求「信息密度」「环环相扣」「Work 1–2 行宏观职责」，但**没有客观的篇幅度量**，存在以下风险：

- Agent 为响应 `top_gaps` 而堆砌内容，产出过长简历，反而降低面试官扫读效率
- 「水字数」行为（通用形容词、同义复述、罗列工具版本）难以被 Step 2/4 评分器稳定识别
- 不同 case 输出长度漂移大，dashboard 难以横向对比
- 现有 fixture 简历仅 27 / 33 行，业内主流单页简历也通常控制在 40–60 行，缺一个统一的硬上限作底线

## 决策

### 1. 引入硬性行数上限 `MAX_LINES = 80`

`resumes/working/**` 与 `resumes/output/**` 总行数（含空行）≤ 80 行，超出即 FAIL。

### 2. 在 score-resume.mjs 中自动校验

`scripts/score-resume.mjs` 新增 `MAX_LINES` 常量与对应检查：

- `lineCount > 80` → `errors.push(...)`，脚本 exit ≠ 0
- `lineCount > 0.9 * 80`（即 ≥ 73）→ `warnings.push(...)`，提示接近上限

由现有 `afterFileEdit` hook 自动触发；超限信息通过 IDE stderr 反馈给 Agent，Agent 在下一回合裁剪重写。

### 3. 「禁止水字数」作为行为规范沉淀

文档 / 规则层显式列出常见凑字数模式（通用形容词堆砌、同义复述、工具版本罗列、Work 复述 Project STAR、`[待补充]` 占位泛滥、过度 markdown 装饰），让 Agent 与人类 reviewer 有共同判断基线。

### 4. 三处单一事实源同步更新

| 文件 | 角色 |
|------|------|
| [docs/rewrite-step-spec.md](../rewrite-step-spec.md) | canonical 详规：新增「篇幅控制（强制）」章节 + DoD 勾选项 |
| [.cursor/rules/resume-editing.mdc](../../.cursor/rules/resume-editing.mdc) | 行为规则层：禁令清单新增「简历总行数 > 80 行」 |
| [.cursor/skills/resume-agent/SKILL.md](../../.cursor/skills/resume-agent/SKILL.md) | 流程速查：Step 3 改写约束 + DoD 同步 |

## 取舍

### 为什么是 80 行

- 现有 fixture（27 / 33 行）有充足 buffer
- 业界主流单页简历 ASCII 行数约 40–60，80 行覆盖**双页极限**
- 80 是 hook 通知后 Agent 容易理解的整数阈值
- 后续若数据表明过紧/过松，调整 `MAX_LINES` 常量即可，无需改 schema

### 为什么用「总行数（含空行）」而非「非空行 / 字数」

- 简单可解释，Agent 易于自检
- 不会鼓励 Agent 删空行换取段落更密集（密集反而损害阅读）
- 字数统计在中文与英文混排时阈值难定

### 为什么是 error 而非 warning

- `afterFileEdit` hook 通知不阻断写盘，但 stderr 中的 FAIL 会让 Agent 在下一回合自然修正
- 与现有「missing section / HTML 注释 / 未替换占位符」同级，保持卫生检查一致性

### 「水字数」为何只在文档层规范、不在脚本中强制

- 「通用形容词」「同义复述」属语义判断，启发式正则误报率高
- Step 2 / Step 4 面试官的「信息密度 / 简历呈现质量」维度已覆盖该信号
- 保留人类与面试官 Agent 的语义裁判空间，避免过度工程

## 后果

### 正面

- Step 3 输出长度收敛，dashboard 跨 case 可比性提升
- Agent 在「补 gap」与「保持精简」之间被迫做显式取舍，倒逼降级或删除无证据条目
- 与 ADR-008 关键词保留率配合，形成「**长度 ↓ × 密度 ↑ × 关键词保留 ↑**」三维约束

### 负面 / 取舍

- 极复杂经历的高 senior 候选人可能受限于 80 行 → 后续若出现真实超限合理 case，可在 ADR-011 引入分级阈值（如 senior=100）
- `MAX_LINES` 是单一常量，未来若需按角色 / case 区分，须重构为配置

### 不在范围

- 未引入字数 / 字符数限制
- 未对水字数做正则启发式检测
- 未对 `intake/projects.md` / Plan 篇幅做限制（这些是材料，非简历）

## 实现清单

| 文件 | 变更 |
|------|------|
| [scripts/score-resume.mjs](../../scripts/score-resume.mjs) | 新增 `MAX_LINES = 80` 常量 + 行数检查 + 9 折预警 |
| [docs/rewrite-step-spec.md](../rewrite-step-spec.md) | 新增「篇幅控制（强制）」章节、DoD 勾选项 |
| [.cursor/rules/resume-editing.mdc](../../.cursor/rules/resume-editing.mdc) | 新增「篇幅控制（强制）」段落、禁令补 1 条 |
| [.cursor/skills/resume-agent/SKILL.md](../../.cursor/skills/resume-agent/SKILL.md) | Step 3 改写约束补 2 条、DoD 更新 |

## 验证

- `node scripts/score-resume.mjs` 对 85 行合成文件 FAIL，对 27 / 33 行 fixture 不引入新失败
- `node scripts/check-doc-refs.mjs` exit 0
