#!/usr/bin/env node
// 跨 case 汇总：扫 evals/runs/*.json + gaps/*.json，生成 evals/dashboard.md
//
// 字段含义见 docs/observability.md
//
// Usage: node scripts/aggregate-evals.mjs
// 退出码 0：写盘完成（即使空仓库也成功，产出空 dashboard）

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

const RUNS_DIR = resolve("evals/runs");
const GAPS_DIR = resolve("gaps");
const OUT_PATH = resolve("evals/dashboard.md");

function readJsons(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const path = join(dir, f);
      try {
        const data = JSON.parse(readFileSync(path, "utf8"));
        return { path, data };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function variance(arr) {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
}

function main() {
  const runs = readJsons(RUNS_DIR);
  const gaps = readJsons(GAPS_DIR);

  const byCase = new Map();
  for (const { data } of runs) {
    if (!data || data.step !== "eval_panel_aggregate") continue;
    const list = byCase.get(data.case) || [];
    list.push(data);
    byCase.set(data.case, list);
  }

  // case-level rows
  const rows = [];
  for (const [caseName, list] of byCase) {
    list.sort((a, b) => (a.round || 0) - (b.round || 0));
    const last = list[list.length - 1];
    const passedRound = list.find((r) => r.panel_passed)?.round ?? null;
    const totals = [last.panel_totals?.a, last.panel_totals?.b, last.panel_totals?.c]
      .filter((v) => typeof v === "number");
    const v = totals.length === 3 ? variance(totals) : 0;
    rows.push({
      case: caseName,
      rounds: list.length,
      passed_at_round: passedRound,
      last_round: last.round,
      last_avg: last.panel_totals?.average ?? null,
      last_min: last.panel_totals?.min ?? null,
      last_variance: Number(v.toFixed(2)),
      flags: last.flags || [],
      panel_passed: !!last.panel_passed,
    });
  }

  // global stats
  const totalCases = byCase.size;
  const passedCases = rows.filter((r) => r.panel_passed).length;
  const passRate = totalCases === 0 ? 0 : Number((passedCases / totalCases).toFixed(3));
  const avgRoundsToPass = (() => {
    const arr = rows.filter((r) => r.passed_at_round != null).map((r) => r.passed_at_round);
    if (arr.length === 0) return null;
    return Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2));
  })();
  const highVarCount = rows.filter((r) => r.last_variance > 100).length; // sample variance, ~stdev > 10

  // gap categories
  const gapCounts = new Map();
  for (const { data } of gaps) {
    if (!data || data.step !== "gap_analysis") continue;
    for (const g of data.skill_gaps || []) {
      const key = `${g.category}/${g.type}`;
      gapCounts.set(key, (gapCounts.get(key) || 0) + 1);
    }
  }
  const topGaps = [...gapCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  // dimension averages from latest round per case
  const dimAgg = { hard_requirements: [], core_skills: [], project_relevance: [], seniority_fit: [], presentation: [], overall_recommendation: [] };
  // Note: dimension scores live in panel JSONs not the aggregate; keep dashboard light here.

  // render
  const now = new Date().toISOString();
  const lines = [];
  lines.push("# evals/dashboard.md");
  lines.push("");
  lines.push(`> 自动生成于 ${now}（来源：\`evals/runs/*.json\` + \`gaps/*.json\`）。字段说明见 [../docs/observability.md](../docs/observability.md)。`);
  lines.push("");
  lines.push("## 全局统计");
  lines.push("");
  lines.push(`- cases_total: **${totalCases}**`);
  lines.push(`- panel_passed_cases: **${passedCases}**`);
  lines.push(`- pass_rate: **${(passRate * 100).toFixed(1)}%**`);
  lines.push(`- avg_rounds_to_pass: **${avgRoundsToPass ?? "-"}**`);
  lines.push(`- high_variance_cases: **${highVarCount}** (sample variance > 100)`);
  lines.push("");
  lines.push("## Case 列表");
  lines.push("");
  if (rows.length === 0) {
    lines.push("> 暂无评测记录。运行 Step 4 后将自动汇总。");
  } else {
    lines.push("| case | rounds | passed_at | last_round | avg | min | variance | flags |");
    lines.push("|------|--------|-----------|-----------|-----|-----|----------|-------|");
    for (const r of rows) {
      lines.push(`| ${r.case} | ${r.rounds} | ${r.passed_at_round ?? "-"} | ${r.last_round} | ${r.last_avg ?? "-"} | ${r.last_min ?? "-"} | ${r.last_variance} | ${(r.flags || []).join(", ") || "-"} |`);
    }
  }
  lines.push("");
  lines.push("## Top Skill Gaps（来自 Step 5）");
  lines.push("");
  if (topGaps.length === 0) {
    lines.push("> 暂无 gap 报告。");
  } else {
    lines.push("| category/type | count |");
    lines.push("|---------------|-------|");
    for (const [key, n] of topGaps) lines.push(`| ${key} | ${n} |`);
  }
  lines.push("");
  lines.push("## 字段说明");
  lines.push("");
  lines.push("- `passed_at`：首次 panel_passed 为 true 的 round（null 表未通过）");
  lines.push("- `variance`：本 case 最新轮次三 panelist total 的样本方差（>100 大致 stdev>10，触发 high_variance flag）");
  lines.push("- `flags`：来自 eval-run.json 的标记，可能值见 schemas/eval-run.schema.json");

  if (!existsSync(resolve("evals"))) mkdirSync(resolve("evals"), { recursive: true });
  writeFileSync(OUT_PATH, lines.join("\n") + "\n", "utf8");
  console.log(`wrote ${OUT_PATH}`);
}

main();
