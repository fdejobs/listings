import rss from "@astrojs/rss";
import { getCompanies, getJobs } from "../lib/data";

export async function GET(context: { site: string | URL }) {
  const companies = getCompanies();
  const bySlug = Object.fromEntries(companies.map((company) => [company.slug, company]));
  const jobs = getJobs().filter((job) => job.status === "live").slice(0, 100);

  return rss({
    title: "FDE Collective",
    description: "Newest forward-deployed roles",
    site: context.site,
    items: jobs.map((job) => ({
      title: `${job.title} at ${bySlug[job.company_slug]?.name ?? job.company_slug}`,
      pubDate: new Date(job.posted_at),
      link: `/j/${job.slug}/`,
      description: job.description_md.slice(0, 240)
    }))
  });
}
