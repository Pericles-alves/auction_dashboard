# AuctionHub Brasil — implementation plan

## Product and initial scope

Private Brazilian vehicle-auction intelligence dashboard, initially for one user.
Search lots, inspect observation history, compare reference values, and calculate
acquisition costs and a maximum bid. Vehicles only; subscriptions, machinery,
AI damage recognition, and advanced predictions are deferred.

The supplied PNG is the visual reference. Interface: pt-BR; currency: BRL.
All prototype records are synthetic. Never label them live auctions, current
FIPE prices, confirmed sales, verified tax rules, or collected source evidence.
Original planning discussion: docs/original-planning-notes.md.

## Delivery strategy

Deliver working vertical slices. The first local prototype uses browser-native
modules and a dependency-free Node server so it can run in the current environment.
This interim interface does not replace the target React/TypeScript + FastAPI +
PostgreSQL stack. Keep this initial work local; no live collection or publishing.

## M0 — Local interactive prototype (implemented; browser QA pending)

- Responsive dashboard based on the supplied navy/light visual reference.
- Six clearly labeled synthetic lots and illustrative bid observations.
- Search, state/source filters, bid limit, sorting, URL-persisted filters.
- Lot details and browser-local favorites with a dedicated filter.
- Editable acquisition calculator and inverse maximum-bid calculation.
- Independent financial functions, automated tests, and startup documentation.

Acceptance: npm start serves the dashboard without installing dependencies;
npm test verifies arithmetic, target ROI, infeasible bids, and invalid input.
A real browser interaction pass is still required before treating UI QA as complete.

## M1 — Persistent application foundation (next)

- [ ] Provision a supported Python runtime and scaffold FastAPI + React/TypeScript.
- [ ] Add PostgreSQL, SQLAlchemy 2, Alembic, and Docker Compose.
- [ ] Port prototype UI behavior to React components.
- [ ] Implement paginated GET /api/v1/lots, lot details/history, sources,
  dashboard summary, and POST /api/v1/cost-estimates.
- [ ] Generate frontend API types from OpenAPI; validate all request parameters.
- [ ] Seed explicitly synthetic fixtures and test migrations and API integration.

Acceptance: one command starts UI/API/database; migrations work on an empty DB;
UI uses the API; filtering, sorting, and pagination execute server-side.
Bind local services to loopback until authentication and access controls exist.

## M2 — First verified source and durable history

- [ ] Select an auctioneer after confirming permitted access and representative pages.
- [ ] Define parser contracts and saved-page fixtures before live requests.
- [ ] Persist sources, events, lots, vehicles, collection runs, raw evidence,
  append-only observations, and separately verified auction outcomes.
- [ ] Idempotent ingestion using source canonical identifiers; retries and errors.

Acceptance: reingestion creates no duplicate lots, preserves older observations,
and records source URL, retrieval timestamp, parser version, and collection run.
An observed bid is never silently treated as a confirmed winning bid.

## M3 — Valuation and financial analysis

- [ ] Integrate a documented FIPE provider with provenance and reference month.
- [ ] Separate national reference values from regional asking and transaction prices.
- [ ] Port financial logic to Python Decimal; persist scenarios and user overrides.
- [ ] Version fee/tax rules by source, jurisdiction, effective date, and evidence.
- [ ] Add financial filters using an explicitly named default scenario.
- [ ] Add PostGIS distance filters with configurable origin and known coordinates.

Acceptance: every cost is explainable; missing evidence remains unknown. Manual
percentage inputs remain scenario assumptions, not legal determinations.

## M4 — Automation, second source, and protected access

- [ ] Add a second independent source to validate reusable ingestion.
- [ ] Introduce Celery/Redis scheduling after manual collection works.
- [ ] Add collection freshness/health, historical charts, saved searches,
  database-backed favorites, authentication, and authorization.

Acceptance: two sources refresh with visible health; history survives failures;
protected data cannot be read by another user. Review deployment separately.

## Architecture and data rules

Use a modular Python monolith with independent API, ingestion, pricing, costs,
search, and worker modules. PostgreSQL handles initial search; avoid premature
microservices and Elasticsearch. Store monetary values as numeric/Decimal and
observation timestamps with timezone.

Core relations: auction_sources -> auction_events -> lots; vehicles linked by
lot_vehicles; append-only lot_observations; auction_results for verified outcomes;
collection_runs and raw artifacts for provenance. Reference prices, regional
observations, fee rules, cost scenarios, and watchlists remain separate entities.
A physical vehicle may appear in multiple lots; uncertain identity stays uncertain.

Cost model (percentage inputs converted to rates):

    total = bid * (1 + commission + manual_tax) + fixed_costs
    profit = resale - total - selling_costs
    ROI = profit / total
    max_bid = ((resale - selling_costs) / (1 + target_ROI) - fixed_costs)
              / (1 + commission + manual_tax)

Return no feasible bid if fixed costs exceed the allowed total. ROI is undefined
when acquisition cost is zero. Tax is applied to bid only in this manual prototype.
Gross projections exclude income tax, financing, and unknown future expenses.

## Next session

Complete M1 with the prototype as the behavioral reference. Retain fixture mode
for development; replace sample metrics only when backed by persisted evidence.

## Initial implementation validation

- Financial tests: 5 passed (`npm test`).
- JavaScript syntax checks passed for the app and local server.
- Local HTTP checks: dashboard, app module, and stylesheet returned 200.
- Interactive browser QA remains pending; live data and persistence are future work.
