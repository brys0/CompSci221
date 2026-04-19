CREATE TABLE Region(
    Region_ID VARCHAR(10) PRIMARY KEY NOT NULL,
    Region_Name VARCHAR(30) NOT NULL UNIQUE,
    Region_Language VARCHAR(30) NOT NULL
);

CREATE TABLE Platform(
    Platform_ID VARCHAR(10) PRIMARY KEY NOT NULL,
    Platform_Name VARCHAR(25) UNIQUE,
    ReleaseDate DATE
);

CREATE TABLE Game(
    Game_ID VARCHAR(25) PRIMARY KEY NOT NULL,
    Game_Name VARCHAR(25) NOT NULL,
    ReleaseDate DATE,
    URL VARCHAR(50)
);

CREATE TABLE Category(
    Category_ID VARCHAR(10) PRIMARY KEY NOT NULL,
    Game_ID VARCHAR(10) NOT NULL,
    Name VARCHAR(25) NOT NULL,
    Rule VARCHAR(30),
    FOREIGN KEY (Game_ID) REFERENCES Game(Game_ID)
);

CREATE TABLE Time(
    Time_ID VARCHAR(10) PRIMARY KEY NOT NULL,
    Real_Millis INT NOT NULL,
    In_Game_Millis INT,
    Real_Millis_NoLoad INT
);

CREATE TABLE User(
    User_ID VARCHAR(15) PRIMARY KEY NOT NULL,
    Username VARCHAR(25) NOT NULL UNIQUE,
    Email VARCHAR(30) NOT NULL UNIQUE,
    Password VARCHAR(40) NOT NULL,
    Admin BOOLEAN DEFAULT FALSE,
    Region_ID VARCHAR(10),
    FOREIGN KEY (Region_ID) REFERENCES Region(Region_ID)
);

CREATE TABLE GamePlatform(
    Game_ID VARCHAR(10) NOT NULL,
    Platform_ID VARCHAR(10) NOT NULL,
    PRIMARY KEY (Game_ID, Platform_ID),
    FOREIGN KEY (Game_ID) REFERENCES Game(Game_ID),
    FOREIGN KEY (Platform_ID) REFERENCES Platform(Platform_ID)
);

CREATE TABLE GameSystem(
    System_ID VARCHAR(10) PRIMARY KEY NOT NULL,
    Platform_ID VARCHAR(10),
    Region_ID VARCHAR(10),
    Emulated BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (Platform_ID) REFERENCES Platform(Platform_ID),
    FOREIGN KEY (Region_ID) REFERENCES Region(Region_ID)
);

CREATE TABLE Run(
    Run_ID VARCHAR(10) PRIMARY KEY NOT NULL,
    Game_ID VARCHAR(25),
    Time_ID VARCHAR(10),
    Category_ID VARCHAR(10),
    System_ID VARCHAR(10),
    User_ID VARCHAR(15),
    FOREIGN KEY (Game_ID) REFERENCES Game(Game_ID),
    FOREIGN KEY (Time_ID) REFERENCES Time(Time_ID),
    FOREIGN KEY (Category_ID) REFERENCES Category(Category_ID),
    FOREIGN KEY (System_ID) REFERENCES GameSystem(System_ID),
    FOREIGN KEY (User_ID) REFERENCES User(User_ID)
);
