import { bulkInsertSQL, fetchWithCache, fetchWithRetry } from "./utils";

const sqlFile = Bun.file("./seeds/run.sql");
const sqlContent = await sqlFile.text();

// Extraction logic from before...
const valuesStart = sqlContent.indexOf("VALUES");
const allValues = sqlContent
  .substring(valuesStart + 6)
  .trim()
  .replace(/;$/, "");
const rows = allValues.split(/\),\s*\(/);
const uniqueUserIds = new Set<string>();

for (const row of rows) {
  const parts = row.replace(/^\(|\)$/g, "").split(",");
  const rawId = parts[5]?.trim()?.replace(/'/g, "");
  if (rawId && !rawId.startsWith("anon_")) uniqueUserIds.add(rawId);
}

const idArray = Array.from(uniqueUserIds);
const userRows = [];

// for (let i = 0; i < idArray.length; i += 10) {
//   const batch = idArray.slice(i, i + 10);
//   const results = await Promise.all(
//     batch.map(async (id) => {
//       try {
//         const json = await fetchWithRetry<any>(
//           `https://www.speedrun.com/api/v1/users/${id}`,
//         );
//         if (!json) return;

//         // console.log(`Got user data: ${json}`);
//         return {
//           id: id,
//           name: json.data.names.international,
//           country: json.data.location?.country?.code?.toUpperCase() || null,
//         };
//       } catch {
//         return { id, name: `User_${id}`, country: null };
//       }
//     }),
//   );
//   userRows.push(...results);

//   process.stdout.write(
//     `\rProgress: ${((userRows.length / idArray.length) * 100).toFixed(2)}%`,
//   );
//
for (let i = 0; i < idArray.length; i += 10) {
  const batch = idArray.slice(i, i + 10);
  const results = await Promise.all(
    batch.map(async (id) => {
      const url = `https://www.speedrun.com/api/v1/users/${id}`;
      const fileSafeURI = encodeURIComponent(url);
      const cacheFile = Bun.file(`./cache/${fileSafeURI}.json`);

      // 1. Check if we already have it
      if (await cacheFile.exists()) {
        try {
          const json = await cacheFile.json();
          return {
            id: id,
            name: json.data.names.international,
            country: json.data.location?.country?.code?.toUpperCase() || null,
          };
        } catch {
          return null;
        }
      }

      // 2. If NOT in cache, just skip it (Ignore the rest of the requests)
      return null;
    }),
  );

  // Filter out the nulls (the skipped users)
  userRows.push(
    ...results.filter((r): r is NonNullable<typeof r> => r !== null),
  );

  process.stdout.write(
    `\rProcessed from cache: ${userRows.length} users. Progress through list: ${((i / idArray.length) * 100).toFixed(2)}%`,
  );
}

const finalUsers = userRows.map((u, index) => ({
  User_ID: u.id,
  Username: u.name,
  Email: `user_${index}@mock.edu`,
  Password: "hashed_password_placeholder",
  Admin: 0,
  Country_ID: u.country, // Matches your new table!
}));

const userSql = bulkInsertSQL("User", finalUsers, {
  User_ID: "User_ID",
  Username: "Username",
  Email: "Email",
  Password: "Password",
  Admin: "Admin",
  Country_ID: "Country_ID",
});

await Bun.write("./seeds/user.sql", userSql);
