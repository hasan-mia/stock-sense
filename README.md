# Stock Sense

Inventory management app with a Next.js UI, Express API, MySQL database, and optional Redis-backed Gemini restock suggestions.

## Docker deployment

1. Copy `.env.example` to `.env` and set unique database passwords and a long random `JWT_SECRET`.
2. Set `NEXT_PUBLIC_API_URL` to the public API origin and `CORS_ORIGIN` to the public UI origin.
3. Build and start the services:

   ```bash
   docker compose up --build -d
   ```

   The API runs pending database migrations during startup. MySQL data, Redis data, and uploaded files use persistent Docker volumes. The UI is served on port `3001` and the API on port `3000` by default; change `UI_PORT` and `API_PORT` in `.env` if needed.

   Check service output with `docker compose logs -f api ui` and stop with `docker compose down`. `docker compose down -v` also deletes database, Redis, and upload data.

Demo seeders are disabled in production. Create production users through the registration/API process or a separate controlled admin workflow.

## Reset local database and demo data

Update `ADMIN_SEED_NAME`, `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD`, and optionally `STAFF_SEED_PASSWORD` in `api/.env`. To remove all existing database records and recreate the schema and demo data, run:

```bash
cd api
npm run db:reset
```

This is destructive: it drops all project tables and recreates them before seeding. Demo seed data is disabled in production.

## Project tree

```text
api/   Express API, Sequelize models, migrations and seeders
ui/    Next.js app
docker-compose.yml
```
