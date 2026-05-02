SELECT
    COALESCE(C.Name, 'UNKNOWN (' || U.Country_ID || ')') AS Country,
    COUNT(DISTINCT U.User_ID) AS Total_Runners,
    COUNT(R.Run_ID) AS Total_Runs,
    ROUND(CAST(COUNT(R.Run_ID) AS FLOAT) / NULLIF(COUNT(DISTINCT U.User_ID), 0), 2) AS Runs_Per_Runner
FROM Run R
         JOIN User U ON R.User_ID = U.User_ID
         LEFT JOIN Country C ON U.Country_ID = C.Country_ID -- Changed to LEFT JOIN
GROUP BY C.Name, U.Country_ID
ORDER BY Total_Runs DESC;
