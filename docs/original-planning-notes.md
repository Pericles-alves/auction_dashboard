i want to build a dash board with updated informations of auctions, for this i need to have some databases, vehicle prices by state, past auctions and items, tax previews and other things, a nice interactable dash board, could be in html like a web site, with a a search engine and a filtering system

For what you're describing, I would build a full-stack web application using Python as the backend, PostgreSQL as the database, and React as the frontend.
Your project is evolving beyond an auction monitoring automation. You're describing an auction intelligence platform that continuously collects information, maintains historical records, compares market prices, estimates acquisition costs, and helps identify profitable opportunities.
I would design it so that you can initially use it privately, but the architecture can eventually support multiple users.
1. What the dashboard could look like
Imagine opening your website and seeing a dashboard with live auction listings, estimated market values, total acquisition costs, and opportunities ranked by potential profitability.
The interface could have a search bar, advanced filters, maps, historical price charts, and individual vehicle analysis pages.
A particularly useful feature would be the ability to search for something like Ford Ka 2019, within 300 km of Campinas, maximum total cost R$ 25,000, minimum estimated discount 25%.
The application would combine data from several sources rather than simply showing listings copied from auction websites.
Conceptual dashboard mockup. All values and auction listings shown are illustrative, not real market data.2. Recommended technology stack
Layer	Technology	Purpose
Frontend	React + TypeScript	Interactive dashboard
UI components	Tailwind CSS + shadcn/ui	Modern, responsive interface
Backend	Python + FastAPI	REST API and business logic
Main database	PostgreSQL	Auctions, lots, vehicles, prices, historical records
Geographical queries	PostGIS	Distance, cities, states, auction locations
Search engine	PostgreSQL initially	Full-text search and filtering
Web scraping	Scrapy + Playwright	Extract auction listings
Background tasks	Celery + Redis	Scheduled collection and processing
AI processing	Python + LLM APIs	Analyze notices, descriptions and documents
Charts	Apache ECharts	Interactive market analysis
Deployment	Docker Compose	Run services together
I would not introduce n8n initially. Your project has enough complex data-processing requirements that maintaining the orchestration in Python would simplify testing, version control, and deployment. You can integrate n8n later for notifications and external automations.
3. Database architecture
I would avoid storing everything in one large table. Instead, use a relational database with separate entities for auction sources, events, lots, vehicles, market prices, taxes, and historical observations.
Simplified database relationships
Auction Sources
Freitas, Copart, banks, fleet companies...

Auction Events
Dates, locations, auction type, conditions

Auction Lots
Lot number, bids, fees, condition, status

Vehicles
Make, model, year, version, mileage

Bid History
Observed prices and final results

Market Prices
FIPE, state prices, historical trends

Taxes & Costs
Fees, transport, documentation, repairs



A crucial design decision is to preserve historical snapshots, not simply overwrite the latest information.
For example, if a vehicle's bid changes from R$ 15,000 to R$ 22,000, you want to retain both observations, their timestamps, and the source.
This allows you to calculate auction price trends and evaluate your prediction algorithms later.
4. Where the data will come from
This is probably the most challenging part of the project.
Information	Potential sources	Main challenge
Current auctions	Auctioneer websites, bank and fleet auctions	Different site structures
Past auctions	Archived catalogs, auction results, your own snapshots	Historical data availability
Reference vehicle prices	FIPE	National reference, not state-specific
Prices by state	Vehicle listings, historical sale data	Asking price vs actual sale price
Vehicle taxes	State SEFAZ and DETRAN resources	Different rules per state
Auction fees	Auction notices and terms	Vary by event and lot
Transport costs	Carrier quotations, distance estimates	Vehicle and route variations
Vehicle conditions	Lot descriptions, images, inspection reports	Incomplete information
A critical distinction: FIPE is not a reliable source for directly comparing vehicle prices between Brazilian states. You would need to build your own regional price dataset from permitted sources.
Similarly, advertised prices are not necessarily transaction prices. Your database should explicitly identify whether a price is an asking price, an observed auction bid, a confirmed hammer price, or a reference valuation.
Tax calculations should also distinguish between taxes applicable to a specific auction transaction and ordinary vehicle ownership costs. Each estimate needs an effective date, jurisdiction, legal basis, and uncertainty where applicable.
5. Interactive vehicle analysis
One feature I would prioritize is a detailed acquisition-cost calculator.
Here is an interactive example with hypothetical inputs.
Acquisition cost simulator
Example

Winning bid (R$)

Auction fee (%)

Tax assumption (%)

Transport (R$)

Repairs (R$)

Documentation (R$)


Estimated resale value (R$)

Total acquisition costR$ 24.250


Potential gross profitR$ 9.750



Estimated return on acquisition cost
40.2%



Illustrative gross estimate, before selling expenses, income taxes, financing, and unforeseen costs. The tax percentage is a manual assumption, not a determination of ICMS liability. Copy calculation
In the real application, many of these values could be automatically prefilled based on the auction notice, vehicle, and state. You would still be able to override them.
6. How I would develop it
I would build this in five phases, each producing a usable result.
01

Foundation and dashboard
First milestoneFastAPI, PostgreSQL, React, authentication, auction and lot models, searchable dashboard with manually imported sample data.


02

Automated auction collection
Data pipelineScrapers for the first two or three auction sites, scheduled collection, duplicate detection, historical snapshots, and source monitoring.


03

Market prices and costs
Intelligence layerFIPE integration, regional price observations, tax rules, auction fees, transport estimates, and vehicle profitability scoring.


04

AI-assisted document analysis
Advanced processingExtract auction conditions from PDFs, analyze lot descriptions, classify risks, and flag information requiring human review.


05

Advanced analytics and alerts
ExpansionHistorical price trends, saved searches, opportunity rankings, notifications, auction comparisons, and personalized reports.



7. One important architectural choice
I recommend treating data acquisition, normalization, and presentation as independent components.
A scraper should never need to know how the dashboard works. The dashboard should never need to know how a particular auction site is scraped. Both should interact through well-defined database schemas and APIs.
That will make it much easier to add dozens of auction sources, replace unreliable scrapers, and introduce new market-price databases without redesigning the entire application.
Before we define the repository structure and write the implementation specifications, I would like to establish one important scope decision:
What should the first version cover?

Vehicles only — cars, motorcycles, trucks, fleet vehicles


Vehicles and machinery — also industrial equipment, agricultural machinery


All auction categories — electronics, equipment, property, vehicles, and more


Continue with architecture 
I would start with vehicles only, but design the database to support other categories later. Vehicle data has relatively consistent attributes, making it easier to build useful search, valuation, and comparison features before expanding the platform.


Let's plan the auction dashboard architecture with the initial scope: vehicles only. Define the MVP, data model, repository structure, and implementation milestones.

# Auction Intelligence Platform — Architecture & MVP Plan

Architecture proposal v0.1

We will build a vehicle auction intelligence platform that collects listings from multiple auction websites, maintains historical data, compares market prices, estimates acquisition costs, and ranks opportunities through an interactive web dashboard.

The first version will focus on Brazilian vehicle auctions, especially private fleet auctions, financial institution repossessions, and company-owned vehicles.

The architecture will be designed for a single user initially, but without preventing multi-user support later.

## 1. MVP definition

The MVP should answer five questions:

1. What vehicles are available? Search across multiple auction sources.
2. Where and when are they being auctioned? Filter by state, distance, date, and auctioneer.
3. What will they actually cost? Estimate commissions, taxes, transport, documentation, and repairs.
4. Are they good opportunities? Compare total estimated acquisition cost against reference market prices.
5. What happened in previous auctions? Preserve historical listings, observed bids, and final prices where available.

### MVP feature priorities

| Feature                             | MVP | Later |
| ----------------------------------- | --- | ----- |
| Auction and vehicle search          |     |       |
| Advanced filters                    |     |       |
| Interactive dashboard               |     |       |
| Automated collection from 2–3 sites |     |       |
| Historical lot snapshots            |     |       |
| FIPE reference prices               |     |       |
| Acquisition cost calculator         |     |       |
| Saved searches and favorites        |     |       |
| Regional market price modeling      |     |       |
| AI analysis of auction notices      |     |       |
| Automatic damage recognition        |     |       |
| Advanced price predictions          |     |       |
| Multi-user subscriptions            |     |       |

MVP success criterion: You can open the dashboard, find vehicles from at least two independently collected auction sources, filter them, inspect their historical data, and calculate a maximum sensible bid using an explainable cost model.

## 2. System architecture

I recommend a modular monolith rather than microservices.

This means the backend is one Python application with clearly separated modules. Scraping and background processing run in separate worker processes, but share the same application models and business rules.

React + TypeScript

Dashboard · Search · Filters · Charts · Cost calculator

FastAPI Backend

REST API · Authentication · Business logic · Search

PostgreSQL

PostGIS · Auction records · Price history

Object Storage

PDFs · Images · Raw evidence

Redis + Celery Workers

Task queues · Scheduling · Retries · Scraper execution

Scrapy

HTML sites

Playwright

JS-heavy sites

Data imports

FIPE · CSV · PDF

### Technical decisions

| Component    | Selection                        | Reason                                        |
| ------------ | -------------------------------- | --------------------------------------------- |
| API          | FastAPI + Pydantic               | Typed contracts, validation, OpenAPI          |
| ORM          | SQLAlchemy 2                     | Explicit relational models                    |
| Migrations   | Alembic                          | Versioned database changes                    |
| Database     | PostgreSQL + PostGIS             | Relational queries and geographical filtering |
| Search       | PostgreSQL full-text + `pg_trgm` | Sufficient for the MVP                        |
| Workers      | Celery + Redis                   | Asynchronous scraping and scheduled jobs      |
| Frontend     | React + Vite + TypeScript        | Simple SPA with strong tooling                |
| Server state | TanStack Query                   | Caching and API state                         |
| UI           | Tailwind + shadcn/ui             | Reusable dashboard components                 |
| Tables       | TanStack Table                   | Sorting, filtering, pagination                |
| Charts       | Apache ECharts                   | Historical price visualizations               |
| Tests        | pytest + Playwright              | Backend and browser-level testing             |

Use PostgreSQL for initial search rather than introducing Elasticsearch or OpenSearch immediately. We can add a dedicated search service if measured performance justifies it.

## 3. Data model

The most important modeling decision is to distinguish a vehicle, an auction lot, and an auction event.

A vehicle model such as a Ford Ka 2019 is not the same as a particular physical vehicle. A physical vehicle may appear in multiple auctions, and a lot may be relisted with a different identifier.

We should also distinguish observed information from inferred or estimated information.

### Core entities

| Entity                        | Key fields                                                                       | Purpose                               |
| ----------------------------- | -------------------------------------------------------------------------------- | ------------------------------------- |
| `auction_sources`             | id, name, domain, type, status                                                   | Auction websites and providers        |
| `auction_events`              | id, source_id, title, start_at, end_at, location, status                         | Auction sessions                      |
| `lots`                        | id, event_id, external_id, title, url, status, current_bid                       | Individual auction lots               |
| `vehicles`                    | id, make, model, trim, year_model, year_manufacture, mileage, fuel, transmission | Structured vehicle information        |
| `lot_vehicles`                | lot_id, vehicle_id, match_confidence                                             | Association between lots and vehicles |
| `lot_observations`            | lot_id, observed_at, bid, status, source_run_id                                  | Historical observations               |
| `auction_results`             | lot_id, hammer_price, result_status, observed_at                                 | Known final outcomes                  |
| `vehicle_reference_prices`    | make, model, trim, year, reference_month, value, provider                        | FIPE and other reference prices       |
| `regional_price_observations` | vehicle attributes, state, price, price_type, observed_at                        | Regional market evidence              |
| `fee_rules`                   | source_id, event_id, fee_type, amount, valid_from                                | Auction commission and other fees     |
| `cost_estimates`              | lot_id, transport, repairs, taxes, total, assumptions                            | Estimated acquisition costs           |
| `collection_runs`             | source_id, started_at, status, records_found, errors                             | Scraper monitoring                    |
| `watchlist_items`             | user_id, lot_id, created_at                                                      | Saved vehicles                        |

For the MVP, `lots` can enforce a unique key on `(event_id, external_id)`, provided the external identifier is stable. Otherwise, use a source-specific canonical identifier.

The `vehicles` table should support incomplete attributes and uncertain matching. Avoid treating an AI-extracted vehicle version as a verified fact.

### Historical data strategy

We should maintain three levels of data:

- Raw: Original HTML, JSON, PDFs, and source metadata.
- Normalized: Structured auctions, lots, and vehicles.
- Derived: Price estimates, cost calculations, opportunity scores, and classifications.

For every observation, store the retrieval timestamp, source URL, parser version, and processing status.

A `lot_observations` record might look like:

```

{
  "lot_id": "lot_739",
  "observed_at": "2026-10-15T14:00:00Z",
  "current_bid": 22500.00,
  "currency": "BRL",
  "status": "open",
  "source_run_id": "run_20261015_001",
  "parser_version": "freitas_v1.2",
  "raw_record_id": "raw_abc123"
}

```

For large-scale collection, we can store only changed snapshots plus periodic verification records to reduce database growth.

A lot's last observed bid is not necessarily its winning bid. We should only label a price as final when the auction source provides sufficient evidence.

## 4. Search and filtering system

The dashboard should support a single combined search endpoint:

`GET /api/v1/lots`

Example:

```

GET /api/v1/lots?
  make=Ford&
  model=Ka&
  year_min=2018&
  year_max=2021&
  state=SP&
  max_distance_km=300&
  max_total_cost=30000&
  auction_type=private,fleet,financial&
  sort=opportunity_score_desc

```

The backend will construct parameterized queries, calculate relevant distances with PostGIS, and return paginated results.

### Filter categories

Vehicle

Make, model, trim, year, mileage, fuel, transmission

Auction

Source, auction type, date, lot status, current bid

Geography

State, city, distance, pickup location

Financial

Estimated total cost, FIPE discount, fees, potential margin

Condition

Damage, running condition, documentation, restrictions

Historical

Past auction results, relistings, price trends

Filters should be encoded in the URL so searches can be bookmarked or shared. The frontend should debounce search inputs, while pagination, sorting, and financial filtering happen on the server.

For cost-dependent filters, precompute estimates under a clearly defined default scenario, rather than recalculating every possible cost combination inside each database query.

## 5. Financial analysis engine

The cost engine should be a standalone Python module, independent of scraping and frontend code.

Its basic model is:

\\[ C\_{\text{total}} = L + C\_{\text{auction}} + C\_{\text{tax}} + C\_{\text{transport}} + C\_{\text{docs}} + C\_{\text{repair}} + C\_{\text{other}} \\]

Where \\(L\\) is the winning bid or hypothetical bid.

For resale analysis:

\\[ P\_{\text{net}} = V\_{\text{resale}} - C\_{\text{total}} - C\_{\text{selling}} \\]

The engine should also support calculating a maximum bid for a target profit, using an iterative solver or a closed-form calculation when fee rules permit.

I would implement a rule-based fee system with separate components for percentage commissions, fixed fees, state-specific charges, transport estimates, and documentation costs.

Tax rules must be versioned and backed by their sources. When tax applicability cannot be determined, the engine should show an unresolved assumption rather than silently treating the tax as zero.

Each financial result should expose its inputs and a confidence/uncertainty breakdown. That matters especially when repair costs or regional market prices are based on incomplete evidence.

## 6. Repository structure

I recommend a monorepo, with the frontend, backend, scrapers, database migrations, and deployment configuration under a single Git repository.

```

auction-intelligence/
│
├── apps/
│   ├── api/                     # FastAPI application
│   │   ├── src/auction_api/
│   │   │   ├── main.py
│   │   │   ├── config.py
│   │   │   ├── routers/
│   │   │   ├── schemas/
│   │   │   └── dependencies.py
│   │   └── tests/
│   │
│   └── web/                     # React + TypeScript
│       ├── src/
│       │   ├── pages/
│       │   ├── components/
│       │   ├── features/
│       │   │   ├── auctions/
│       │   │   ├── vehicles/
│       │   │   ├── search/
│       │   │   ├── pricing/
│       │   │   └── dashboard/
│       │   ├── api/
│       │   └── hooks/
│       └── package.json
│
├── packages/
│   └── auction_core/            # Shared Python package
│       ├── domain/
│       │   ├── models/
│       │   └── enums/
│       ├── database/
│       │   ├── models/
│       │   └── repositories/
│       ├── ingestion/
│       │   ├── base.py
│       │   ├── normalization.py
│       │   └── deduplication.py
│       ├── scrapers/
│       │   ├── freitas/
│       │   └── second_source/
│       ├── pricing/
│       ├── costs/
│       ├── search/
│       └── tasks/
│
├── migrations/                  # Alembic migrations
├── tests/
│   ├── integration/
│   ├── fixtures/
│   └── e2e/
│
├── infra/
│   ├── docker/
│   └── compose.yaml
│
├── docs/
│   ├── architecture.md
│   ├── data-model.md
│   ├── api-contract.md
│   ├── scraper-contract.md
│   └── roadmap.md
│
├── scripts/
├── .env.example
├── pyproject.toml
├── README.md
└── Makefile

```

The shared `auction_core` package is particularly important. It should be installable independently and contain the business logic used by both the API and workers.

For example, you should be able to execute a scraper from the command line without starting the website.

## 7. API design

I would start with these endpoints.

| Endpoint                           | Purpose                        |
| ---------------------------------- | ------------------------------ |
| `GET /api/v1/auctions`             | List and filter auction events |
| `GET /api/v1/auctions/{id}`        | Auction details                |
| `GET /api/v1/lots`                 | Search and filter lots         |
| `GET /api/v1/lots/{id}`            | Lot details                    |
| `GET /api/v1/lots/{id}/history`    | Historical bid observations    |
| `GET /api/v1/vehicles/{id}/prices` | Market reference prices        |
| `POST /api/v1/cost-estimates`      | Calculate acquisition costs    |
| `GET /api/v1/sources`              | Available auction sources      |
| `GET /api/v1/sources/health`       | Collection status              |
| `GET /api/v1/dashboard/summary`    | Dashboard KPIs                 |
| `GET /api/v1/watchlist`            | Saved lots                     |

For the frontend, generate a typed TypeScript API client from FastAPI's OpenAPI schema. That avoids manually maintaining two separate definitions of the same API.

## 8. Implementation milestones

These are development estimates for a single developer working with AI coding assistance, assuming that source websites are reasonably accessible. They are not guaranteed delivery times.

## M1

3–5 days

Project foundation

Create the monorepo, Docker Compose, FastAPI, React, PostgreSQL, initial migrations, and automated tests.

Acceptance: one command starts the local stack; frontend and API communicate; database migrations run successfully.

## M2

5–8 days

Database and first scraper

Implement auction and lot models, the ingestion pipeline, one Freitas Leiloeiro scraper, source records, and snapshot storage.

Acceptance: data from the first source is stored, normalized, and can be recollected without duplicate lots.

## M3

5–8 days

Interactive dashboard

Implement search, filters, paginated results, vehicle details, source links, geographical queries, and responsive layouts.

Acceptance: users can search real collected lots by model, location, auction date, and price.

## M4

5–10 days

Pricing and cost analysis

Add FIPE reference data, the cost calculation engine, editable assumptions, financial filters, and opportunity ranking.

Acceptance: the dashboard produces an explainable cost estimate and target maximum bid for supported lots.

## M5

5–10 days

Automation and historical analysis

Integrate a second auction source, Celery scheduling, failure handling, collection health, historical charts, and saved searches.

Acceptance: two sources update automatically and historical observations remain accessible.

ESTIMATED MVP DEVELOPMENT EFFORT

# 23–41 developer-days

Approximately 5–9 full-time working weeks, excluding major scraping access problems, extensive historical data recovery, and production hardening.

## 9. Engineering rules from day one

These are the standards I would establish before writing the first scraper.

- Idempotent ingestion: Reprocessing the same auction must not generate duplicate records.
- Source traceability: Every imported field should be traceable to a source and observation.
- Explicit uncertainty: Unknown vehicle attributes, fees, and final sale prices must remain unknown rather than being guessed.
- Independent modules: Scrapers, financial analysis, and API logic must be independently testable.
- Database migrations: No manual schema changes outside version-controlled migrations.
- Respectful collection: Respect access controls, applicable terms, rate limits, and personal-data requirements. Do not assume that all published auction information can be freely republished.
- Monitoring: Track collection failures, stale data, parser errors, and changes in source structures.

For development, use synthetic fixtures and saved permitted sample pages. This lets you test normalization and parsing without repeatedly contacting live auction websites.

## 10. Immediate next steps

I suggest starting with a narrow vertical slice: one real auction source, one scraper, one database, one search endpoint, and one dashboard page.

That is more useful than implementing a dozen empty modules before seeing actual data flow through the system.

The first deliverables should be `architecture.md`, `data-model.md`, `scraper-contract.md`, `roadmap.md`, and a working Docker Compose environment.

Once that foundation is functional, add the second auction source to validate that the architecture is truly reusable.

One additional decision I recommend: Make the platform configurable by home location, initially using Campinas, SP as the default search origin. That allows distance-based filtering and transportation estimates without hardcoding the user's location into the system.

From there, we can turn this architecture into a Codex-ready implementation specification with small, independently testable tasks, so each development session has a clear scope and acceptance criteria.