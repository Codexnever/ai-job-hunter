# AI Job Hunter

A starter Next.js dashboard that discovers jobs with Exa and saves them in Appwrite. It includes keyword-based match estimates, duplicate skipping, and application-status tracking.

## 1. Prerequisites

- Node.js 20+ and npm
- Exa API key
- Appwrite project and server API key
- GitHub + Vercel account for deployment (optional)

## 2. Create the app

```bash
npm install
```

Copy `.env.example` to `.env.local`, then fill in the values. Never commit `.env.local` or expose the Appwrite API key in a `NEXT_PUBLIC_` variable.

Generate a strong `CRON_SECRET` locally. Example:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 3. Configure Appwrite

In the Appwrite Console:
1. Create a project.
2. Create a database with ID `jobhunter` (or use your own ID and update `.env.local`).
3. Create a collection with ID `jobs` (or use your own ID and update `.env.local`).
4. Create these attributes. Make sure IDs match exactly:

| Attribute ID | Type | Size / options |
|---|---|---|
| `title` | string | 250 |
| `company` | string | 100 |
| `url` | string | 1500 |
| `location` | string | 100 |
| `description` | string | 1800 |
| `source` | string | 50 |
| `score` | integer | — |
| `status` | string | 20 |
| `discoveredAt` | datetime | — |
| `query` | string | 500 |

Set the collection document security OFF and grant the server API key the required database/collection document permissions. This starter accesses Appwrite only from the server. Do not grant public client access.

**Important:** Attribute sizes and database settings can vary by Appwrite database type/version. If the console requires indexes, add an index for `discoveredAt` (descending) before using the dashboard.

Create a server API key with the database and collection document read/create/update scopes required by your Appwrite version.

## 4. Run locally

```bash
npm run dev
```

Open http://localhost:3000. Click **Discover jobs** and enter the same `CRON_SECRET` you configured in `.env.local`.

## 5. Deploy and schedule

1. Push the project to a private GitHub repository.
2. Import it into Vercel.
3. Add every `.env.local` variable to Vercel Project Settings → Environment Variables.
4. Deploy.

The included `vercel.json` schedules discovery at 03:00 UTC daily (08:30 AM India time). Cron availability depends on your Vercel plan; check your current plan limits. Vercel Cron sends a GET request by default, while this starter's discover endpoint currently uses POST and Bearer auth. For scheduled production use, change the route to accept Vercel Cron's GET request and validate `CRON_SECRET` from the `Authorization: Bearer ...` header. Do not expose the secret in a URL. Verify cron behavior against current Vercel documentation before enabling it.

## Current limitations

- Results are web search results, not guaranteed open vacancies.
- Scores are transparent keyword heuristics, not LLM-based resume matching.
- Search result descriptions are highlights, not necessarily the full job description.
- No automatic application submission.
- Manual discovery currently asks for the secret each time. For a private production app, add authentication rather than keeping the secret prompt.
- Search runs one Exa request per configured query, so monitor your Exa credits.

## Next improvements

1. Add authentication to protect the dashboard.
2. Add a private resume profile and role/location preferences.
3. Add official job-page verification and expired-job detection.
4. Add optional Claude/OpenAI API-based structured resume matching.
5. Add email/Telegram daily digest and properly secured scheduled runs.
