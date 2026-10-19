# Stock Sense UI

Next.js frontend for the Stock Sense inventory and sales app.

## Project tree

```text
ui/
└── src/
    ├── app/          Pages and layouts
    ├── components/   Shared UI and dashboard navigation
    ├── config/       Site and navigation settings
    ├── features/     Auth, dashboard, inventory, sales and users
    └── lib/          API client and shared utilities
```

## Local setup

Use Node.js 20+ and npm. Start the API first, then from this directory run:

```bash
npm install
cp .env.example .env.local
npm run dev
```

The UI runs on port `3001`. Set `NEXT_PUBLIC_API_URL` to the API origin (default `http://localhost:3000`).

## Main pages

- `/login`, `/register`
- `/dashboard` overview
- `/dashboard/products`, `/categories`, `/suppliers`
- `/dashboard/sales`, `/stock-movements`, `/forecast`
- `/dashboard/users` (admin)

The UI stores the signed-in session and calls the API under `/api/v1`. The API remains responsible for authentication and role enforcement.
