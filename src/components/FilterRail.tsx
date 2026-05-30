import { useEffect, useMemo, useState } from "preact/hooks";
import SearchInput from "./SearchInput";
import {
  activeFilterCount,
  continentOptions,
  defaultFilters,
  filterJobs,
  filtersToParams,
  parseFilters
} from "../lib/filters";
import { leadFormUrl } from "../lib/leadCapture";
import {
  describeLocations,
  formatComp,
  isClosingSoon,
  isNew,
  postedAgo,
  roleSignalLabel,
  roleLabel,
  stageLabel,
  travelLabel
} from "../lib/format";
import type { Company, FilterState, JobWithCompany } from "../lib/types";

type Props = {
  jobs: JobWithCompany[];
  companies: Company[];
  addedThisWeek: number;
};

const roleOptions = [
  "fde",
  "solutions_engineer",
  "deployed_engineer",
  "ai_engineer",
  "other"
] as const;

const stageOptions = [
  "seed",
  "series_a",
  "series_b",
  "series_c",
  "series_d_plus",
  "public",
  "gov_defense",
  "bootstrapped"
] as const;

const locationOptions = ["onsite", "hybrid", "remote"] as const;
const travelOptions = ["none", "low_0_25", "med_25_50", "high_50_plus"] as const;
const facingOptions = ["low_0_25", "med_25_50", "high_50_plus"] as const;
const pageSize = 20;
const postedOptions = [
  ["24h", "24h"],
  ["7d", "7d"],
  ["30d", "30d"],
  ["all", "All"]
] as const;

const exposureLabels: Record<(typeof facingOptions)[number], string> = {
  low_0_25: "Mostly internal",
  med_25_50: "Mixed field/internal",
  high_50_plus: "High field exposure"
};
const sortOptions = [
  ["posted", "Newest"],
  ["company", "Company"],
  ["comp", "Comp"],
  ["stage", "Stage"]
] as const;

type LocationQuickOption = {
  label: string;
  value: string;
  kind: "city" | "country" | "continent" | "remote";
};

function useUrlFilters() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setFilters(parseFilters(new URLSearchParams(window.location.search)));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !hydrated) {
      return;
    }
    const params = filtersToParams(filters);
    const next = params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname;
    window.history.replaceState(null, "", next);
  }, [filters, hydrated]);

  return [filters, setFilters] as const;
}

function toggleList(filters: FilterState, key: keyof FilterState, value: string): FilterState {
  const current = filters[key];
  if (!Array.isArray(current)) {
    return filters;
  }
  return {
    ...filters,
    page: 1,
    [key]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
  };
}

function FilterGroup({
  label,
  children
}: {
  label: string;
  children: preact.ComponentChildren;
}) {
  return (
    <section class="filter-group">
      <div class="filter-label">{label}</div>
      <div class="filter-options">{children}</div>
    </section>
  );
}

function CheckboxOption({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label class="filter-check">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

function FilterControls({
  filters,
  setFilters,
  industryOptions,
  benefitOptions,
  cityOptions,
  countryOptions
}: {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  industryOptions: string[];
  benefitOptions: string[];
  cityOptions: string[];
  countryOptions: string[];
}) {
  return (
    <div class="filters-grid">
      <FilterGroup label="Role family">
        {roleOptions.map((role) => (
          <CheckboxOption
            key={role}
            label={roleLabel(role)}
            checked={filters.role.includes(role)}
            onChange={() => setFilters(toggleList(filters, "role", role))}
          />
        ))}
      </FilterGroup>
      <FilterGroup label="Stage">
        {stageOptions.map((stage) => (
          <CheckboxOption
            key={stage}
            label={stageLabel(stage)}
            checked={filters.stage.includes(stage)}
            onChange={() => setFilters(toggleList(filters, "stage", stage))}
          />
        ))}
      </FilterGroup>
      <FilterGroup label="Location">
        {locationOptions.map((type) => (
          <CheckboxOption
            key={type}
            label={type[0].toUpperCase() + type.slice(1)}
            checked={filters.locationType.includes(type)}
            onChange={() => setFilters(toggleList(filters, "locationType", type))}
          />
        ))}
      </FilterGroup>
      <FilterGroup label="City">
        {cityOptions.map((city) => (
          <CheckboxOption
            key={city}
            label={city}
            checked={filters.city.includes(city)}
            onChange={() => setFilters(toggleList(filters, "city", city))}
          />
        ))}
      </FilterGroup>
      <FilterGroup label="Country">
        {countryOptions.map((country) => (
          <CheckboxOption
            key={country}
            label={country}
            checked={filters.country.includes(country)}
            onChange={() => setFilters(toggleList(filters, "country", country))}
          />
        ))}
      </FilterGroup>
      <FilterGroup label="Continent">
        {continentOptions.map((continent) => (
          <CheckboxOption
            key={continent}
            label={continent}
            checked={filters.continent.includes(continent)}
            onChange={() => setFilters(toggleList(filters, "continent", continent))}
          />
        ))}
      </FilterGroup>
      <FilterGroup label="Travel">
        {travelOptions.map((travel) => (
          <CheckboxOption
            key={travel}
            label={travelLabel(travel)}
            checked={filters.travel.includes(travel)}
            onChange={() => setFilters(toggleList(filters, "travel", travel))}
          />
        ))}
      </FilterGroup>
      <FilterGroup label="Work exposure">
        {facingOptions.map((facing) => (
          <CheckboxOption
            key={facing}
            label={exposureLabels[facing]}
            checked={filters.customerFacing.includes(facing)}
            onChange={() => setFilters(toggleList(filters, "customerFacing", facing))}
          />
        ))}
      </FilterGroup>
      <FilterGroup label="Comp floor">
        <input
          type="range"
          min="0"
          max="300000"
          step="10000"
          value={filters.compFloor ?? 0}
          aria-label="Minimum base compensation in USD"
          onInput={(event) => {
            const value = Number((event.currentTarget as HTMLInputElement).value);
            setFilters({ ...filters, compFloor: value === 0 ? null : value, page: 1 });
          }}
        />
        <span class="mono micro">{filters.compFloor ? `$${Math.round(filters.compFloor / 1000)}k+` : "Any base"}</span>
      </FilterGroup>
      <FilterGroup label="Industry">
        {industryOptions.slice(0, 14).map((tag) => (
          <CheckboxOption
            key={tag}
            label={tag}
            checked={filters.industry.includes(tag)}
            onChange={() => setFilters(toggleList(filters, "industry", tag))}
          />
        ))}
      </FilterGroup>
      <FilterGroup label="Benefits">
        {benefitOptions.map((tag) => (
          <CheckboxOption
            key={tag}
            label={tag}
            checked={filters.benefits.includes(tag)}
            onChange={() => setFilters(toggleList(filters, "benefits", tag))}
          />
        ))}
      </FilterGroup>
      <FilterGroup label="Posted in">
        {postedOptions.map(([value, label]) => (
          <label class="filter-check" key={value}>
            <input
              type="radio"
              name="posted"
              checked={filters.posted === value}
              onChange={() => setFilters({ ...filters, posted: value, page: 1 })}
            />
            <span>{label}</span>
          </label>
        ))}
      </FilterGroup>
    </div>
  );
}

function sourceProviderLabel(source: JobWithCompany["source_provider"]) {
  const labels: Record<string, string> = {
    greenhouse: "Greenhouse",
    lever: "Lever",
    ashby: "Ashby",
    workday: "Workday",
    workable: "Workable",
    custom: "company careers",
    hn_who_is_hiring: "HN",
    manual: "manual review",
    indeed: "Indeed",
    wellfound: "Wellfound"
  };

  return labels[source] ?? source;
}

function JobRow({ job }: { job: JobWithCompany }) {
  const tags = job.company.industry_tags.slice(0, 2);
  const overflow = job.company.industry_tags.length - tags.length;
  const closing = isClosingSoon(job);
  const newlyPosted = isNew(job.posted_at);

  return (
    <article class="job-row">
      <a class="job-row-link" href={job.apply_url} target="_blank" rel="noopener noreferrer" aria-label={`Apply for ${job.title} at ${job.company.name}`}>
      <div class="job-row-main">
        <div class="job-company-cell">
          <div class="job-company-line">
            <span class="job-company-name">{job.company.name}</span>
            <span class="chip stage">{stageLabel(job.company.stage)}</span>
            {job.is_featured && <span class="chip founder">Talk to the founder</span>}
          </div>
        </div>
        <div>
          <div class="job-title">{job.title}</div>
          <div class="job-meta-line">
            <span>{describeLocations(job)}</span>
            {job.travel_pct_band === "high_50_plus" && <span class="chip closing">50%+ travel</span>}
          </div>
        </div>
        <div class="job-tags">
          {tags.map((tag) => (
            <span class="chip" key={tag}>{tag}</span>
          ))}
          {overflow > 0 && <span class="chip">+{overflow}</span>}
          {closing && <span class="chip closing">Closing soon</span>}
        </div>
        <div class="job-right">
          <span class="job-comp">{formatComp(job)}</span>
          <span class="job-date-line">
            {newlyPosted && <span class="chip new">New</span>}
            <span class="job-date">{postedAgo(job.posted_at)}</span>
          </span>
        </div>
      </div>
      </a>
      <div class="job-hidden-line">
        <span>{roleSignalLabel(job)}</span>
        <span>·</span>
        <span>{job.benefits_tags.length ? job.benefits_tags.join(" · ") : "Benefits not listed"}</span>
        <span>·</span>
        <span>Source: {sourceProviderLabel(job.source_provider)}</span>
        <span>·</span>
        <a class="job-referral-link" href={leadFormUrl} target="_blank" rel="noopener noreferrer">
          Referral opportunities
        </a>
      </div>
    </article>
  );
}

export default function FilterRail({ jobs, companies, addedThisWeek }: Props) {
  const [filters, setFilters] = useUrlFilters();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const industryOptions = useMemo(
    () => Array.from(new Set(companies.flatMap((company) => company.industry_tags))).sort(),
    [companies]
  );
  const cityOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const job of jobs) {
      for (const city of job.cities) {
        counts.set(city, (counts.get(city) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([city]) => city)
      .slice(0, 28);
  }, [jobs]);
  const countryOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const job of jobs) {
      for (const country of job.countries) {
        counts.set(country, (counts.get(country) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([country]) => country)
      .slice(0, 24);
  }, [jobs]);
  const locationQuickOptions = useMemo<LocationQuickOption[]>(() => {
    const topCities = cityOptions.slice(0, 12).map((city) => ({
      label: city,
      value: `city:${city}`,
      kind: "city" as const
    }));
    const topCountries = countryOptions.slice(0, 12).map((country) => ({
      label: country,
      value: `country:${country}`,
      kind: "country" as const
    }));

    return [
      { label: "Remote", value: "remote:remote", kind: "remote" },
      ...topCities,
      ...topCountries,
      ...continentOptions.map((continent) => ({
        label: continent,
        value: `continent:${continent}`,
        kind: "continent" as const
      }))
    ];
  }, [cityOptions, countryOptions]);
  const benefitOptions = useMemo(() => {
    const values = Array.from(new Set(jobs.flatMap((job) => job.benefits_tags))).sort();
    return [
      ...values.filter((value) => /visa/i.test(value)),
      ...values.filter((value) => /parent/i.test(value)),
      ...values.filter((value) => !/visa|parent/i.test(value))
    ].slice(0, 12);
  }, [jobs]);
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const query = window.matchMedia("(max-width: 700px)");
    const update = () => setIsCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (isCompact && activeFilterCount(filters) > 0) {
      setFilters({ ...defaultFilters, page: filters.page });
      setFiltersOpen(false);
    }
  }, [filters, isCompact, setFilters]);

  const effectiveFilters = isCompact ? { ...defaultFilters, page: filters.page } : filters;
  const filteredJobs = useMemo(() => filterJobs(jobs, effectiveFilters), [jobs, effectiveFilters]);
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const currentPage = Math.min(effectiveFilters.page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pagedJobs = filteredJobs.slice(startIndex, startIndex + pageSize);
  const active = activeFilterCount(filters);
  const activeLocationValue = useMemo(() => {
    if (filters.locationType.includes("remote") && filters.city.length === 0 && filters.country.length === 0 && filters.continent.length === 0) {
      return "remote:remote";
    }
    if (filters.city.length === 1 && filters.country.length === 0 && filters.continent.length === 0 && filters.locationType.length === 0) {
      return `city:${filters.city[0]}`;
    }
    if (filters.country.length === 1 && filters.city.length === 0 && filters.continent.length === 0 && filters.locationType.length === 0) {
      return `country:${filters.country[0]}`;
    }
    if (filters.continent.length === 1 && filters.city.length === 0 && filters.country.length === 0 && filters.locationType.length === 0) {
      return `continent:${filters.continent[0]}`;
    }
    return "";
  }, [filters.city, filters.continent, filters.country, filters.locationType]);

  useEffect(() => {
    if (filters.page > totalPages) {
      setFilters({ ...filters, page: totalPages });
    }
  }, [filters, setFilters, totalPages]);

  return (
    <div class="jobs-board">
      <div class="page-head">
        <div class="eyebrow">Forward deployed engineering roles</div>
        <h1 class="page-title">the fastest growing job in tech</h1>
        <p class="page-subhead">
          <span class="mono" title="Newly tracked uses the board's first_seen_at timestamp, not necessarily the employer's original posting date.">
            {filteredJobs.length} of {jobs.length} roles · {addedThisWeek} newly tracked this week
          </span>
        </p>
      </div>
      <div class="list-toolbar">
        <SearchInput value={filters.q} onInput={(q) => setFilters({ ...filters, q, page: 1 })} />
        <div class="toolbar-row">
          <button
            class="filter-dropdown-button"
            type="button"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            Filters{active > 0 ? ` (${active})` : ""}
          </button>
          <label class="location-control">
            <span>Location</span>
            <select
              value={activeLocationValue}
              onChange={(event) => {
                const value = (event.currentTarget as HTMLSelectElement).value;
                const [kind, ...rawParts] = value.split(":");
                const raw = rawParts.join(":");
                setFilters({
                  ...filters,
                  locationType: kind === "remote" ? ["remote"] : [],
                  city: kind === "city" ? [raw] : [],
                  country: kind === "country" ? [raw] : [],
                  continent: kind === "continent" ? [raw] : [],
                  page: 1
                });
              }}
            >
              <option value="">All locations</option>
              {locationQuickOptions.map((option) => (
                <option value={option.value} key={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label class="sort-control">
            <span>Sort</span>
            <select
              value={filters.sort}
              onChange={(event) => {
                const sort = (event.currentTarget as HTMLSelectElement).value as FilterState["sort"];
                setFilters({ ...filters, sort, page: 1 });
              }}
            >
              {sortOptions.map(([value, label]) => (
                <option value={value} key={value}>{label}</option>
              ))}
            </select>
          </label>
          {active > 0 && (
            <button class="button-ghost" type="button" onClick={() => setFilters(defaultFilters)}>
              Clear all
            </button>
          )}
        </div>
        {filtersOpen && (
          <div class="filters-dropdown-panel">
            <FilterControls
              filters={filters}
              setFilters={setFilters}
              industryOptions={industryOptions}
              benefitOptions={benefitOptions}
              cityOptions={cityOptions}
              countryOptions={countryOptions}
            />
          </div>
        )}
      </div>
      <main aria-live="polite">
        <div class="job-list">
          {filteredJobs.length > 0 ? (
            pagedJobs.map((job) => <JobRow key={job.slug} job={job} />)
          ) : (
            <div class="empty-state">
              <p>No roles match those filters.</p>
            </div>
          )}
        </div>
        {filteredJobs.length > pageSize && (
          <nav class="pagination" aria-label="Job list pagination">
            <button
              type="button"
              class="pagination-button"
              disabled={currentPage === 1}
              onClick={() => setFilters({ ...filters, page: Math.max(1, currentPage - 1) })}
            >
              Previous
            </button>
            <span class="mono">
              {startIndex + 1}-{Math.min(startIndex + pageSize, filteredJobs.length)} of {filteredJobs.length} · Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              class="pagination-button"
              disabled={currentPage === totalPages}
              onClick={() => setFilters({ ...filters, page: Math.min(totalPages, currentPage + 1) })}
            >
              Next
            </button>
          </nav>
        )}
      </main>
    </div>
  );
}
