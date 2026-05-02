SELECT
    G.Game_Name AS Game,
    COUNT(DISTINCT U.User_ID) AS Unique_US_Players,
    ROUND(
            COUNT(DISTINCT U.User_ID) * 100.0 / (
                SELECT COUNT(DISTINCT User_ID)
                FROM User
                WHERE Country_ID = 'US'
            ), 2
    ) AS Player_Percentage
FROM Run R
         JOIN User U ON R.User_ID = U.User_ID
         JOIN Game G ON R.Game_ID = G.Game_ID
WHERE U.Country_ID = 'US'
GROUP BY G.Game_Name
ORDER BY Unique_US_Players DESC;
