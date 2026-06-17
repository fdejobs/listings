import { companiesSchema, historySchema, jobsSchema, marketHistorySchema, marketStatsSchema, tickerSchema, trackerSourcesSchema } from "../src/lib/schema";
import { getStrictFdeExclusionReason } from "../src/lib/strictBoard";
import { readJson } from "./io";

const companies = companiesSchema.parse(await readJson("src/content/data/companies.json", []));
const jobs = jobsSchema.parse(await readJson("src/content/data/jobs.json", []));
const ticker = tickerSchema.parse(await readJson("src/content/data/ticker.json", []));
marketStatsSchema.parse(await readJson("src/content/data/market.json", {}));
const marketHistory = marketHistorySchema.parse(await readJson("src/content/data/market-history.json", []));
const history = historySchema.parse(await readJson("src/content/data/history.json", []));
const trackerSources = trackerSourcesSchema.parse(await readJson("src/content/data/tracked-sources.json", []));

function assertUnique(values: string[], label: string) {
  const seen = new Set<string>();
  const duplicates = values.filter((value) => {
    if (seen.has(value)) {
      return true;
    }
    seen.add(value);
    return false;
  });

  if (duplicates.length > 0) {
    throw new Error(`${label} contains duplicate values: ${duplicates.join(", ")}`);
  }
}

assertUnique(companies.map((company) => company.slug), "companies.slug");
assertUnique(jobs.map((job) => job.slug), "jobs.slug");
assertUnique(ticker.map((item) => item.id), "ticker.id");
assertUnique(history.map((item) => item.date), "history.date");
assertUnique(marketHistory.map((item) => item.period_start), "market-history.period_start");
assertUnique(trackerSources.map((source) => source.company_slug), "tracked-sources.company_slug");

const companySlugs = new Set(companies.map((company) => company.slug));
const missingCompanies = jobs.filter((job) => !companySlugs.has(job.company_slug)).map((job) => `${job.slug} -> ${job.company_slug}`);

if (missingCompanies.length > 0) {
  throw new Error(`Jobs reference unknown companies: ${missingCompanies.join(", ")}`);
}

const badTicker = ticker.filter((item) => new Date(item.expires_at) <= new Date(item.published_at));
if (badTicker.length > 0) {
  throw new Error(`Ticker items expire before publication: ${badTicker.map((item) => item.id).join(", ")}`);
}

const liveRoleCount = jobs.filter((job) => job.status === "live").length;
const strictBoardViolations = jobs
  .filter((job) => job.status === "live")
  .map((job) => ({ job, reason: getStrictFdeExclusionReason(job.title, { companySlug: job.company_slug }) }))
  .filter((entry): entry is { job: typeof jobs[number]; reason: string } => Boolean(entry.reason));
const latestHistory = [...history].sort((a, b) => a.date.localeCompare(b.date)).at(-1);

if (strictBoardViolations.length > 0) {
  throw new Error(`Live jobs violate the strict FDE title rule: ${strictBoardViolations.map(({ job, reason }) => `${job.slug} (${reason})`).join(", ")}`);
}

if (latestHistory && latestHistory.live_role_count !== liveRoleCount) {
  throw new Error(`Latest history snapshot (${latestHistory.live_role_count}) must match current live role count (${liveRoleCount}).`);
}

console.log(`Validated ${companies.length} companies, ${jobs.length} jobs, ${ticker.length} ticker items, market stats, ${marketHistory.length} market history points, ${history.length} history snapshots, and ${trackerSources.length} tracked sources.`);
