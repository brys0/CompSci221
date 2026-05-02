SELECT
    G.Game_Name AS Game,
    COUNT(DISTINCT U.User_ID) AS US_Player_Count
FROM Game G
         JOIN Run R ON G.Game_ID = R.Game_ID
         JOIN User U ON R.User_ID = U.User_ID
WHERE U.Country_ID = 'US'
GROUP BY G.Game_ID, G.Game_Name
ORDER BY US_Player_Count DESC
LIMIT 10;
