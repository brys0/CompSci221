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

function escapeSQL(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

export function bulkInsertSQL<T extends object>(
  table: string,
  rows: T[],
  columnMap?: Partial<Record<keyof T, string>>,
): string {
  if (rows.length === 0) throw new Error(`No rows to insert into ${table}`);
  const first = rows[0]!;
  const columns = Object.keys(first).map((k) => columnMap?.[k as keyof T] ?? k);
  const values = rows
    .map((row) => `(${Object.values(row).map(escapeSQL).join(", ")})`)
    .join(",\n  ");
  return `INSERT IGNORE INTO ${table} (${columns.join(", ")}) VALUES\n  ${values};`;
}

export async function fetchAll<T>(
  url: string,
  maxPages = Infinity,
): Promise<T[]> {
  const results: T[] = [];
  let nextUrl: string | null = url;
  let pages = 0;

  while (nextUrl && pages < maxPages) {
    const res = await fetch(nextUrl);
    const json = (await res.json()) as {
      data: T[];
      pagination?: { links?: { rel: string; uri: string }[] };
    };
    results.push(...json.data);
    nextUrl =
      json.pagination?.links?.find((l) => l.rel === "next")?.uri ?? null;
    pages++;
  }

  return results;
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
