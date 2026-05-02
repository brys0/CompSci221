SELECT
    U.Username,
    T.Real_Millis / 1000.0 AS Seconds,
    P.Platform_Name AS Platform,
    GS.Emulated as isEmulated
FROM Run R
         JOIN User U ON R.User_ID = U.User_ID
         JOIN Game G ON R.Game_ID = G.Game_ID
         JOIN Time T ON R.Time_ID = T.Time_ID
         JOIN GameSystem GS ON R.System_ID = GS.System_ID
         JOIN Platform P ON GS.Platform_ID = P.Platform_ID
WHERE G.Game_Name = '007 Legends'
ORDER BY T.Real_Millis ASC
LIMIT 10;
