# RefuBridge

A Next.js app using TypeScript, Tailwind CSS, and the App Router.

## Getting Started

Install dependencies, configure the local database, migrate and seed it, then
start the development server:

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the public home page or
[http://localhost:3000/admin](http://localhost:3000/admin) for the public
operations dashboard. The dashboard is intentionally accessible without a
password for local demos.

The default `.env.example` configures SQLite with `DATABASE_URL="file:./dev.db"`.
Set `DATABASE_URL` in `.env` to use a different local database location.

## Scripts

- `npm run dev` starts the development server.
- `npm run build` creates a production build.
- `npm run start` serves the production build.
- `npm run lint` runs ESLint.
- `npm test` runs the distribution priority test.

## Backend

The backend uses Prisma with a local SQLite database. SQLite enum-like values
are constrained by `CHECK` clauses in the initial migration.

`npm run seed` is safe to rerun and adds fictional sample records, including
review flags for deliberately unusual records.

- `POST /api/donate` accepts `{ "name": "...", "email": "...", "amount": 25 }`
  and creates a pending donation in AED.
- `GET /api/stats` returns donation totals and counts for NGOs, refugees, and
  open needs.
- `GET /api/admin/dashboard` returns dashboard metrics, chart data, and
  paginated-table source records. `POST /api/admin/simulate` adds a fictional
  demo donation. The dashboard's presentation-pool refresh replaces pending
  donations with 25 fictional contributions totaling AED 25,000.
- The admin dashboard polls its data every five seconds while the browser tab
  is visible. Its distribution and fraud-scan controls call the endpoints
  below.
- `POST /api/distribute` pools pending donations and funds open needs by an
  explainable urgency score (category weight divided by days of stock plus
  one), with lower-cost needs as a tie-breaker. It allows partial funding and
  returns funding order and scores grouped by NGO.
- `GET /api/distribution/{runId}/ngo/{ngoId}/csv` exports that NGO's
  allocations for a distribution run.
- `POST /api/fraud/scan` creates non-duplicate flags for unverified NGOs with
  allocations, duplicate refugee IDs, NGOs with over twice the average needs
  per refugee, needs without a positive cost, and unspent allocations older
  than seven days.

The project is co-created by Aayan Patra and Aarav Pratap.
