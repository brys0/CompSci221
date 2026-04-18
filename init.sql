CREATE TABLE User(
    User_ID VARCHAR(15) PRIMARY KEY NOT NULL UNIQUE,
    Username VARCHAR(25) NOT NULL UNIQUE,
    Email VARCHAR(30) NOT NULL UNIQUE,
    Password VARCHAR(40) NOT NULL,
    Admin Boolean DEFAULT False,
    Region_ID VARCHAR(10)
);

CREATE TABLE Region(
    Region_ID VARCHAR(10) PRIMARY KEY NOT NULL UNIQUE,
    Region_Name VARCHAR(30) NOT NULL UNIQUE,
    Region_Language VARCHAR(30) NOT NULL
);

CREATE TABLE Game(
    Game_ID VARCHAR(25) PRIMARY KEY NOT NULL UNIQUE,
    Game_Name VARCHAR(25) NOT NULL,
    ReleaseDate DATE,
    URL VARCHAR(50)
);

CREATE TABLE Game_Platform(
    Game_ID VARCHAR(10) PRIMARY KEY NOT NULL UNIQUE,
    FOREIGN KEY (Platform_ID) REFERENCES Platform(Platform_ID)
);

CREATE TABLE Operating_System(
    System_ID VARCHAR(10) PRIMARY KEY NOT NULL UNIQUE,
    FOREIGN KEY (Platform_ID) REFERENCES Platform(Platform_ID),
    Emulated Boolean DEFAULT False,
    FOREIGN KEY (Region_ID) REFERENCES Region(Region_ID)
);

CREATE TABLE Platform(
    Platform_ID VARCHAR(10) PRIMARY KEY NOT NULL UNIQUE,
    Platform_Name VARCHAR(25) UNIQUE,
    ReleaseDate DATE
);

CREATE TABLE Run(
    Run_ID VARCHAR(10) PRIMARY KEY NOT NULL UNIQUE,
    FOREIGN KEY (Game_ID) REFERENCES Game(Game_ID),
    FOREIGN KEY (Time_ID) REFERENCES Time(Time_ID),
    FOREIGN KEY (Category) REFERENCES Region(Region_ID),
    FOREIGN KEY (System_ID) REFERENCES Operating_System(System_ID),
    FOREIGN KEY (User_ID) REFERENCES User(User_ID)
);

CREATE TABLE TIME(
    Time_ID VARCHAR(10) NOT NULL,
    Real_Millis Int NOT NULL,
    In_Game_Millis int,
    Real_Millis_NoLoad int
);

CREATE TABLE Category(
    Category_ID VARCHAR(10) PRIMARY KEY NOT NULL,
    Name VARCHAR(25) NOT NULL,
    Rule VARCHAR(30)
);
