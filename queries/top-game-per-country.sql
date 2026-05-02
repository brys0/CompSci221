WITH CountryGameCounts AS (
    SELECT
        C.Name AS CountryName,
        G.Name AS GameName,
        COUNT(R.Run_ID) AS RunCount,
        RANK() OVER (PARTITION BY C.Name ORDER BY COUNT(R.Run_ID) DESC) as `Rank` -- Backticks are the key!
    FROM Run R
    JOIN User U ON R.User_ID = U.User_ID
    JOIN Country C ON U.Country_ID = C.Country_ID
    JOIN Game G ON R.Game_ID = G.Game_ID
    GROUP BY C.Name, G.Name
)
SELECT CountryName, GameName, RunCount
FROM CountryGameCounts
WHERE `Rank` = 1;
