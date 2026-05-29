# FDE Jobs Internal Memory

This file is private operating context for this project. Do not publish this methodology as website copy unless explicitly asked.

## Sourcing Methodology

The board should track current live Forward Deployed Engineering roles through two complementary signals:

1. Direct company career pages and ATS APIs for priority AI labs, cloud platforms, AI infrastructure companies, and high-growth startups.
2. A weekly Indeed exact-title / job-description benchmark for market-wide demand using queries such as `"forward deployed engineer"`, `"forward deployed AI engineer"`, `"forward deployed machine learning engineer"`, `"deployed engineer"`, and `"AI deployment engineer"`.

Direct employer sources are preferred over aggregators. Aggregator listings should only be published if they resolve to a live employer application page or a stable apply URL.

## Inclusion Standard

A listing can go live when it meets one of these tests:

- The title contains `Forward Deployed Engineer`, `Forward Deployed AI Engineer`, `Forward Deployed Machine Learning Engineer`, `Deployed Engineer`, or a very close equivalent.
- The title is adjacent, such as Applied AI Engineer, AI Deployment Strategist, Technical Lead Applied AI, or Solutions Engineer, and the description explicitly says the person embeds with customers, builds or deploys production systems, owns integrations or POCs, and feeds learnings back into product/engineering.

Exclude pure sales engineering, partner solution architecture, delivery architecture, customer success, account management, implementation consulting, and generic solutions roles unless the description clearly includes hands-on engineering and forward-deployed ownership.

Every live listing should have:

- A live application URL tested after ingestion.
- A source URL and provider.
- Company, title, locations, country/remote status, industry, funding stage, seniority, and role family tags.
- A dedupe key based on source URL first, then company + title + primary location.

## Priority AI Lab Sweep

Review these first before broader startup/company sweeps:

1. OpenAI
2. Anthropic
3. Google DeepMind / Google Cloud Applied AI
4. Mistral AI
5. Cohere
6. xAI
7. Perplexity
8. AI21 Labs
9. Reka
10. Together AI

Cohere and Mistral should be treated as priority sources because both have active forward-deployed / applied AI customer deployment hiring signals.

## Broader Company Universe

Maintain a broader source universe of roughly the top 500 tech companies and startups, refreshed from stable lists rather than ad hoc memory:

- Frontier AI labs and model companies.
- Cloud platforms and hyperscalers.
- AI infrastructure, data infrastructure, developer tools, and observability companies.
- Vertical AI companies in healthcare, legal, finance, industrials, and defense.
- Consulting/product studios whose roles are deeply technical and customer-embedded.
- High-growth private companies from credible public lists such as YC, Cloud 100, Forbes AI 50, a16z AI/app/infrastructure maps, major unicorn lists, and known public tech companies.

This wider universe should be kept in repo-backed JSON/source files, not hard-coded in page copy. The top 500 list can include companies with zero current FDE roles; only matching live roles should appear on the board.

## Refresh Cadence

- Tier 1 ATS APIs: daily where available.
- Dynamic or custom career pages: weekly.
- Indeed benchmark: weekly snapshot, stored historically.
- Manual overrides: timestamp every update and include source URLs.

Weekly and monthly growth should come from stored snapshots. If historical data is missing, say tracking starts from the first available snapshot rather than inventing growth.
