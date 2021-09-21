CREATE TABLE Countries(
country_ID int,
name varchar(255),
population int,
PRIMARY KEY (country_ID)
);

CREATE TABLE Persons(
person_ID int,
last_name varchar(255),
first_name varchar(255),
address varchar(255),
city_ID int,
country_ID int, 
PRIMARY KEY (person_ID),
FOREIGN KEY (city_ID) REFERENCES Cities(city_ID),
FOREIGN KEY (country_ID) REFERENCES Countries(country_ID) 
);

CREATE TABLE Cities(
city_ID int,
city_name varchar(255),
country_ID int,
population int,
PRIMARY KEY (city_ID)
FOREIGN KEY (country_ID) REFERENCES Countries(country_ID)
);

INSERT INTO Countries VALUES (1, 'USA', 350000);
INSERT INTO Cities VAlUES (1, 'SQLVille', 1 , 1000); 
INSERT INTO Persons VALUES (1, 'Chen', 'John', 'Alpha', 1, 1);

SELECT * FROM Cities;
SELECT * FROM Persons;
SELECT * FROM CITIES;