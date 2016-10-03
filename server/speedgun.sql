CREATE DATABASE SPEEDGUN;

\c speedgun;
CREATE EXTENSION citext;
CREATE TABLE timingdata (
  id serial primary key,
  data jsonb,
  email citext unique
);

CREATE TABLE dashboarddata (
  id serial primary key,
  data jsonb
);

CREATE TABLE imagedata (
  id serial primary key,
  data jsonb
);

insert into imagedata (data) VALUES ('1'),('2'),('3'),('4'),('5');