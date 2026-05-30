import { z } from "astro/zod";

export const stageSchema = z.enum([
  "seed",
  "series_a",
  "series_b",
  "series_c",
  "series_d_plus",
  "public",
  "bootstrapped",
  "gov_defense"
]);

export const headcountBandSchema = z.enum([
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+"
]);

export const atsProviderSchema = z.enum([
  "greenhouse",
  "lever",
  "ashby",
  "workday",
  "workable",
  "custom",
  "manual"
]);

export const sourceProviderSchema = z.enum([
  "greenhouse",
  "lever",
  "ashby",
  "workday",
  "workable",
  "custom",
  "hn_who_is_hiring",
  "indeed",
  "wellfound",
  "manual"
]);

export const roleFamilySchema = z.enum([
  "fde",
  "solutions_engineer",
  "deployed_engineer",
  "ai_engineer",
  "other"
]);

export const locationTypeSchema = z.enum(["onsite", "hybrid", "remote"]);
export const travelBandSchema = z.enum(["none", "low_0_25", "med_25_50", "high_50_plus"]);
export const customerFacingBandSchema = z.enum(["low_0_25", "med_25_50", "high_50_plus"]);
export const currencySchema = z.enum(["USD", "GBP", "EUR"]);
export const jobStatusSchema = z.enum(["review", "live", "expired"]);

export const isoDateString = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "Expected an ISO-like date string"
});

export const companySchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  logo_url: z.string().url().nullable(),
  stage: stageSchema,
  headcount_band: headcountBandSchema,
  industry_tags: z.array(z.string().min(1)).default([]),
  ats_provider: atsProviderSchema.exclude(["manual"]).nullable(),
  ats_slug: z.string().min(1).nullable(),
  custom_scraper_id: z.string().min(1).nullable(),
  is_active: z.boolean(),
  notes: z.string().nullable()
});

export const jobSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  company_slug: z.string().min(1),
  title: z.string().min(1),
  role_family: roleFamilySchema,
  location_type: locationTypeSchema,
  locations: z.array(z.string().min(1)).min(1),
  travel_pct_band: travelBandSchema,
  customer_facing_pct_band: customerFacingBandSchema,
  comp_base_min: z.number().int().nonnegative().nullable(),
  comp_base_max: z.number().int().nonnegative().nullable(),
  comp_currency: currencySchema,
  equity_offered: z.boolean(),
  equity_note: z.string().nullable(),
  benefits_tags: z.array(z.string().min(1)).default([]),
  description_md: z.string().min(1),
  apply_url: z.string().url(),
  source_provider: sourceProviderSchema,
  source_url: z.string().url().nullable(),
  first_seen_at: isoDateString,
  posted_at: isoDateString,
  expires_at: isoDateString.nullable(),
  classifier_confidence: z.number().min(0).max(1),
  classifier_reasoning: z.string().nullable(),
  classifier_version: z.string().min(1).default("manual"),
  status: jobStatusSchema,
  is_featured: z.boolean()
}).refine((job) => {
  if (job.comp_base_min === null || job.comp_base_max === null) {
    return true;
  }
  return job.comp_base_min <= job.comp_base_max;
}, {
  message: "comp_base_min must be <= comp_base_max"
});

export const tickerItemSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["news", "announcement", "milestone"]),
  text: z.string().min(1).max(80),
  url: z.string().url().nullable(),
  published_at: isoDateString,
  expires_at: isoDateString,
  is_pinned: z.boolean()
});

export const marketStatsSchema = z.object({
  source: z.literal("indeed_jd_tracker"),
  source_label: z.string().min(1),
  source_url: z.string().url(),
  current_period: z.string().min(1),
  metric_kind: z.enum(["posting_count", "posting_count_proxy", "posting_index"]).default("posting_count"),
  postings_count: z.number().int().nonnegative(),
  mom_change_pct: z.number().int().nullable(),
  updated_at: isoDateString,
  notes: z.string().nullable()
});

export const marketHistoryPointSchema = z.object({
  source: z.literal("indeed_jd_tracker"),
  period_start: isoDateString,
  period_end: isoDateString,
  period_label: z.string().min(1),
  metric_kind: z.enum(["posting_count", "posting_count_proxy", "posting_index"]).default("posting_count"),
  postings_count: z.number().int().nonnegative(),
  source_url: z.string().url(),
  collected_at: isoDateString,
  collection_method: z.enum(["reference_seed", "manual_snapshot", "licensed_data"]),
  notes: z.string().nullable()
});

export const historicalSnapshotSchema = z.object({
  date: isoDateString,
  live_role_count: z.number().int().nonnegative(),
  source: z.literal("site_live_jobs"),
  notes: z.string().nullable()
});

export const trackerSourceSchema = z.object({
  company_slug: z.string().min(1),
  company_name: z.string().min(1),
  category: z.enum([
    "ai_lab",
    "big_tech_cloud",
    "startup",
    "consulting",
    "defense",
    "fintech",
    "data_infra"
  ]),
  industries: z.array(z.string().min(1)).min(1),
  source_type: z.enum(["ats_api", "careers_search", "custom_scraper", "manual_override"]),
  source_url: z.string().url(),
  observed_at: isoDateString,
  refresh_cadence: z.enum(["daily", "weekly", "manual"]),
  notes: z.string().min(1),
  observed_roles: z.array(z.object({
    title: z.string().min(1),
    locations: z.array(z.string().min(1)).min(1),
    seniority: z.string().nullable(),
    source_url: z.string().url()
  })).default([])
});

export const companiesSchema = z.array(companySchema);
export const jobsSchema = z.array(jobSchema);
export const tickerSchema = z.array(tickerItemSchema);
export const historySchema = z.array(historicalSnapshotSchema);
export const marketHistorySchema = z.array(marketHistoryPointSchema);
export const trackerSourcesSchema = z.array(trackerSourceSchema);

export type Company = z.infer<typeof companySchema>;
export type Job = z.infer<typeof jobSchema>;
export type TickerItem = z.infer<typeof tickerItemSchema>;
export type MarketStats = z.infer<typeof marketStatsSchema>;
export type MarketHistoryPoint = z.infer<typeof marketHistoryPointSchema>;
export type HistoricalSnapshot = z.infer<typeof historicalSnapshotSchema>;
export type TrackerSource = z.infer<typeof trackerSourceSchema>;
export type Stage = z.infer<typeof stageSchema>;
export type RoleFamily = z.infer<typeof roleFamilySchema>;
export type LocationType = z.infer<typeof locationTypeSchema>;
export type TravelBand = z.infer<typeof travelBandSchema>;
export type CustomerFacingBand = z.infer<typeof customerFacingBandSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;
