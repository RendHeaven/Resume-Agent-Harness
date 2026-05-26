# 面板评测报告 — {{name}} — 面试官 {{id}} — Round {{round}}

## 任务信息

| 字段 | 值 |
|------|-----|
| 阶段 | Step 4 Eval Panel |
| 面试官 ID | {{a / b / c}} |
| 透镜 | {{tech / gatekeeper / manager}} |
| 轮次 | r{{round}} |
| 评测简历 | `resumes/output/{{name}}.md` |
| Baseline | `reviews/YYYY-MM-DD-{{name}}.json` |
| Runtime 提示词 | `prompts/runtime/YYYY-MM-DD-{{name}}.interviewer.system.md` |

---

## 与 Baseline 对比

| 指标 | Baseline（input） | 本轮（output） | Delta |
|------|-------------------|----------------|-------|
| total | | | |
| hard_requirements | | | |
| core_skills | | | |
| project_relevance | | | |
| seniority_fit | | | |
| presentation | | | |
| overall_recommendation | | | |

---

## 评测思维链

### JD 核心标准（3–5 条）

1.

### 证据查找

| JD 要求 | 简历证据 | 结论 |
|---------|----------|------|

### 打分理由链

---

## 分项评分

| 维度 | 满分 | 得分 | 理由 |
|------|------|------|------|
| 硬性条件匹配 | 15 | | |
| 核心技能匹配 | 25 | | |
| 项目经历相关性 | 25 | | |
| 经验深度与职级 fit | 15 | | |
| 简历呈现质量 | 10 | | |
| 综合推荐度 | 10 | | |
| **总分** | **100** | | |

**recommendation**: `strong_yes` / `yes` / `maybe` / `no`  
**passed**: 是 / 否

---

## 透镜专项意见

<!-- A: 技术深度 / B: JD 门槛核验 / C: 用人经理综合 -->

---

## top_gaps

| 优先级 | 差距 |
|--------|------|

---

## rewrite_priorities（供循环 Rewrite 使用）

1.
2.

---

## 自检

- [ ] 四层系统提示词已加载
- [ ] 评测对象为 output（非 input）
- [ ] 已对比 baseline
- [ ] 独立评测，未参考其他 panelist
