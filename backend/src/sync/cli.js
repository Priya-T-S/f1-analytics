// Usage:
//   node src/sync/cli.js backfill [--dir <extracted dump folder>]   full history from the Jolpica dump
//   node src/sync/cli.js sync                                      pull new races (what the cron runs)
//   node src/sync/cli.js openf1                                    add OpenF1 data to every 2023+ race
const { migrate } = require('../db/migrate');
const db = require('../config/db');

async function main() {
  const [command, ...args] = process.argv.slice(2);
  console.log(`Database: ${db.isRemote ? 'Turso (remote)' : 'local file'}`);
  await migrate();

  if (command === 'backfill') {
    const dirIndex = args.indexOf('--dir');
    const { backfill } = require('./backfill');
    const summary = await backfill({ dir: dirIndex >= 0 ? args[dirIndex + 1] : undefined });
    console.log('Backfill complete:', summary);
    console.log('Pulling anything newer than the dump from the live API...');
    const { runIncremental } = require('./incremental');
    console.log(await runIncremental({ maxRaces: 50, timeBudgetMs: Infinity }));
  } else if (command === 'sync') {
    const { runIncremental } = require('./incremental');
    console.log(await runIncremental({ maxRaces: 50, timeBudgetMs: Infinity }));
  } else if (command === 'openf1') {
    const { enrichMissing } = require('./openf1');
    console.log('Fetching OpenF1 data (rate limited to ~28 requests/minute, so this takes a while)...');
    console.log(await enrichMissing());
  } else {
    console.log('Usage: node src/sync/cli.js <backfill|sync|openf1>');
    process.exitCode = 1;
  }
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
