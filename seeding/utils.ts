type Transform<T extends object> = {
  [K in keyof T]?: (v: T[K]) => unknown;
};

export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
  transform?: Transform<Pick<T, K>>,
): {
  [P in K]: typeof transform extends undefined
    ? T[P]
    : ReturnType<NonNullable<Transform<Pick<T, K>>[P]>> extends never
      ? T[P]
      : ReturnType<NonNullable<Transform<Pick<T, K>>[P]>>;
} {
  return keys.reduce((acc, key) => {
    const value = obj[key];
    (acc as any)[key] = transform?.[key]
      ? (transform[key] as any)(value)
      : value;
    return acc;
  }, {} as any);
}

function escapeSQL(val: any): string {
  if (val === null || val === undefined) return "NULL";

  if (typeof val === "number" || typeof val === "boolean") {
    return val.toString();
  }

  if (typeof val === "object") {
    val = JSON.stringify(val);
  }

  let str = String(val);
  str = str.replace(/\\/g, "\\\\").replace(/'/g, "''");

  return `'${str}'`;
}

export function bulkInsertSQL<T extends object>(
  table: string,
  rows: T[],
  columnMap: Record<keyof T, string>, // Make this required to act as a filter
): string {
  if (rows.length === 0) throw new Error(`No rows to insert into ${table}`);

  const keysToInclude = Object.keys(columnMap) as Array<keyof T>;
  const columns = keysToInclude.map((k) => columnMap[k]);

  const values = rows
    .map((row) => {
      return `(${keysToInclude.map((k) => escapeSQL(row[k])).join(", ")})`;
    })
    .join(",\n  ");

  return `INSERT IGNORE INTO ${table} (${columns.join(", ")}) VALUES\n  ${values};`;
}

export async function fetchAll<T>(
  url: string,
  maxPages = Infinity,
  shouldWait: boolean = false,
): Promise<T[]> {
  const results: T[] = [];
  let nextUrl: string | null = url;
  let pages = 0;
  let lastRequestNum = 0;
  let lastTimeoutDate = Date.now();

  while (nextUrl && pages < maxPages) {
    try {
      const res = await fetch(nextUrl);
      lastRequestNum++;
      const json = (await res.json()) as {
        data: T[];
        pagination?: { links?: { rel: string; uri: string }[] };
      };

      results.push(...json.data);
      nextUrl =
        json.pagination?.links?.find((l) => l.rel === "next")?.uri ?? null;
      pages++;
      console.log(
        `Fetched another set of data, yahoo! ${nextUrl} (now at ${results.length})`,
      );
      if (lastRequestNum >= 100 && Date.now() < lastTimeoutDate + 60000) {
        console.warn("Waiting a minute.");

        lastTimeoutDate = Date.now();
        lastRequestNum = 0;
        await Bun.sleep(60000);
      } else {
        console.log(`Last req: ${lastRequestNum}`);
      }
    } catch (e: Error) {
      console.warn("Request failed");
      console.error(e);

      console.log("Waiting ");
      await Bun.sleep(60000);
      continue;
    }
  }

  console.log("Saving to disk.");
  await Bun.write("./test.json", JSON.stringify(results));
  console.log("Saved");

  return results;
}

export async function fetchWithCache<T>(url: string): Promise<T> {
  const fileSafeURI = encodeURIComponent(url);
  const cacheFile = Bun.file(`./cache/${fileSafeURI}.json`);

  if (await cacheFile.exists()) return await cacheFile.json();

  const response = await fetch(url);

  if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

  const text = await response.text();

  Bun.write(cacheFile, text);

  return JSON.parse(text) as T;
}

export async function fetchWithRetry<T>(
  url: string,
  retryDelay = 300000,
  withCache: boolean = true,
): Promise<T | undefined> {
  try {
    const res = await (withCache
      ? fetchWithCache(url)
      : ((await (await fetch(url)).json()) as T));

    return res as T;
  } catch (e: Error) {
    console.warn(e);
    if (e.message.includes("404") || e.message.includes("500")) {
      console.warn("Result was 404");
      return undefined;
    }
    console.write(`\rRate limited on ${url}. Waiting ${retryDelay / 1000}s...`);
    let retryTimer = retryDelay;
    const notifyDelay = setInterval(() => {
      console.write(
        `\rRate limited on ${url}. Waiting ${retryTimer / 1000}s...`,
      );
      retryTimer -= 1000;
    }, 1000);
    await Bun.sleep(retryDelay);
    clearInterval(notifyDelay);
    return fetchWithRetry(url, retryDelay); // Replay request
  }
}

export async function fetchAllParallel<T>(
  baseUrl: string,
  maxPerPage = 200, // Speedrun.com max is 200
  limitPages = 1,
  withCache = true,
  batchSize = 10,
): Promise<T[]> {
  const fileSafeURI = encodeURIComponent(baseUrl);
  const cacheFile = Bun.file(`./cache/${fileSafeURI}.json`);

  if (withCache && (await cacheFile.exists())) return await cacheFile.json();

  const allResults: T[] = [];
  let reachedEnd = false;
  let currentOffset = 0;

  // We loop in batches of parallel requests
  while (!reachedEnd && currentOffset / maxPerPage < limitPages) {
    const offsets = Array.from(
      { length: batchSize },
      (_, i) => currentOffset + i * maxPerPage,
    );

    const batchResults = await Promise.all(
      offsets.map(async (offset) => {
        if (reachedEnd) return null;

        const separator = baseUrl.includes("?") ? "&" : "?";
        const url = `${baseUrl}${separator}max=${maxPerPage}&offset=${offset}`;

        const json = await fetchWithRetry<Pageable<T>>(url, 300000, false);

        if (!json) return;

        // Check if this is the last page
        if (!json.pagination || json.pagination.size < json.pagination.max) {
          reachedEnd = true;
        }

        return json.data;
      }),
    );

    // Filter out nulls (from late-firing promises) and flatten
    for (const data of batchResults) {
      if (data) allResults.push(...data);
    }

    currentOffset += batchSize * maxPerPage;

    console.log(
      `Fetching requests in parralel: ${allResults.length} items collected.`,
    );
  }

  if (withCache) await Bun.write(cacheFile, JSON.stringify(allResults));

  return allResults;
}

export function bulkInsertJunctionSQL<T>(
  table: string,
  col1: string,
  col2: string,
  pairs: [T, T][],
): string {
  if (pairs.length === 0) throw new Error(`No pairs to insert into ${table}`);
  const values = pairs.map(([a, b]) => `('${a}', '${b}')`).join(",\n  ");
  return `INSERT IGNORE INTO ${table} (${col1}, ${col2}) VALUES\n  ${values};`;
}
