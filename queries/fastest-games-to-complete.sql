SELECT
    G.Game_Name AS Game,
    AVG(T.Real_Millis) / 1000.0 AS Avg_Seconds,       -- X-Axis (Converted to Hours)
    G.Game_Name AS Y_Axis_Game,                            -- Y-Axis (Game Name)
    COUNT(DISTINCT U.User_ID) AS Users_Complete       -- Bubble Size
FROM Run R
         JOIN Game G ON R.Game_ID = G.Game_ID
         JOIN User U ON R.User_ID = U.User_ID
         JOIN Time T ON R.Time_ID = T.Time_ID
GROUP BY G.Game_Name
ORDER BY Avg_Seconds
LIMIT 20; -- Limit to top 15 longest games to keep the chart readable
