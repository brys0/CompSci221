// TODO: This is quite ugly, fix it at some point, and allow for in-place seeding w/json caching,

import { sql, SQL, type BunFile } from "bun";
import {
  pick,
  bulkInsertSQL,
  fetchAll,
  bulkInsertJunctionSQL,
  fetchAllParallel,
  fetchWithRetry,
  fetchWithCache,
} from "./utils.ts";

/**
 * We aren't directly bulk inserting to the database, only generating seeds for db.
 */

// const {
//   MYSQL_DATABASE_HOST,
//   MYSQL_DATABASE_USER,
//   MYSQL_DATABASE_USER_PASSWORD,
// } = process.env;

// function validateEnvironment(): boolean {
//   let shouldExit = false;
//   if (!MYSQL_DATABASE_HOST) {
//     console.error("You must have a MYSQL_DATABASE_HOST defined.");
//     shouldExit = true;
//   }

//   if (!MYSQL_DATABASE_USER) {
//     console.error("You must have a MYSQL_DATABASE_USER defined.");
//     shouldExit = true;
//   }

//   if (!MYSQL_DATABASE_USER_PASSWORD) {
//     console.error("You must have a MYSQL_DATABASE_USER_PASSWORD defined.");
//     shouldExit = true;
//   }

//   return !shouldExit;
// }

// if (!validateEnvironment()) {
//   process.exit(1);
// }

// const conn = new SQL(
//   `mysql://${MYSQL_DATABASE_USER}:${MYSQL_DATABASE_USER_PASSWORD}@${MYSQL_DATABASE_HOST}/db`,
// );
const seedsDirectory = `${import.meta.dirname}/seeds`;

const games = await fetchAllParallel<Game>(
  "https://www.speedrun.com/api/v1/games?max=200",
  200,
  500,
);

existsOrCreate(Bun.file(`${seedsDirectory}/game.sql`), async () => {
  const rows = games.map((g) =>
    pick(g, ["id", "names", "released", "weblink"], {
      names: (names) => names.international,
    }),
  );
  return bulkInsertSQL("Game", rows, {
    id: "Game_ID",
    names: "Game_Name",
    released: "ReleaseDate",
    weblink: "URL",
  });
});

const categories = [] as (Category & { game_id: string })[];
let startTime = Date.now();
let completed = 0;

for (const game of games) {
  const elapsed = Date.now() - startTime;
  const rate = completed / elapsed;
  const remaining = games.length - completed;
  const eta = remaining / rate;
  const etaMin = eta / 60000;
  console.write(
    `\rFetching categories... ${((games.indexOf(game) / (games.length - 1)) * 100).toFixed(3)}% ETA: ${etaMin.toFixed(2)}m`,
  );
  const category = await fetchWithRetry<Pageable<Category> & Category[]>(
    `https://www.speedrun.com/api/v1/games/${game.id}/categories`,
  );
  if (!category) continue;

  for (const c of category.data ? category.data : category) {
    categories.push({ ...c, game_id: game.id });
  }

  completed++;
}

await existsOrCreate(Bun.file(`${seedsDirectory}/category.sql`), async () => {
  return bulkInsertSQL("Category", categories, {
    id: "Category_ID",
    name: "Name",
    rules: "Rule",
    game_id: "Game_ID",
  });
});

const allRuns: {
  id: string;
  game_id: string;
  time_id: string;
  category_id: string;
  system_id: string;
  user_id: string;
}[] = [];

const times: {
  id: string;
  real_millis: number;
  in_game_millis: number | null;
  real_millis_noload: number | null;
}[] = [];

const systems: {
  id: string;
  platform_id: string | null;
  region_id: string | null;
  emulated: boolean;
}[] = [];

const catergoriesPerGame = categories.filter((c) => c.type == "per-game");

// Helper to split array into chunks
const chunk = <T>(arr: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size),
  );

const CHUNK_SIZE = 10; // Fire 10 requests at once
const gameChunks = chunk(games, CHUNK_SIZE);
let processedCount = 0;

for (const batch of gameChunks) {
  // Process the current batch of 10 games in parallel
  await Promise.all(
    batch.map(async (game) => {
      const categoryForGame = catergoriesPerGame.find(
        (c) => c.game_id == game.id,
      );

      if (!categoryForGame) return;

      const leaderboardList = await fetchWithRetry<any>(
        `https://www.speedrun.com/api/v1/leaderboards/${game.id}/category/${categoryForGame.id}?top=50`,
      );

      if (!leaderboardList?.data?.runs) return;

      for (const { run } of leaderboardList.data.runs) {
        const timeId = `t_${run.id}`.substring(0, 10);
        const systemId = `s_${run.id}`.substring(0, 10);
        const userId = run.players[0]?.id ?? `anon_${run.id}`.substring(0, 15);

        // Push directly to your arrays (JS arrays are thread-safe in this context)
        times.push({
          id: timeId,
          real_millis: run.times.realtime_t * 1000,
          in_game_millis: run.times.ingame_t ? run.times.ingame_t * 1000 : null,
          real_millis_noload: run.times.realtime_noloads_t
            ? run.times.realtime_noloads_t * 1000
            : null,
        });

        systems.push({
          id: systemId,
          platform_id: run.system.platform,
          region_id: run.system.region,
          emulated: run.system.emulated,
        });

        allRuns.push({
          id: run.id,
          game_id: game.id,
          time_id: timeId,
          category_id: categoryForGame.id,
          system_id: systemId,
          user_id: userId,
        });
      }
    }),
  );

  processedCount += batch.length;

  if (processedCount % 50 === 0) {
    process.stdout.write(
      `\r🚀 Progress: ${((processedCount / games.length) * 100).toFixed(2)}%`,
    );
  }
}
// for (const game of games) {
//   const categoryForGame = categories.find(
//     (c) => c.game_id === game.id && c.type === "per-game",
//   );

//   if (categoryForGame == null) {
//     console.log(`Category for game ${game.names.international} was invalid`);
//     continue;
//   }
//   // console.log(categoryForGame);
//   console.write(
//     `\rFetching leaderboards... (${((games.indexOf(game) / (games.length - 1)) * 100).toFixed(3)}% complete)`,
//   );

//   const leaderboardList = await fetchWithRetry<any>(
//     `https://www.speedrun.com/api/v1/leaderboards/${game.id}/category/${categoryForGame?.id}?top=50`,
//   );

//   if (!leaderboardList || !leaderboardList.data || !leaderboardList.data.runs) {
//     console.warn(`No runs found for ${game.id}/${categoryForGame?.id}`);
//     // Log the keys to see what the API actually sent back
//     console.log(
//       "Available keys in data:",
//       Object.keys(leaderboardList?.data || {}),
//     );
//     continue;
//   }

//   for (const { run } of leaderboardList.data.runs) {
//     const timeId = `t_${run.id}`.substring(0, 10);
//     const systemId = `s_${run.id}`.substring(0, 10);

//     // Speedrun.com uses players[0].id for users, but it might be missing for guests
//     const userId = run.players[0]?.id ?? `anon_${run.id}`.substring(0, 15);

//     times.push({
//       id: timeId,
//       // NOTE: The API uses _t for the numeric seconds/milliseconds value
//       real_millis: run.times.realtime_t * 1000,
//       in_game_millis: run.times.ingame_t ? run.times.ingame_t * 1000 : null,
//       real_millis_noload: run.times.realtime_noloads_t
//         ? run.times.realtime_noloads_t * 1000
//         : null,
//     });

//     systems.push({
//       id: systemId,
//       platform_id: run.system.platform,
//       region_id: run.system.region,
//       emulated: run.system.emulated,
//     });

//     allRuns.push({
//       id: run.id,
//       game_id: game.id,
//       time_id: timeId,
//       category_id: categoryForGame?.id ?? "unknown",
//       system_id: systemId,
//       user_id: userId,
//     });
//   }
// }

existsOrCreate(Bun.file(`${seedsDirectory}/time.sql`), async () => {
  return bulkInsertSQL("Time", times, {
    id: "Time_ID",
    real_millis: "Real_Millis",
    in_game_millis: "In_game_Millis",
    real_millis_noload: "Real_Millis_NoLoad",
  });
});

existsOrCreate(Bun.file(`${seedsDirectory}/gamesystem.sql`), async () => {
  return bulkInsertSQL("GameSystem", systems, {
    id: "System_ID",
    platform_id: "Platform_ID",
    region_id: "Region_ID",
    emulated: "Emulated",
  });
});

existsOrCreate(Bun.file(`${seedsDirectory}/run.sql`), async () => {
  return bulkInsertSQL("Run", allRuns, {
    id: "Run_ID",
    game_id: "Game_ID",
    time_id: "Time_ID",
    category_id: "Category_ID",
    system_id: "System_ID",
    user_id: "User_ID",
  });
});

async function existsOrCreate(file: BunFile, writer: () => Promise<string>) {
  console.log("running");
  if (!(await file.exists())) {
    console.warn(`Creating seed: ${file.name}`);

    await Bun.write(file, await writer());
  } else {
    console.log(`Seed exists: ${file.name}`);
  }
}
