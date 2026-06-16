import { jobsSchema } from "../src/lib/schema";
import { getStrictFdeExclusionReason } from "../src/lib/strictBoard";
import { readJson, writeJson } from "./io";

const dryRun = process.argv.includes("--dry-run");
const jobsPath = "src/content/data/jobs.json";
const jobs = jobsSchema.parse(await readJson(jobsPath, []));
const expiredAt = new Date().toISOString();

const affected: Array<{ slug: string; company_slug: string; title: string }> = [];
const nextJobs = jobs.map((job) => {
  if (job.status !== "live") {
    return job;
  }

  const reason = getStrictFdeExclusionReason(job.title);
  if (!reason) {
    return job;
  }

  affected.push({ slug: job.slug, company_slug: job.company_slug, title: job.title });
  const classifierReasoning = job.classifier_reasoning?.includes(reason)
    ? job.classifier_reasoning
    : [job.classifier_reasoning, reason].filter(Boolean).join(" ");

  return {
    ...job,
    status: "expired",
    expires_at: expiredAt,
    classifier_reasoning: classifierReasoning,
    is_featured: false
  };
});

if (!dryRun) {
  await writeJson(jobsPath, nextJobs);
}

const remainingLive = nextJobs.filter((job) => job.status === "live").length;
console.log(JSON.stringify({
  mode: dryRun ? "dry-run" : "apply",
  pruned: affected.length,
  remainingLive,
  sample: affected.slice(0, 25)
}, null, 2));

if (affected.length > 25) {
  console.log(`... ${affected.length - 25} more pruned jobs`);
}
