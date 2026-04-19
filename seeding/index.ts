// TODO: This is quite ugly, fix it at some point, and allow for in-place seeding w/json caching, 

import { sql, SQL, type BunFile } from "bun";
import {
  pick,
  bulkInsertSQL,
  fetchAll,
  bulkInsertJunctionSQL,
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

existsOrCreate(Bun.file(`${seedsDirectory}/region.sql`), async () => {
  const res = await fetch("https://www.speedrun.com/api/v1/regions?limit=20");
  const regions = (await res.json()) as { data: Region[] };
  const rows = regions.data.map((r) => pick(r, ["id", "name"]));

  return bulkInsertSQL("Region", rows, {
    id: "Region_ID",
    name: "Region_Name",
  });
});

existsOrCreate(Bun.file(`${seedsDirectory}/platform.sql`), async () => {
  const platforms = await fetchAll<Platform>(
    "https://www.speedrun.com/api/v1/platforms?limit=50",
  );
  const rows = platforms.map((r) => pick(r, ["id", "name", "released"]));

  return bulkInsertSQL("Platform", rows, {
    id: "Platform_ID",
    name: "Platform_Name",
    released: "ReleaseDate",
  });
});

existsOrCreate(Bun.file(`${seedsDirectory}/game.sql`), async () => {
  const games = await fetchAll<Game>(
    "https://www.speedrun.com/api/v1/games?limit=50",
    8,
  );

  await existsOrCreate(Bun.file(`${seedsDirectory}/category.sql`), async () => {
    const allCategories: (Category & { game_id: string })[] = [];
    for (const game of games) {
      const categories = await fetchAll<Category>(
        `https://www.speedrun.com/api/v1/games/${game.id}/categories`,
        8,
      );
      const rows = categories.map(
        (r) =>
          pick({ ...r, game_id: game.id }, [
            "id",
            "name",
            "rules",
            "game_id",
          ]) as Category & { game_id: string },
      );
      allCategories.push(...rows);
      await Bun.sleep(300);
    }
    return bulkInsertSQL("Category", allCategories, {
      id: "Category_ID",
      name: "Name",
      rules: "Rule",
      game_id: "Game_ID",
    });
  });

  await existsOrCreate(
    Bun.file(`${seedsDirectory}/game_platform.sql`),
    async () => {
      const pairs = games.flatMap((game) =>
        (game.platforms ?? []).map((p) => [game.id, p] as [string, string]),
      );
      return bulkInsertJunctionSQL(
        "GamePlatform",
        "Game_ID",
        "Platform_ID",
        pairs,
      );
    },
  );

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

const tables = await conn`SHOW TABLES;`;

console.log(tables);

async function existsOrCreate(file: BunFile, writer: () => Promise<string>) {
  console.log("running");
  if (!(await file.exists())) {
    console.warn(`Creating seed: ${file.name}`);

    await Bun.write(file, await writer());
  } else {
    console.log(`Seed exists: ${file.name}`);
  }
}
