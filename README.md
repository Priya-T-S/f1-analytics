# F1 Analytics

Formula 1 statistics from 1950 to today. The app is a React (Vite) frontend with an Express API on SQLite (Turso in production). Data updates itself after every race.

## Where the data comes from

| Source | What it gives us | Key needed? |
|---|---|---|
| [Jolpica-F1](https://github.com/jolpica/jolpica-f1) (Ergast successor) | Every season, race, result, lap time, pit stop and standings table since 1950 | No |
| [OpenF1](https://openf1.org) | Sector times, speed traps, tyre stints, weather and driver photos for 2023 onwards | No (historical data is free) |

- **First load:** `npm run sync:backfill` imports Jolpica's full database dump. It takes about 30 seconds locally.
- **After that:** a daily Vercel cron job calls `/api/cron/sync`. The job pulls any race that has finished and been published since the last run, including results, laps, pit stops and standings, and then adds the OpenF1 extras. Results appear within about a day of each race.

## Run locally

Requires Node.js 20 or newer.

```bash
# backend (http://localhost:5000)
cd backend
npm install
npm run sync:backfill      # creates backend/f1_analytics.db with the full history
npm run dev

# frontend (http://localhost:3000), in a second terminal
cd frontend
npm install
npm run dev
```

Other backend commands:

| Command | What it does |
|---|---|
| `npm run sync` | Pull any races finished since the last sync, i.e. what the cron runs |
| `npm run sync:openf1` | Add OpenF1 data to every 2023+ race. It's rate limited, so it takes about 15 minutes. Without it, the cron fills in 2 races a day. |
| `npm run db:migrate` | Create or upgrade the schema; safe to re-run |

## Deploy to Vercel (free)

1. **Create the database.** Sign up at [turso.tech](https://turso.tech), which is free, and create a database. Copy its URL (`libsql://...`) and create an auth token.
2. **Load the data into Turso** from your machine. Create `backend/.env` from `backend/.env.example`, fill in `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`, then run:
   ```bash
   cd backend
   npm run sync:backfill
   npm run sync:openf1      # optional, see above
   ```
3. **Deploy.** Push the repo to GitHub, then choose **Import Project** in Vercel with the repo root as the root directory. Add these environment variables:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `CRON_SECRET`: any long random string

   Then deploy. `vercel.json` sets up the build, the `/api` function and the daily cron job, which runs at 06:00 UTC.
4. **Check it.** Open `https://<your-app>.vercel.app/api/sync/status` to see when the data was last updated. The cron job is listed under **Settings → Cron Jobs** in Vercel.

API responses are cached at Vercel's edge for an hour. This keeps the site fast and well inside Turso's free read quota.
