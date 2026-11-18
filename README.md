# RefuBridge

A Next.js app using TypeScript, Tailwind CSS, and the App Router.

## Getting Started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The home page is in
`src/app/page.tsx`.

## Scripts

- `npm run dev` starts the development server.
- `npm run build` creates a production build.
- `npm run start` serves the production build.
- `npm run lint` runs ESLint.

## Backend

The backend uses Prisma with a local SQLite database. SQLite enum-like values
are constrained by `CHECK` clauses in the initial migration. Copy `.env.example`
to `.env` and apply the schema and sample data:

```bash
npm run db:migrate -- --name init
npm run seed
```

`npm run seed` is safe to rerun and adds fictional sample records, including
review flags for deliberately unusual records.

- `POST /api/donate` accepts `{ "name": "...", "email": "...", "amount": 25 }`
  and creates a pending donation in AED.
- `GET /api/stats` returns donation totals and counts for NGOs, refugees, and
  open needs.

The project is co-created by Aayan Patra and Aarav Pratap.
