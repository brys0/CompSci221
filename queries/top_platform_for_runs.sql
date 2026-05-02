SELECT
    P.Platform_Name,
    COUNT(R.Run_ID) AS Total_Runs,
    COUNT(DISTINCT R.Game_ID) AS Unique_Games_Supported
FROM Platform P
         JOIN GameSystem GS ON P.Platform_ID = GS.Platform_ID
         JOIN Run R ON GS.System_ID = R.System_ID
GROUP BY P.Platform_Name
ORDER BY Total_Runs DESC;
