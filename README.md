# ChemAxis

ChemAxis is a TypeScript monorepo for a chemical market intelligence website. It includes:

- `artifacts/chemaxis` — React/Vite website.
- `artifacts/api-server` — Express API server.
- `lib/db` — MongoDB/Mongoose data layer.
- `lib/api-client-react` and `lib/api-zod` — generated API client/types.

## Local development

```bash
corepack enable
corepack prepare pnpm@10 --activate
pnpm install --frozen-lockfile
cp .env.example .env
```

Start the API and website in separate terminals:

```bash
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/chemaxis run dev
```

## Quality checks

```bash
pnpm run typecheck
pnpm run build
```

## Deployment

The repository includes Railway/Nixpacks configuration. The deploy build compiles the React website first and then the API server. In production, the API server serves the built website from `artifacts/chemaxis/dist/public` and keeps API routes under `/api`.

Required environment variables:

- `PORT` — provided by most hosts automatically.
- `MONGODB_URI` — MongoDB connection string.
- `JWT_SECRET` — long random value for signing sessions.
- `NODE_ENV=production` — enables static website serving from the API process.
- `ALLOWED_ORIGINS` — comma-separated allowed origins for browser requests.
- `OPENAI_API_KEY` — optional, only needed for AI report generation.

If the website and API are deployed separately, set `VITE_API_URL` before building the website so client requests point to the API origin.
