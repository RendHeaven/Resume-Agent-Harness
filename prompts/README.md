# prompts/ — 系统提示词层

本目录存放 **Step 2 / Step 4 面试官** 与 **Step 5 差距分析** 所需的系统提示词。

## 结构

```text
prompts/
  system/                              # Harness 维护，Agent 只读
    interviewer-base.system.md         # 面试官基础约束
    interviewer-persona.template.md    # Step 2 人设生成模板
    interviewer-eval-mode.system.md    # Step 4 评测 output + baseline 对比
    eval-panel.system.md               # Step 4 三子代理编排
    interviewer-lens-a.system.md       # 子代理 A：技术深度
    interviewer-lens-b.system.md       # 子代理 B：门槛筛选
    interviewer-lens-c.system.md       # 子代理 C：用人经理
    gap-analyst.system.md              # Step 5 JD 差距分析
  runtime/                             # Step 2 生成，Step 4 复用
    YYYY-MM-DD-<name>.interviewer.system.md
```

## Step 2

```text
Base + Runtime → 评测 input → reviews/
```

## Step 4

```text
Base + Eval模式 + Runtime（复用）+ Lens-{a,b,c}
    → 3 子代理并行 → 评测 output → evals/panel/
    → 主 Agent 汇总 → evals/runs/（3/3 全票通过）
```

## Step 5

```text
gap-analyst.system.md + JD + output + Plan + Step 4 panel
    → gaps/YYYY-MM-DD-<name>.md + .json
    → 任务完成
```

## 规则

- `prompts/system/`：**只读**
- `prompts/runtime/`：Step 2 生成；Step 4 **只读复用**，不重新发明人设
