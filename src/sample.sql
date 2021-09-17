CREATE TABLE Countries
(
CountryID int PRIMARY KEY,
something varchar(255)
);

CREATE TABLE Persons
(
PersonID int PRIMARY KEY,
LastName varchar(255),
FirstName varchar(255),
Address varchar(255),
City varchar(255) FOREIGN KEY REFERENCES Cities(CityID),
Country varchar(255) FOREIGN KEY REFERENCES Countries(CountryID)
);

CREATE TABLE Cities
(
CityID int PRIMARY KEY,
Country varchar(255) FOREIGN KEY REFERENCES Countries(CountryID),
Population int,
);