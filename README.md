# RefuBridge

A Next.js app using TypeScript, Tailwind CSS, and the App Router.

## Getting Started

Install dependencies, configure the local database, migrate and seed it, then
start the development server:

```bash
npm install
cp .env.example .env
# Set ADMIN_PASSWORD (16+ characters) and ADMIN_SESSION_SECRET (32+ characters)
npm run db:migrate
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the public home page or
[http://localhost:3000/admin](http://localhost:3000/admin) to sign in to the
operations dashboard.

The default `.env.example` configures local SQLite with
`DATABASE_URL="file:./dev.db"`. Set `ADMIN_PASSWORD` to a password of at least
16 characters and `ADMIN_SESSION_SECRET` to a random secret of at least 32
characters (for example, generate one with `openssl rand -base64 32`).

## Vercel database and admin setup

The app uses SQLite locally and supports a persistent Turso/libSQL database in
production. In Turso, create a database and an authentication token, then set
these variables in the Vercel project's **Settings → Environment Variables**:

- `DATABASE_URL`: the Turso database URL (`libsql://...`)
- `DATABASE_AUTH_TOKEN`: the database authentication token
- `ADMIN_PASSWORD`: a unique password of at least 16 characters
- `ADMIN_SESSION_SECRET`: a randomly generated secret of at least 32 characters

Apply the SQL migration files to a new Turso database, in timestamp order, using
the Turso CLI before deploying:

```bash
DB_NAME=your-turso-database-name
turso db shell "$DB_NAME" < prisma/migrations/20261118181040_init/migration.sql
turso db shell "$DB_NAME" < prisma/migrations/20261118183600_distribution_fraud_support/migration.sql
```

The admin session is stored in a signed, HTTP-only, secure production cookie
that expires after 12 hours. The dashboard, its data/action APIs, fraud and
distribution actions, and allocation CSV exports all require that session.

## Scripts

- `npm run dev` starts the development server.
- `npm run build` creates a production build.
- `npm run start` serves the production build.
- `npm run lint` runs ESLint.
- `npm test` runs the distribution priority test.

## Backend

The backend uses Prisma with SQLite. SQLite enum-like values
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
