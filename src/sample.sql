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
INSERT INTO Countries VALUES (2, 'Mexico', 350001);
INSERT INTO Countries VALUES (3, 'Canada', 350002);
INSERT INTO Countries VALUES (4, 'Germany', 350002);
INSERT INTO Countries VALUES (5, 'Japan', 350002);

INSERT INTO Cities VAlUES (1, 'SQLVille', 1 , 1000); 
INSERT INTO Cities VAlUES (2, 'Mexico City', 2 , 1000); 
INSERT INTO Cities VAlUES (3, 'Toronto', 3 , 1000); 
INSERT INTO Cities VAlUES (4, 'Berlin', 4 , 1000); 
INSERT INTO Cities VAlUES (5, 'Tokyo', 5 , 1000);
 
INSERT INTO Persons VALUES (1, 'Chen', 'John', 'Alpha', 1, 1);
INSERT INTO Persons VALUES (2, 'Rilliet', 'Kai', 'Beta', 1, 1);
INSERT INTO Persons VALUES (3, 'Rhana', 'Omar', 'Charlie', 1, 1);
INSERT INTO Persons VALUES (4, 'Lee', 'Matt', 'Delta', 1, 1);


SELECT * FROM Countries;
SELECT * FROM Cities;
SELECT * FROM Persons;