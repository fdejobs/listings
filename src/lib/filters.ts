import type { Company, FilterState, Job, JobWithCompany, PostingStats } from "./types";

export const defaultFilters: FilterState = {
  q: "",
  company: [],
  role: [],
  stage: [],
  locationType: [],
  region: [],
  city: [],
  country: [],
  continent: [],
  travel: [],
  customerFacing: [],
  compFloor: null,
  industry: [],
  benefits: [],
  posted: "all",
  sort: "posted",
  page: 1
};

export const regionOptions = [
  "UK",
  "EU",
  "US East",
  "US West",
  "US Other",
  "APAC",
  "Other",
  "Global Remote"
];

export function deriveRegions(locations: string[], locationType: Job["location_type"]) {
  const haystack = locations.join(" ").toLowerCase();
  const regions = new Set<string>();

  if (locationType === "remote" && /(global|worldwide|anywhere)/.test(haystack)) {
    regions.add("Global Remote");
  }
  if (/(london|uk|united kingdom|england|scotland|wales)/.test(haystack)) {
    regions.add("UK");
  }
  if (/(paris|berlin|amsterdam|dublin|munich|france|germany|europe|emea|spain|italy|sweden|norway)/.test(haystack)) {
    regions.add("EU");
  }
  if (/(new york|nyc|boston|washington|dc|atlanta|miami|east coast|toronto)/.test(haystack)) {
    regions.add("US East");
  }
  if (/(san francisco|bay area|seattle|los angeles|la|austin|denver|west coast)/.test(haystack)) {
    regions.add("US West");
  }
  if (/(united states|usa|us remote|remote us|chicago|dallas|nashville)/.test(haystack)) {
    regions.add("US Other");
  }
  if (/(singapore|tokyo|sydney|australia|apac|india|bangalore|seoul)/.test(haystack)) {
    regions.add("APAC");
  }

  if (regions.size === 0) {
    regions.add("Other");
  }

  return Array.from(regions);
}

const nonCityTokens = new Set([
  "remote",
  "hybrid",
  "onsite",
  "in-person",
  "global",
  "worldwide",
  "anywhere",
  "emea",
  "apac",
  "europe",
  "united states",
  "united kingdom",
  "usa",
  "us",
  "uk",
  "california",
  "texas",
  "virginia",
  "maryland",
  "new jersey",
  "missouri",
  "illinois",
  "massachusetts",
  "georgia",
  "arizona",
  "ohio",
  "denmark",
  "india",
  "japan",
  "france",
  "germany",
  "italy",
  "spain",
  "australia"
]);

const cityAliases: Record<string, string> = {
  "nyc": "New York City",
  "new york": "New York City",
  "sf": "San Francisco",
  "washington": "Washington DC",
  "washington dc": "Washington DC",
  "bengaluru": "Bengaluru",
  "bangalore": "Bengaluru",
  "z rich": "Zurich"
};

export function deriveCities(locations: string[]) {
  const cities = new Set<string>();

  for (const location of locations) {
    const trimmed = location.trim();
    const normalised = trimmed.toLowerCase().replace(/[.,]/g, "").replace(/\s+/g, " ");

    if (!trimmed || nonCityTokens.has(normalised)) {
      continue;
    }

    cities.add(cityAliases[normalised] ?? trimmed);
  }

  return Array.from(cities);
}

const countryPatterns: Array<[string, RegExp]> = [
  ["United States", /(united states|usa|u\.s\.|us remote|remote us|new york|nyc|san francisco|bay area|seattle|los angeles|austin|denver|washington|dc|boston|chicago|dallas|miami|arlington|tempe|yuma|berkeley|costa mesa|california|texas|virginia|maryland|new jersey|missouri|illinois|massachusetts|georgia|arizona|ohio|florida|philadelphia|raleigh|charlotte|minnesota)/],
  ["United Kingdom", /(united kingdom|uk|london|england|scotland|wales)/],
  ["France", /(france|paris)/],
  ["Germany", /(germany|berlin|munich)/],
  ["Ireland", /(ireland|dublin)/],
  ["Italy", /(italy|milan)/],
  ["Netherlands", /(netherlands|amsterdam)/],
  ["Denmark", /(denmark|aarhus)/],
  ["Portugal", /(portugal|coimbra|lisbon)/],
  ["Sweden", /(sweden|stockholm)/],
  ["Switzerland", /(switzerland|zurich|zürich)/],
  ["Luxembourg", /luxembourg/],
  ["Spain", /(spain|madrid)/],
  ["Finland", /finland/],
  ["Canada", /(canada|toronto|montreal|montréal|ottawa)/],
  ["Singapore", /singapore/],
  ["Japan", /(japan|tokyo)/],
  ["Australia", /(australia|sydney|melbourne|brisbane|auckland|western australia|queensland)/],
  ["India", /(india|bengaluru|bangalore|mumbai|delhi)/],
  ["South Korea", /(south korea|korea|seoul)/],
  ["Brazil", /(brazil|sao paulo|são paulo)/],
  ["Mexico", /(mexico|mexico city)/],
  ["Costa Rica", /costa rica/],
  ["Israel", /(israel|herzliya)/],
  ["United Arab Emirates", /(uae|dubai|abu dhabi|united arab emirates)/],
  ["Saudi Arabia", /(saudi arabia|riyadh)/],
  ["Morocco", /(morocco|casablanca)/],
  ["Indonesia", /indonesia/],
  ["Vietnam", /vietnam/],
  ["Hong Kong", /hong kong/],
  ["Taiwan", /taiwan/]
];

export function deriveCountries(locations: string[], locationType: Job["location_type"]) {
  const haystack = locations.join(" ").toLowerCase();
  const countries = new Set<string>();

  for (const [country, pattern] of countryPatterns) {
    if (pattern.test(haystack)) {
      countries.add(country);
    }
  }

  if (locationType === "remote" && countries.size === 0) {
    countries.add("Remote / Global");
  }

  if (countries.size === 0 && /(global|worldwide|anywhere|remote)/.test(haystack)) {
    countries.add("Remote / Global");
  }

  if (countries.size === 0) {
    countries.add("Other");
  }

  return Array.from(countries);
}

export const continentOptions = [
  "North America",
  "Europe",
  "Asia-Pacific",
  "Latin America",
  "Middle East & Africa",
  "Remote / Global",
  "Other"
];

export function deriveContinents(locations: string[], locationType: Job["location_type"]) {
  const haystack = locations.join(" ").toLowerCase();
  const continents = new Set<string>();

  if (locationType === "remote" || /(global|worldwide|anywhere|remote)/.test(haystack)) {
    continents.add("Remote / Global");
  }
  if (/(united states|usa|new york|nyc|san francisco|bay area|seattle|los angeles|austin|denver|washington|dc|boston|chicago|dallas|miami|arlington|tempe|yuma|berkeley|toronto|canada)/.test(haystack)) {
    continents.add("North America");
  }
  if (/(london|united kingdom|uk|england|paris|berlin|amsterdam|dublin|munich|milan|italy|france|germany|spain|sweden|stockholm|zurich|europe|emea)/.test(haystack)) {
    continents.add("Europe");
  }
  if (/(singapore|tokyo|sydney|melbourne|australia|india|bengaluru|bangalore|seoul|apac|japan|korea)/.test(haystack)) {
    continents.add("Asia-Pacific");
  }
  if (/(sao paulo|mexico|costa rica|brazil|latam)/.test(haystack)) {
    continents.add("Latin America");
  }
  if (/(dubai|uae|israel|middle east|africa)/.test(haystack)) {
    continents.add("Middle East & Africa");
  }

  if (continents.size === 0) {
    continents.add("Other");
  }

  return Array.from(continents);
}

export function enrichJobs(jobs: Job[], companies: Company[]): JobWithCompany[] {
  const bySlug = Object.fromEntries(companies.map((company) => [company.slug, company]));

  return jobs
    .filter((job) => job.status === "live")
    .map((job) => {
      const company = bySlug[job.company_slug];
      if (!company) {
        throw new Error(`Missing company for job ${job.slug}: ${job.company_slug}`);
      }

      const regions = deriveRegions(job.locations, job.location_type);
      const cities = deriveCities(job.locations);
      const countries = deriveCountries(job.locations, job.location_type);
      const continents = deriveContinents(job.locations, job.location_type);
      const searchText = [
        job.title,
        company.name,
        company.stage,
        job.role_family,
        ...job.locations,
        ...cities,
        ...countries,
        ...continents,
        ...company.industry_tags,
        ...job.benefits_tags
      ].join(" ").toLowerCase();

      return {
        ...job,
        company,
        regions,
        cities,
        countries,
        continents,
        search_text: searchText,
        posted_ts: new Date(job.posted_at).getTime()
      };
    })
    .sort((a, b) => {
      return b.posted_ts - a.posted_ts;
    });
}

function includesEvery(selected: string[], values: string[]) {
  return selected.length === 0 || selected.some((item) => values.includes(item));
}

function postedAfter(posted: string, window: FilterState["posted"]) {
  if (window === "all") {
    return true;
  }
  const hours = window === "24h" ? 24 : window === "7d" ? 24 * 7 : 24 * 30;
  return Date.now() - new Date(posted).getTime() <= hours * 36e5;
}

function sortJobs(jobs: JobWithCompany[], sort: FilterState["sort"]) {
  const byPosted = (a: JobWithCompany, b: JobWithCompany) => b.posted_ts - a.posted_ts;

  return [...jobs].sort((a, b) => {
    if (sort === "company") {
      return a.company.name.localeCompare(b.company.name) || byPosted(a, b);
    }
    if (sort === "comp") {
      const aComp = a.comp_base_max ?? a.comp_base_min ?? 0;
      const bComp = b.comp_base_max ?? b.comp_base_min ?? 0;
      return bComp - aComp || byPosted(a, b);
    }
    if (sort === "stage") {
      return a.company.stage.localeCompare(b.company.stage) || byPosted(a, b);
    }
    return byPosted(a, b);
  });
}

export function filterJobs(jobs: JobWithCompany[], filters: FilterState) {
  const query = filters.q.trim().toLowerCase();

  const filtered = jobs.filter((job) => {
    const compMin = job.comp_base_min ?? job.comp_base_max ?? 0;

    return (
      (query.length === 0 || job.search_text.includes(query)) &&
      includesEvery(filters.company, [job.company.slug]) &&
      includesEvery(filters.role, [job.role_family]) &&
      includesEvery(filters.stage, [job.company.stage]) &&
      includesEvery(filters.locationType, [job.location_type]) &&
      includesEvery(filters.region, job.regions) &&
      includesEvery(filters.city, job.cities) &&
      includesEvery(filters.country, job.countries) &&
      includesEvery(filters.continent, job.continents) &&
      includesEvery(filters.travel, [job.travel_pct_band]) &&
      includesEvery(filters.customerFacing, [job.customer_facing_pct_band]) &&
      (filters.compFloor === null || compMin >= filters.compFloor) &&
      includesEvery(filters.industry, job.company.industry_tags) &&
      includesEvery(filters.benefits, job.benefits_tags) &&
      postedAfter(job.posted_at, filters.posted)
    );
  });

  return sortJobs(filtered, filters.sort);
}

export function activeFilterCount(filters: FilterState) {
  return Object.entries(filters).reduce((count, [key, value]) => {
    if (key === "page") {
      return count;
    }
    if (key === "sort") {
      return value === "posted" ? count : count + 1;
    }
    if (key === "posted") {
      return value === "all" ? count : count + 1;
    }
    if (Array.isArray(value)) {
      return count + value.length;
    }
    if (value === null || value === "") {
      return count;
    }
    return count + 1;
  }, 0);
}

export function parseFilters(params: URLSearchParams): FilterState {
  const split = (key: string) => params.get(key)?.split(",").filter(Boolean) ?? [];
  const posted = params.get("posted");
  const compFloor = params.get("compFloor");
  const sort = params.get("sort");
  const page = Number(params.get("page") ?? "1");

  return {
    q: params.get("q") ?? "",
    company: split("company"),
    role: split("role"),
    stage: split("stage"),
    locationType: split("locationType"),
    region: split("region"),
    city: split("city"),
    country: split("country"),
    continent: split("continent"),
    travel: split("travel"),
    customerFacing: split("customerFacing"),
    compFloor: compFloor ? Number(compFloor) : null,
    industry: split("industry"),
    benefits: split("benefits"),
    posted: posted === "24h" || posted === "7d" || posted === "30d" ? posted : "all",
    sort: sort === "company" || sort === "comp" || sort === "stage" ? sort : "posted",
    page: Number.isInteger(page) && page > 0 ? page : 1
  };
}

export function filtersToParams(filters: FilterState) {
  const params = new URLSearchParams();
  const addList = (key: string, value: string[]) => {
    if (value.length > 0) {
      params.set(key, value.join(","));
    }
  };

  if (filters.q.trim()) {
    params.set("q", filters.q.trim());
  }
  addList("company", filters.company);
  addList("role", filters.role);
  addList("stage", filters.stage);
  addList("locationType", filters.locationType);
  addList("region", filters.region);
  addList("city", filters.city);
  addList("country", filters.country);
  addList("continent", filters.continent);
  addList("travel", filters.travel);
  addList("customerFacing", filters.customerFacing);
  addList("industry", filters.industry);
  addList("benefits", filters.benefits);
  if (filters.compFloor !== null) {
    params.set("compFloor", String(filters.compFloor));
  }
  if (filters.posted !== "all") {
    params.set("posted", filters.posted);
  }
  if (filters.sort !== "posted") {
    params.set("sort", filters.sort);
  }
  if (filters.page > 1) {
    params.set("page", String(filters.page));
  }
  return params;
}

export function countAddedThisWeek(jobs: Job[]) {
  const cutoff = Date.now() - 7 * 24 * 36e5;
  return jobs.filter((job) => job.status === "live" && new Date(job.first_seen_at).getTime() >= cutoff).length;
}

export function postingStats(jobs: Job[], now = new Date()): PostingStats {
  const live = jobs.filter((job) => job.status === "live");
  const currentMonth = now.toISOString().slice(0, 7);
  const previous = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const previousMonth = previous.toISOString().slice(0, 7);
  const currentMonthCount = live.filter((job) => job.posted_at.startsWith(currentMonth)).length;
  const previousMonthCount = live.filter((job) => job.posted_at.startsWith(previousMonth)).length;
  const momChangePct = previousMonthCount === 0
    ? null
    : Math.round(((currentMonthCount - previousMonthCount) / previousMonthCount) * 100);

  return {
    totalEstimate: live.length,
    currentMonthLabel: now.toLocaleString("en", { month: "short" }).toUpperCase(),
    currentMonthCount,
    previousMonthCount,
    momChangePct
  };
}
