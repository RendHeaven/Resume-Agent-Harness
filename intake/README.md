# intake/ — 用户输入区（只读）

本目录存放 Step 1 Plan 的补充输入，**由用户创建并维护**。

## 结构

```text
intake/<name>/
  direction.md      ← 求职方向
  requirements.md   ← 招聘要求（JD，必填）
  projects.md       ← 项目补充
```

## 规则

- Agent **只读**，不得创建、覆盖或删除本目录下任何文件
- 与 `resumes/input/` 享有同级文件保护
- JD 缺失或无效时，禁止进入 Plan 及后续步骤

## 样例

见 `intake/sample/`。
