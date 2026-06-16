export type {
  Company,
  CustomerFacingBand,
  HistoricalSnapshot,
  Job,
  JobStatus,
  LocationType,
  MarketHistoryPoint,
  MarketStats,
  RoleFamily,
  Stage,
  TickerItem,
  TrackerSource,
  TravelBand
} from "./schema";

export type CompanyLookup = Record<string, import("./schema").Company>;

export type JobWithCompany = import("./schema").Job & {
  company: import("./schema").Company;
  search_text: string;
  regions: string[];
  cities: string[];
  countries: string[];
  continents: string[];
  posted_ts: number;
};

export type FilterState = {
  q: string;
  company: string[];
  role: string[];
  stage: string[];
  locationType: string[];
  region: string[];
  city: string[];
  country: string[];
  continent: string[];
  travel: string[];
  customerFacing: string[];
  compFloor: number | null;
  industry: string[];
  benefits: string[];
  posted: "24h" | "7d" | "30d" | "all";
  sort: "posted" | "company" | "comp" | "stage";
  page: number;
};

export type PostingStats = {
  totalEstimate: number;
  currentMonthLabel: string;
  currentMonthCount: number;
  previousMonthCount: number;
  momChangePct: number | null;
};
