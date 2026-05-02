WITH CountryGameCounts AS (
    SELECT
        U.Country_ID,
        G.Game_Name,
        COUNT(DISTINCT U.User_ID) AS Player_Count,
        ROW_NUMBER() OVER (PARTITION BY U.Country_ID ORDER BY COUNT(DISTINCT U.User_ID) DESC) as Rank_In_Country
    FROM User U
             JOIN Run R ON U.User_ID = R.User_ID
             JOIN Game G ON R.Game_ID = G.Game_ID
    WHERE U.Country_ID IS NOT NULL
    GROUP BY U.Country_ID, G.Game_Name
)
SELECT
    Country_ID,
    Game_Name AS Top_Game,
    Player_Count
FROM CountryGameCounts
WHERE Rank_In_Country = 1
ORDER BY Player_Count DESC
LIMIT 20;
