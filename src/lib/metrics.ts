import type { Company, HistoricalSnapshot, Job, JobWithCompany } from "./types";
import { enrichJobs } from "./filters";

export type LiveRoleMetric = {
  currentLiveRoles: number;
  liveJobs: JobWithCompany[];
};

export function getLiveRoleMetric(jobs: Job[], companies: Company[]): LiveRoleMetric {
  const liveJobs = enrichJobs(jobs, companies);

  return {
    currentLiveRoles: liveJobs.length,
    liveJobs
  };
}

export function latestHistorySnapshot(history: HistoricalSnapshot[]) {
  return [...history].sort((a, b) => a.date.localeCompare(b.date)).at(-1) ?? null;
}
