import { execFileSync } from "node:child_process";
import { historySchema, jobsSchema } from "../src/lib/schema";
import { isStrictFdeTitle } from "../src/lib/strictBoard";
import { readJson, writeJson } from "./io";

const baselineCommit = "7a802a9";
const baselineSnapshotDate = "2026-05-30T00:00:00.000Z";
const latestSnapshotDate = "2026-06-15T00:00:00.000Z";
const cutoff = Date.parse("2026-05-30T23:59:59.999Z");
const currentJobs = jobsSchema.parse(await readJson("src/content/data/jobs.json", []));
const baselineJobs = jobsSchema.parse(
  JSON.parse(
    execFileSync("git", ["show", `${baselineCommit}:src/content/data/jobs.json`], {
      cwd: process.cwd(),
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024
    })
  )
);

const baselineMap = new Map<string, typeof currentJobs[number]>();
for (const job of baselineJobs) {
  if (job.status === "live" && isStrictFdeTitle(job.title, { companySlug: job.company_slug })) {
    baselineMap.set(job.slug, job);
  }
}

for (const job of currentJobs) {
  if (
    job.status === "live" &&
    isStrictFdeTitle(job.title, { companySlug: job.company_slug }) &&
    (job.company_slug === "cognition" || job.company_slug === "sierra") &&
    Date.parse(job.posted_at) <= cutoff
  ) {
    baselineMap.set(job.slug, job);
  }
}

const baselineCount = baselineMap.size;
const currentLiveCount = currentJobs.filter((job) => job.status === "live" && isStrictFdeTitle(job.title, { companySlug: job.company_slug })).length;
const sampleAdds = Array.from(baselineMap.values()).filter((job) => job.company_slug === "cognition" || job.company_slug === "sierra");
const history = historySchema.parse(await readJson("src/content/data/history.json", []));

let sawBaseline = false;
let sawLatest = false;
const nextHistory = history.map((snapshot) => {
  if (snapshot.date === baselineSnapshotDate) {
    sawBaseline = true;
    return {
      ...snapshot,
      live_role_count: baselineCount,
      notes: "Constant-sample baseline for current live FDE roles under the stricter board definition. Solutions, sales, field engineering, deployment engineer and deployment manager titles are excluded; OpenAI roles must explicitly be forward-deployed; Cognition and Sierra roles already live by 30 May remain included in both periods."
    };
  }

  if (snapshot.date === latestSnapshotDate) {
    sawLatest = true;
    return {
      ...snapshot,
      live_role_count: currentLiveCount,
      notes: "Weekly snapshot of current live FDE roles displayed on the site after applying the stricter board definition, OpenAI forward-deployed-only rule, and URL audit."
    };
  }

  return snapshot;
});

if (!sawBaseline || !sawLatest) {
  throw new Error("Expected baseline and latest history snapshots to exist before reconciliation.");
}

await writeJson("src/content/data/history.json", nextHistory);
console.log(JSON.stringify({
  baselineCommit,
  baselineCount,
  currentLiveCount,
  sampleCompanyAdds: sampleAdds.length,
  sampleCompanyJobs: sampleAdds.map((job) => ({ slug: job.slug, company_slug: job.company_slug, title: job.title }))
}, null, 2));
