import { bulkInsertSQL } from "./utils";

async function seedAllCountries() {
  console.log("Fetching global country data...");

  try {
    // Fetching all countries with only the fields we need
    const response = await fetch(
      "https://restcountries.com/v3.1/all?fields=cca2,name,languages",
    );
    const countriesJson = await response.json();

    const countryRows = countriesJson.map((c: any) => {
      // Get the primary language name (e.g., "English")
      const langNames = c.languages ? Object.values(c.languages) : ["Unknown"];

      return {
        Country_ID: c.cca2, // Standard 2-letter code (e.g., 'US', 'GB')
        Name: c.name.common,
        Language: langNames[0], // Take the first listed official language
      };
    });

    // Sort alphabetically by name for a clean SQL file
    countryRows.sort((a, b) => a.Name.localeCompare(b.Name));

    const countrySql = bulkInsertSQL("Country", countryRows, {
      Country_ID: "Country_ID",
      Name: "Name",
      Language: "Language",
    });

    await Bun.write("./seeds/country.sql", countrySql);
    console.log(
      `✅ Success! Generated seeds for ${countryRows.length} countries.`,
    );
  } catch (error) {
    console.error("Failed to fetch country data:", error);
  }
}

seedAllCountries();
