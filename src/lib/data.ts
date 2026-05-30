import companiesJson from "../content/data/companies.json";
import historyJson from "../content/data/history.json";
import jobsJson from "../content/data/jobs.json";
import marketHistoryJson from "../content/data/market-history.json";
import marketJson from "../content/data/market.json";
import tickerJson from "../content/data/ticker.json";
import trackerSourcesJson from "../content/data/tracked-sources.json";
import { companiesSchema, historySchema, jobsSchema, marketHistorySchema, marketStatsSchema, tickerSchema, trackerSourcesSchema } from "./schema";
import type { Company, HistoricalSnapshot, Job, MarketHistoryPoint, MarketStats, TickerItem, TrackerSource } from "./types";

export function getCompanies(): Company[] {
  return companiesSchema.parse(companiesJson).sort((a, b) => a.name.localeCompare(b.name));
}

export function getJobs(): Job[] {
  return jobsSchema.parse(jobsJson).sort((a, b) => b.posted_at.localeCompare(a.posted_at));
}

export function getTickerItems(): TickerItem[] {
  return tickerSchema
    .parse(tickerJson)
    .filter((item) => new Date(item.expires_at).getTime() > Date.now())
    .sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) {
        return a.is_pinned ? -1 : 1;
      }
      return b.published_at.localeCompare(a.published_at);
    });
}

export function getMarketStats(): MarketStats {
  return marketStatsSchema.parse(marketJson);
}

export function getMarketHistory(): MarketHistoryPoint[] {
  return marketHistorySchema.parse(marketHistoryJson).sort((a, b) => a.period_start.localeCompare(b.period_start));
}

export function getHistoricalSnapshots(): HistoricalSnapshot[] {
  return historySchema.parse(historyJson).sort((a, b) => a.date.localeCompare(b.date));
}

export function getTrackerSources(): TrackerSource[] {
  return trackerSourcesSchema.parse(trackerSourcesJson).sort((a, b) => a.company_name.localeCompare(b.company_name));
}

export function companyMap(companies: Company[]) {
  return Object.fromEntries(companies.map((company) => [company.slug, company]));
}
