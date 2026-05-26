# scripts/ — 零依赖 Node ESM 校验脚本

| 脚本 | 作用 | 触发方式 |
|------|------|----------|
| [validate-output.mjs](validate-output.mjs) | 按路径自动选 schema 校验输出 JSON | hooks 自动 + 手动 |
| [redact-pii.mjs](redact-pii.mjs) | PII 扫描（手机/邮箱/身份证）；evals/gaps 强制 | hooks 自动 + 手动 |
| [score-resume.mjs](score-resume.mjs) | 简历结构与 meta 卫生检查 | hooks 自动（working/output）+ 手动 |
| [diff-resume.mjs](diff-resume.mjs) | input ↔ output 章节级 diff + JD 关键词保留率 | 手动 / Lens B 调用 |
| [next-round.mjs](next-round.mjs) | 计算下一安全 `r{N}`，防覆盖 | Step 4 启动前 |
| [aggregate-evals.mjs](aggregate-evals.mjs) | 跨 case 汇总 → `evals/dashboard.md` | 手动 / 定期 |
| [check-doc-refs.mjs](check-doc-refs.mjs) | md 内部相对链接断链检测 | Harness 变更门禁 |

## 设计约束

- **零依赖**：只用 Node 内置模块；不引入 npm 包，仓库 zero-install
- **退出码**：0 = 通过；非零 = 不通过（hooks 用退出码做阻断/告警判定）
- **日志格式**：`OK | WARN | FAIL <path>  <message>`，便于 hook 输出抓取

## 共享工具

[lib/json-schema-mini.mjs](lib/json-schema-mini.mjs) — JSON Schema Draft 2020-12 子集校验器，覆盖本仓 schemas/ 实际用到的关键字。

## 测试

```bash
# 全量自检
node scripts/check-doc-refs.mjs           # md 链接
node scripts/aggregate-evals.mjs          # dashboard（空仓库也成功）
node scripts/validate-output.mjs <path>   # 单文件 schema 校验
```
