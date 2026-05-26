# Step 3: Rewrite — 简历重写规格

## 目标

基于 Plan、Interview 评测报告与 **「信息留白与悬念设计」简历模板**，将 `resumes/input/` 原文重组为**环环相扣**的高信息密度 Markdown 简历。

先写入 `resumes/working/`，用户确认后再写入 `resumes/output/`。

## 前置条件

- Step 1 Plan 已完成（非 `待确认`）
- Step 2 Interview 已完成（`reviews/YYYY-MM-DD-<name>.md` + `.json` 存在）
- 模板已读：`docs/templates/resume-suspense-template.md`

## 必读输入

| 材料 | 路径 | 用途 |
|------|------|------|
| 原始简历 | `resumes/input/<name>.md` | 事实唯一来源 |
| Plan | `plans/YYYY-MM-DD-<name>.md` | 意向、项目详情、匹配矩阵、Rewrite 优先级 |
| Interview 报告 | `reviews/YYYY-MM-DD-<name>.md` | top_gaps、rewrite_priorities |
| Interview 分数 | `reviews/YYYY-MM-DD-<name>.json` | 低分维度指导着墨 |
| 项目补充 | `intake/<name>/projects.md` | 可选，补充 input 未写细节 |
| 简历模板 | `docs/templates/resume-suspense-template.md` | 结构与风格约束 |

## 执行流程

```text
① 读取 input + Plan + Interview + 模板
    ↓
② 改写思维链（在聊天展示 + 可选写入 working 顶部 HTML 注释块，定稿前删除）
    ↓
③ 映射：Summary 标签 ↔ Skills 维度 ↔ Work 上下文 ↔ Projects STAR
    ↓
④ 按模板写入 resumes/working/<name>.md
    ↓
⑤ 环环相扣自检
    ↓
⑥ 向用户展示改动摘要 → 等待确认 → 写入 resumes/output/<name>.md
```

## 核心设计理念（必须遵守）

### 渐进式披露顺序

```text
自我评价（论点 + 最强战绩）
    ↓ 支撑
专业技能（武器库 / 论据大纲）
    ↓ 背书
工作经历（宏观上下文，细节折叠）
    ↓ 论证
项目经历（STAR：强痛点 + 留白过程 + 数字暴击）
    ↓
教育经历
```

### 环环相扣映射表（改写前须完成）

Agent 在落笔前须填写（聊天或草稿笔记）：

| Summary 标签 | 对应 Skills 维度 | 对应 Work 公司 | 对应 Project | Interview 要弥补的 gap |
|--------------|------------------|----------------|--------------|------------------------|
| 标签 1 | 维度 1 | 公司 X | 项目一 | |
| 标签 2 | 维度 2 | 公司 Y | 项目二 | |
| 标签 3 | 维度 3 | | | |

**任一标签无 Project 实证 → 降级为 Skills 提及或删除，不得硬写。**

### 悬念设计（内容层，非 meta 层）

- **重结果**：Output 必须有量化或 `[待补充: 具体指标]`
- **留悬念**：Process 写机制名称与架构决策，**折叠**实现细节，用专业术语作钩子
- **引对话**：每条 Summary / 每个 Project 至少 1 个可追问点，**不得**写「留下悬念：…」字样

## 改写优先级

按顺序吸收：

1. Interview `rewrite_priorities`（P0 优先）
2. Interview `top_gaps`（JD 核验 fail / partial 项）
3. Plan「Rewrite 优先突出」项目
4. Plan 匹配矩阵中「强 / 中」且 resume 有证据的经历
5. Interview JSON 中低分维度（如 `core_skills` 低 → 加强 Skills + 对应 Project）

## 事实边界

- **只能**重组、润色、突出 input / projects 已有信息
- **禁止**捏造公司、职位、年限、项目、成果、技能
- 缺失量化 → `[待补充: 具体描述]`
- 不得为填模板而发明「自研 XX 机制」——须 input 或 projects 有依据

## 输出

| 产物 | 路径 |
|------|------|
| 中间稿 | `resumes/working/<name>.md` |
| 定稿 | `resumes/output/<name>.md`（用户确认后） |

## 环环相扣自检（DoD 之一）

- [ ] 五章节齐全且顺序正确
- [ ] Summary 3 条标签均在 Skills 有对应维度
- [ ] Summary 每条标签至少有 1 个 Project 的 STAR 论证（或已 consciously 降级）
- [ ] Work 每段职责 ≤ 2 行，无 STAR 细节泄漏
- [ ] Projects 采用 Input / Process / Output 结构
- [ ] Process 无琐碎代码细节，有术语钩子
- [ ] 无 HTML 注释、无 meta 引导语、无捏造事实
- [ ] Interview rewrite_priorities 已逐条响应（或说明未响应原因）
- [ ] 未修改 `resumes/input/`、`intake/`、`prompts/system/`

## 用户确认

向用户展示：

1. **改动摘要**（结构调整 / 新增亮点 / 待补充项）
2. **映射表**（Summary ↔ Skills ↔ Projects 是否闭环）
3. **未解决的 `[待补充]` 清单**

用户确认前 **禁止** 写入 `resumes/output/`。

## 触发示例

```
按 resume-agent skill 执行 Step 3 Rewrite：
- name: sample
- plan: plans/2026-05-26-sample.md
- interview: reviews/2026-05-26-sample.json
- 简历: resumes/input/sample-resume.md
```

## 与 Step 4 的关系

Rewrite 定稿 → Step 4 三面试官面板评测；不及格则携带 `merged_rewrite_priorities` 回到本步骤（最多 3 轮）。

**禁止**跳过 Interview 直接 Rewrite。
