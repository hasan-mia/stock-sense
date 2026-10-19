# Stock Sense API

Express API for the Stock Sense inventory app. It uses Sequelize with MySQL. Redis and Gemini optionally provide prioritized restock suggestions.

## Project tree

```text
api/
├── src/
│   ├── config/       Database, Redis and Socket.IO setup
│   ├── controllers/  HTTP handlers
│   ├── middleware/   Auth, roles, validation and uploads
│   ├── migrations/   Database schema changes
│   ├── models/       Sequelize models and relations
│   ├── routes/       API routes
│   ├── seeders/      Local demo data
│   ├── services/     Business logic
│   └── utils/        Shared helpers and demo fixtures
├── .env.example
└── package.json
```

## Local setup

Use Node.js 20+, npm, and a running MySQL database. From this directory:

```bash
npm install
cp .env.example .env
```

Set the MySQL credentials and a private `JWT_SECRET` in `.env`, then run:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

The API starts on port `3000`. Demo seed data is disabled when `NODE_ENV=production`. `ADMIN_SEED_*` configures the admin account; `STAFF_SEED_PASSWORD` optionally enables the seeded staff accounts.

## Basics

- API prefix: `/api/v1`
- Health: `GET /api/v1/health`
- Protected routes use `Authorization: Bearer <token>`.
- Staff can manage their own sales. Admin-only catalog, stock adjustment, and user operations are enforced by the API.
- Completing a sale deducts inventory and writes stock movement records in a database transaction.
- Forecasts use completed sale history and moving averages; Gemini/Redis can return optional restock priorities, quantities, and explanations.

See `.env.example` for the supported settings. Do not commit `.env` or share its credentials.
