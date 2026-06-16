import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { Resvg } from "@resvg/resvg-js";
import type { Company, Job } from "../src/lib/types";
import { formatComp } from "../src/lib/format";
import { getStrictFdeExclusionReason } from "../src/lib/strictBoard";
import { readJson } from "./io";

type HistorySnapshot = {
  date: string;
  live_role_count: number;
  source: string;
  notes?: string | null;
};

const targetSlugs = [
  "databricks-head-of-ai-forward-deployed-engineering-fde-public-sector-maryland-2026-06",
  "openai-ai-deployment-engineer-san-francisco-2026-06",
  "cognition-deployed-engineer-europe-london-2025-09",
  "sierra-forward-deployed-infrastructure-engineer-san-francisco-2026-04",
  "cursor-forward-deployed-engineer-emea-london-2026-06"
];

const stageLabels: Record<string, string> = {
  seed: "Seed",
  series_a: "Series A",
  series_b: "Series B",
  series_c: "Series C",
  series_d_plus: "Series D+",
  public: "Public",
  bootstrapped: "Bootstrapped",
  gov_defense: "Gov/Defense"
};

const baselineCommit = process.env.FDE_BASELINE_COMMIT ?? "7a802a9";
const baselineDate = new Date("2026-05-30T23:59:59.999Z");

const jobs = await readJson<Job[]>("src/content/data/jobs.json", []);
const companies = await readJson<Company[]>("src/content/data/companies.json", []);
const history = await readJson<HistorySnapshot[]>("src/content/data/history.json", []);
const baselineJobs = JSON.parse(execFileSync("git", ["show", `${baselineCommit}:src/content/data/jobs.json`], {
  encoding: "utf8",
  maxBuffer: 50 * 1024 * 1024
})) as Job[];

const companyBySlug = Object.fromEntries(companies.map((company) => [company.slug, company]));
const liveJobs = jobs.filter((job) => job.status === "live" && !getStrictFdeExclusionReason(job.title));
const baselineLiveJobs = baselineJobs.filter((job) => job.status === "live" && !getStrictFdeExclusionReason(job.title));
const latestSnapshot = history.at(-1);

if (!latestSnapshot) {
  throw new Error("Missing history snapshot for LinkedIn cards.");
}

const latestSnapshotDate = latestSnapshot.date;

function jobKey(job: Job) {
  return job.source_url ?? job.slug;
}

function adjustedBaseline() {
  const keys = new Set(baselineLiveJobs.map(jobKey));
  const adjusted = [...baselineLiveJobs];

  for (const slug of ["cognition", "sierra"]) {
    for (const job of liveJobs.filter((item) => item.company_slug === slug && new Date(item.posted_at) <= baselineDate)) {
      const key = jobKey(job);
      if (!keys.has(key)) {
        adjusted.push(job);
        keys.add(key);
      }
    }
  }

  return adjusted;
}

const baseline = adjustedBaseline();

function countByCompany(rows: Job[], slug: string) {
  return rows.filter((job) => job.company_slug === slug).length;
}

function stageLabel(company: Company) {
  return stageLabels[company.stage] ?? company.stage;
}

function esc(value: string | number) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function wrap(value: string, maxChars: number, maxLines: number) {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) {
    lines.push(line);
  }

  if (lines.length > maxLines) {
    const clipped = lines.slice(0, maxLines);
    clipped[maxLines - 1] = `${clipped[maxLines - 1].replace(/\s+\S*$/, "")}...`;
    return clipped;
  }

  return lines;
}

function postedLabel(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function snapshotLabel(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function locationLabel(job: Job) {
  return job.locations.join(" / ").replace("Washington / D.C.", "Washington DC");
}

function bars(job: Job, company: Company) {
  const companyBase = countByCompany(baseline, company.slug);
  const companyLatest = countByCompany(liveJobs, company.slug);
  const stage = stageLabel(company);
  const stageBase = baseline.filter((item) => stageLabel(companyBySlug[item.company_slug]) === stage).length;
  const stageLatest = liveJobs.filter((item) => stageLabel(companyBySlug[item.company_slug]) === stage).length;
  const loc = job.locations[0] ?? "Location";
  const locBase = baseline.filter((item) => item.locations.includes(loc)).length;
  const locLatest = liveJobs.filter((item) => item.locations.includes(loc)).length;

  return [
    { label: company.name, value: companyLatest, change: companyLatest - companyBase },
    { label: loc, value: locLatest, change: locLatest - locBase },
    { label: stage, value: stageLatest, change: stageLatest - stageBase }
  ];
}

function svgFor(job: Job, company: Company) {
  const companyBase = countByCompany(baseline, company.slug);
  const companyLatest = countByCompany(liveJobs, company.slug);
  const companyChange = companyLatest - companyBase;
  const rows = bars(job, company);
  const max = Math.max(...rows.map((row) => row.value), 1);
  const titleLines = wrap(job.title, 26, 3);
  const location = locationLabel(job);
  const roleMeta = `${location} / ${formatComp(job)} / posted ${postedLabel(job.posted_at)}`;
  const latestLabel = snapshotLabel(latestSnapshotDate);

  const titleText = titleLines.map((line, index) => (
    `<text x="72" y="${334 + index * 64}" fill="#F5F5F2" font-family="Arial, sans-serif" font-size="54" font-weight="700">${esc(line)}</text>`
  )).join("");
  const rowText = rows.map((row, index) => {
    const y = 690 + index * 92;
    const width = Math.max(24, Math.round((row.value / max) * 620));
    const change = `${row.change >= 0 ? "+" : ""}${row.change}`;
    return `
      <text x="72" y="${y}" fill="#A8A8A4" font-family="monospace" font-size="25">${esc(row.label)}</text>
      <rect x="72" y="${y + 20}" width="700" height="24" fill="#232323"/>
      <rect x="72" y="${y + 20}" width="${width}" height="24" fill="#F5F5F2"/>
      <text x="820" y="${y + 42}" fill="#F5F5F2" font-family="monospace" font-size="28">${row.value}</text>
      <text x="1010" y="${y + 42}" fill="#F5F5F2" font-family="monospace" font-size="28">${change}</text>
    `;
  }).join("");

  return `
  <svg width="1200" height="1200" viewBox="0 0 1200 1200" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="1200" fill="#0A0A0A"/>
    <line x1="72" y1="86" x2="1128" y2="86" stroke="#2B2B2A"/>
    <text x="72" y="62" fill="#8D8D8A" font-family="monospace" font-size="25" letter-spacing="4">FDE COLLECTIVE / GROWTH TRACKER</text>
    <text x="72" y="172" fill="#F5F5F2" font-family="monospace" font-size="96" font-weight="500">${companyLatest}</text>
    <text x="330" y="142" fill="#F5F5F2" font-family="Arial, sans-serif" font-size="48" font-weight="700">${esc(company.name)}</text>
    <text x="332" y="188" fill="#A8A8A4" font-family="monospace" font-size="25">${companyChange >= 0 ? "+" : ""}${companyChange} since 30 May / from ${companyBase}</text>
    <line x1="72" y1="238" x2="1128" y2="238" stroke="#2B2B2A"/>
    <text x="72" y="276" fill="#8D8D8A" font-family="monospace" font-size="24">ROLE TO POST</text>
    ${titleText}
    <text x="72" y="560" fill="#A8A8A4" font-family="monospace" font-size="24">${esc(roleMeta)}</text>
    <line x1="72" y1="606" x2="1128" y2="606" stroke="#2B2B2A"/>
    <text x="72" y="642" fill="#8D8D8A" font-family="monospace" font-size="24">LIVE ROLES / CHANGE</text>
    ${rowText}
    <line x1="72" y1="1042" x2="1128" y2="1042" stroke="#2B2B2A"/>
    <text x="72" y="1094" fill="#F5F5F2" font-family="monospace" font-size="30">fdecollective.github.io</text>
    <text x="1128" y="1094" fill="#8D8D8A" font-family="monospace" font-size="22" text-anchor="end">Snapshot ${latestLabel}</text>
  </svg>`;
}

await mkdir("public/linkedin", { recursive: true });

for (const slug of targetSlugs) {
  const job = liveJobs.find((item) => item.slug === slug);
  if (!job) {
    throw new Error(`Missing live job for LinkedIn card: ${slug}`);
  }
  const company = companyBySlug[job.company_slug];
  if (!company) {
    throw new Error(`Missing company for LinkedIn card: ${slug}`);
  }

  const svg = svgFor(job, company);
  const hash = createHash("sha256").update(svg).digest("hex").slice(0, 16);
  const out = `public/linkedin/${slug}.png`;
  const hashOut = `public/linkedin/${slug}.hash`;
  const currentHash = await readFile(hashOut, "utf8").catch(() => "");
  if (currentHash.trim() === hash) {
    continue;
  }

  const png = new Resvg(svg).render().asPng();
  await writeFile(out, png);
  await writeFile(hashOut, `${hash}
`);
  console.log(out);
}
