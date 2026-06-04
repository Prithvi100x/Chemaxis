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

### Vercel

The root `vercel.json` deploys the React website and the `api/[...path].ts` serverless function together, so same-origin calls such as `/api/auth/register` work on `*.vercel.app`. If the Vercel project root is set to `artifacts/chemaxis`, the package-level `artifacts/chemaxis/api/[...path].ts` fallback provides the same API handler. Set `MONGODB_URI` and `JWT_SECRET` in Vercel before testing signup.

### Railway

The repository includes Railway/Nixpacks configuration. The deploy build compiles the React website first and then the API server. The API server serves the built website from `artifacts/chemaxis/dist/public` when those files are present and keeps API routes under `/api`.

Required environment variables:

- `PORT` — provided by most hosts automatically.
- `MONGODB_URI` — MongoDB connection string.
- `JWT_SECRET` — long random value for signing sessions.
- `NODE_ENV=production` — enables static website serving from the API process.
- `ALLOWED_ORIGINS` — comma-separated allowed origins for browser requests.
- `OPENAI_API_KEY` — optional, only needed for AI report generation.

If the website and API are deployed separately, set `VITE_API_URL` before building the website so client requests point to the API origin.

### Railway CI/CD

This repo includes `.github/workflows/deploy-railway.yml` and `scripts/deploy-railway.sh` so GitHub can deploy the app automatically. Add these repository settings before running the workflow:

- Secret `RAILWAY_TOKEN` — a Railway project token for the target environment.
- Optional variable `RAILWAY_PROJECT_ID` — Railway project id when the repo is not linked.
- Optional variable `RAILWAY_ENVIRONMENT` — target environment name or id, for example `production`.
- Optional variable `RAILWAY_SERVICE` — target service name or id if the Railway project has multiple services.

You can also deploy from a configured terminal with:

```bash
RAILWAY_TOKEN=... pnpm run deploy:railway
```
