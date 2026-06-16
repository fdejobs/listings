import { jobsSchema } from "../src/lib/schema";
import { readJson, writeJson } from "./io";

const apply = process.argv.includes("--apply");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : Infinity;
const jobsPath = "src/content/data/jobs.json";
const jobs = jobsSchema.parse(await readJson(jobsPath, []));
const liveJobs = jobs.filter((job) => job.status === "live").slice(0, Number.isFinite(limit) ? limit : undefined);
const brokenStatuses = new Set([404, 410, 451]);
const networkBrokenCodes = new Set(["ENOTFOUND", "ERR_INVALID_URL", "ECONNREFUSED"]);
const expiredAt = new Date().toISOString();

const concurrency = 8;
let index = 0;

type AuditResult = {
  slug: string;
  company_slug: string;
  title: string;
  apply_url: string;
  state: "ok" | "broken" | "unknown";
  status: number | null;
  final_url: string | null;
  note: string;
};

async function checkUrl(job: typeof liveJobs[number]): Promise<AuditResult> {
  try {
    const response = await fetch(job.apply_url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      signal: AbortSignal.timeout(15000)
    });

    try {
      await response.body?.cancel();
    } catch {}

    if (brokenStatuses.has(response.status)) {
      return {
        slug: job.slug,
        company_slug: job.company_slug,
        title: job.title,
        apply_url: job.apply_url,
        state: "broken",
        status: response.status,
        final_url: response.url || null,
        note: `HTTP ${response.status}`
      };
    }

    if (response.ok || (response.status >= 300 && response.status < 400)) {
      return {
        slug: job.slug,
        company_slug: job.company_slug,
        title: job.title,
        apply_url: job.apply_url,
        state: "ok",
        status: response.status,
        final_url: response.url || null,
        note: `HTTP ${response.status}`
      };
    }

    return {
      slug: job.slug,
      company_slug: job.company_slug,
      title: job.title,
      apply_url: job.apply_url,
      state: "unknown",
      status: response.status,
      final_url: response.url || null,
      note: `HTTP ${response.status}`
    };
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code?: string }).code) : null;
    const note = error instanceof Error ? error.message : String(error);

    return {
      slug: job.slug,
      company_slug: job.company_slug,
      title: job.title,
      apply_url: job.apply_url,
      state: code && networkBrokenCodes.has(code) ? "broken" : "unknown",
      status: null,
      final_url: null,
      note
    };
  }
}

async function worker(results: AuditResult[]) {
  while (index < liveJobs.length) {
    const current = liveJobs[index++];
    results.push(await checkUrl(current));
  }
}

const results: AuditResult[] = [];
await Promise.all(Array.from({ length: Math.min(concurrency, liveJobs.length) }, () => worker(results)));
results.sort((a, b) => a.slug.localeCompare(b.slug));

const broken = results.filter((result) => result.state === "broken");
const unknown = results.filter((result) => result.state === "unknown");

if (apply && broken.length > 0) {
  const brokenBySlug = new Map(broken.map((result) => [result.slug, result]));
  const nextJobs = jobs.map((job) => {
    if (job.status !== "live") {
      return job;
    }

    const brokenJob = brokenBySlug.get(job.slug);
    if (!brokenJob) {
      return job;
    }

    const reason = `Apply URL audit marked this listing broken (${brokenJob.note}).`;
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

  await writeJson(jobsPath, nextJobs);
}

console.log(JSON.stringify({
  mode: apply ? "apply" : "audit",
  scanned: liveJobs.length,
  ok: results.filter((result) => result.state === "ok").length,
  broken: broken.length,
  unknown: unknown.length,
  brokenJobs: broken,
  unknownJobs: unknown.slice(0, 50)
}, null, 2));
