#!/usr/bin/env node
// 简历结构与卫生检查（resumes/working/*.md, resumes/output/*.md）
// 检查项：
//   - 5 章节顺序：自我评价/Summary → 专业技能/Skills → 工作经历/Work → 项目经历/Project → 教育经历/Education
//   - 自我评价至少 3 条 bullet
//   - 总行数 ≤ MAX_LINES（含空行）—— 强制篇幅控制，禁止水字数
//   - 无 HTML 注释 <!-- ... -->
//   - 无 meta 引导语（"留下悬念"、"诱导面试官"等）
//   - 无未替换占位符 {{...}}
//   - [待补充: ...] 计数提示（不阻断）
//
// Usage: node scripts/score-resume.mjs <md-path>
// Exit 0 = 通过；非零 = 不合规

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const MAX_LINES = 80;

const SECTIONS = [
  { id: "summary", patterns: [/自我评价/, /\bSummary\b/i] },
  { id: "skills", patterns: [/专业技能/, /Technical Skills/i, /\bSkills\b/i] },
  { id: "work", patterns: [/工作经历/, /Work Experience/i] },
  { id: "project", patterns: [/项目经历/, /Project Experience/i, /\bProjects\b/i] },
  { id: "education", patterns: [/教育经历/, /Education/i] },
];

const META_PHRASES = [
  /留下悬念/,
  /诱导面试官/,
  /\bmeta\s*说明/i,
  /<!--\s*Agent/i,
];

function findSectionLine(lines, patterns) {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/^#{1,6}\s/.test(line)) continue;
    if (patterns.some((p) => p.test(line))) return i;
  }
  return -1;
}

function check(path) {
  const errors = [];
  const warnings = [];
  if (!existsSync(path)) return { errors: [`file not found: ${path}`], warnings };
  const text = readFileSync(resolve(path), "utf8");
  const lines = text.split(/\r?\n/);

  // 强制行数上限（含空行）。超出视为水字数 / 信息密度不足，须裁剪
  const lineCount = lines[lines.length - 1] === "" ? lines.length - 1 : lines.length;
  if (lineCount > MAX_LINES) {
    errors.push(`line count ${lineCount} exceeds MAX_LINES=${MAX_LINES} (禁止水字数：裁剪冗余形容词、同义复述、无关工具罗列)`);
  } else if (lineCount > MAX_LINES * 0.9) {
    warnings.push(`line count ${lineCount} approaching limit (${MAX_LINES}); 考虑裁剪`);
  }

  // section order
  const positions = SECTIONS.map((s) => ({ id: s.id, idx: findSectionLine(lines, s.patterns) }));
  for (const p of positions) {
    if (p.idx < 0) errors.push(`missing section: ${p.id}`);
  }
  for (let i = 1; i < positions.length; i++) {
    const prev = positions[i - 1];
    const cur = positions[i];
    if (prev.idx >= 0 && cur.idx >= 0 && prev.idx > cur.idx) {
      errors.push(`section order: '${prev.id}' (line ${prev.idx + 1}) appears after '${cur.id}' (line ${cur.idx + 1})`);
    }
  }

  // summary bullets >= 3
  const summaryIdx = positions[0].idx;
  const skillsIdx = positions[1].idx;
  if (summaryIdx >= 0 && skillsIdx > summaryIdx) {
    let bullets = 0;
    for (let i = summaryIdx + 1; i < skillsIdx; i++) {
      if (/^\s*[-*+]\s+/.test(lines[i])) bullets++;
    }
    if (bullets < 3) errors.push(`summary section requires >= 3 bullets, found ${bullets}`);
  }

  // HTML comments
  if (/<!--[\s\S]*?-->/.test(text)) errors.push("HTML comment <!-- --> found; output must be clean");

  // unreplaced placeholders {{...}}
  const placeholders = text.match(/\{\{[^}]+\}\}/g);
  if (placeholders) errors.push(`unreplaced placeholder(s): ${[...new Set(placeholders)].slice(0, 5).join(", ")}`);

  // meta phrases
  for (const re of META_PHRASES) {
    if (re.test(text)) errors.push(`meta phrase detected: ${re}`);
  }

  // [待补充] count (warning only)
  const todoCount = (text.match(/\[待补充[^\]]*\]/g) || []).length;
  if (todoCount > 0) warnings.push(`${todoCount} '[待补充]' marker(s) remain (allowed but should minimize before output)`);

  return { errors, warnings };
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("usage: node scripts/score-resume.mjs <md-path> [<md-path> ...]");
  process.exit(2);
}

let failed = 0;
for (const p of args) {
  const r = check(p);
  if (r.errors.length === 0) {
    console.log(`OK    ${p}`);
  } else {
    failed++;
    console.error(`FAIL  ${p}`);
    for (const e of r.errors) console.error(`      - ${e}`);
  }
  for (const w of r.warnings) console.warn(`WARN  ${p}: ${w}`);
}
process.exit(failed === 0 ? 0 : 1);
