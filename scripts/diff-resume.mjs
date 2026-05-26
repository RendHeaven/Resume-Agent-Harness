#!/usr/bin/env node
// 简历 input ↔ output 章节级 diff + JD 关键词保留率
//
// Usage:
//   node scripts/diff-resume.mjs <input.md> <output.md> [<jd.md>]
//
// 输出（stdout，机器可解析 JSON）：
//   {
//     "input_sections": {...},
//     "output_sections": {...},
//     "section_delta": [...],
//     "keyword_retention_rate": 0.85,
//     "keywords_total": 20,
//     "keywords_kept": 17,
//     "keywords_missing": ["k8s", "..."]
//   }
//
// 退出码 0 总是返回（diff 是只读分析，不阻断）。Lens B 否决条件由调用方判断。

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const SECTION_RES = [
  { id: "summary", re: /(自我评价|Summary)/i },
  { id: "skills", re: /(专业技能|Technical Skills|Skills)/i },
  { id: "work", re: /(工作经历|Work Experience)/i },
  { id: "project", re: /(项目经历|Project Experience|Projects)/i },
  { id: "education", re: /(教育经历|Education)/i },
];

function parseSections(md) {
  const lines = md.split(/\r?\n/);
  const res = {};
  let cur = null;
  let buf = [];
  for (const line of lines) {
    if (/^#{1,6}\s/.test(line)) {
      const next = SECTION_RES.find((s) => s.re.test(line));
      if (next) {
        if (cur) res[cur] = buf.join("\n");
        cur = next.id;
        buf = [];
        continue;
      }
    }
    if (cur) buf.push(line);
  }
  if (cur) res[cur] = buf.join("\n");
  return res;
}

function extractJDKeywords(jdText) {
  // 启发式：提取技术栈/工具/方法论关键词
  // 1) 全大写或驼峰技术名（K8s、Kafka、gRPC）
  // 2) 中文技能短语（高并发、分布式、消息队列）—— 取「、，；」分隔的 2-6 字短语
  // 3) 显式列举：以「-」「·」「，」分隔的项
  const set = new Set();

  // tech-style tokens
  const techRe = /\b([A-Z][a-zA-Z0-9.+#-]{1,}|[a-z]+[A-Z][a-zA-Z0-9]+)\b/g;
  let m;
  while ((m = techRe.exec(jdText)) !== null) {
    const tok = m[1];
    if (tok.length >= 2 && !/^(The|And|For|With|This|That|From|Into|Plan|Step|Inc)$/i.test(tok)) {
      set.add(tok);
    }
  }

  // chinese skills phrases — heuristic split
  const cnLines = jdText.split(/\r?\n/).filter((l) => /[\u4e00-\u9fff]/.test(l));
  for (const line of cnLines) {
    const tokens = line.split(/[、，；,;:：()（）\s]+/).filter(Boolean);
    for (const t of tokens) {
      const cn = t.match(/[\u4e00-\u9fff][\u4e00-\u9fff/]{1,5}/g);
      if (!cn) continue;
      for (const c of cn) {
        if (c.length >= 2 && c.length <= 8) set.add(c);
      }
    }
  }

  // strip very generic words
  const STOP = new Set([
    "公司", "岗位", "职责", "要求", "经验", "工作", "团队", "项目",
    "工程师", "开发", "设计", "负责", "参与", "指导", "熟悉", "精通",
    "本科", "及以上", "相关", "专业", "学历", "年限", "良好", "能力",
    "理解", "学习", "意愿", "沟通", "协作", "跨", "技术", "业务",
    "加分", "硬性", "软性", "招聘", "金融", "科技", "建议", "样例",
    "以上", "以下", "或者", "或", "等", "并", "与", "及"
  ]);
  for (const k of [...set]) if (STOP.has(k)) set.delete(k);

  return [...set];
}

function tokensIn(text) {
  return text.toLowerCase();
}

function main() {
  const [inputPath, outputPath, jdPath] = process.argv.slice(2);
  if (!inputPath || !outputPath) {
    console.error("usage: node scripts/diff-resume.mjs <input.md> <output.md> [<jd.md>]");
    process.exit(2);
  }
  for (const p of [inputPath, outputPath]) {
    if (!existsSync(p)) {
      console.error(`not found: ${p}`);
      process.exit(2);
    }
  }
  const input = readFileSync(resolve(inputPath), "utf8");
  const output = readFileSync(resolve(outputPath), "utf8");

  const inputSec = parseSections(input);
  const outputSec = parseSections(output);

  const sectionDelta = SECTION_RES.map((s) => ({
    id: s.id,
    input_chars: (inputSec[s.id] || "").length,
    output_chars: (outputSec[s.id] || "").length,
    delta_chars: (outputSec[s.id] || "").length - (inputSec[s.id] || "").length,
  }));

  const result = {
    input_sections: Object.fromEntries(SECTION_RES.map((s) => [s.id, !!inputSec[s.id]])),
    output_sections: Object.fromEntries(SECTION_RES.map((s) => [s.id, !!outputSec[s.id]])),
    section_delta: sectionDelta,
  };

  if (jdPath && existsSync(jdPath)) {
    const jd = readFileSync(resolve(jdPath), "utf8");
    const keywords = extractJDKeywords(jd);
    const outLower = tokensIn(output);
    const kept = [];
    const missing = [];
    for (const k of keywords) {
      if (outLower.includes(k.toLowerCase())) kept.push(k);
      else missing.push(k);
    }
    result.keywords_total = keywords.length;
    result.keywords_kept = kept.length;
    result.keywords_missing = missing;
    result.keyword_retention_rate = keywords.length === 0 ? 1 : Number((kept.length / keywords.length).toFixed(3));
  }

  console.log(JSON.stringify(result, null, 2));
}

main();
