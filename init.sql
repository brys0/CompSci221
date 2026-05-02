use db;

CREATE TABLE Region(
    Region_ID VARCHAR(25) PRIMARY KEY NOT NULL,
    Region_Name VARCHAR(30) NOT NULL UNIQUE,
    Region_Language VARCHAR(30) NOT NULL
);

CREATE TABLE Platform(
    Platform_ID VARCHAR(25) PRIMARY KEY NOT NULL,
    Platform_Name VARCHAR(60) UNIQUE,
    ReleaseDate VARCHAR(12)
);

CREATE TABLE Game(
    Game_ID VARCHAR(25) PRIMARY KEY NOT NULL,
    Game_Name VARCHAR(200) NOT NULL,
    ReleaseDate VARCHAR(12),
    URL VARCHAR(50)
);

CREATE TABLE Category(
    Category_ID VARCHAR(25) PRIMARY KEY NOT NULL,
    Game_ID VARCHAR(25) NOT NULL,
    Name VARCHAR(25) NOT NULL,
    Rule TEXT,
    FOREIGN KEY (Game_ID) REFERENCES Game(Game_ID)
);

CREATE TABLE Time(
    Time_ID VARCHAR(25) PRIMARY KEY NOT NULL,
    Real_Millis INT NOT NULL,
    In_Game_Millis INT,
    Real_Millis_NoLoad INT
);

CREATE TABLE Country (
    Country_ID CHAR(2) PRIMARY KEY NOT NULL, -- ISO 2l
    Name VARCHAR(50) NOT NULL,
    Language VARCHAR(30)
);

CREATE TABLE User(
    User_ID VARCHAR(25) PRIMARY KEY NOT NULL,
    Username VARCHAR(25) NOT NULL UNIQUE,
    Email VARCHAR(50) NOT NULL UNIQUE,
    Password VARCHAR(80) NOT NULL,
    Admin BOOLEAN DEFAULT FALSE,
    Country_ID VARCHAR(10),
    FOREIGN KEY (Country_ID) REFERENCES Country(Country_ID)
);

CREATE TABLE GamePlatform(
    Game_ID VARCHAR(25) NOT NULL,
    Platform_ID VARCHAR(10) NOT NULL,
    PRIMARY KEY (Game_ID, Platform_ID),
    FOREIGN KEY (Game_ID) REFERENCES Game(Game_ID),
    FOREIGN KEY (Platform_ID) REFERENCES Platform(Platform_ID)
);

CREATE TABLE GameSystem(
    System_ID VARCHAR(25) PRIMARY KEY NOT NULL,
    Platform_ID VARCHAR(25) NOT NULL,
    Region_ID VARCHAR(25) NOT NULL,
    Emulated BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (Platform_ID) REFERENCES Platform(Platform_ID),
    FOREIGN KEY (Region_ID) REFERENCES Region(Region_ID)
);

CREATE TABLE Run(
    Run_ID VARCHAR(25) PRIMARY KEY NOT NULL,
    Game_ID VARCHAR(25) NOT NULL,
    Time_ID VARCHAR(25) NOT NULL,
    Category_ID VARCHAR(25) NOT NULL,
    System_ID VARCHAR(25) NOT NULL,
    User_ID VARCHAR(25) NOT NULL,
    FOREIGN KEY (Game_ID) REFERENCES Game(Game_ID),
    FOREIGN KEY (Time_ID) REFERENCES Time(Time_ID),
    FOREIGN KEY (Category_ID) REFERENCES Category(Category_ID),
    FOREIGN KEY (System_ID) REFERENCES GameSystem(System_ID),
    FOREIGN KEY (User_ID) REFERENCES User(User_ID)
);
