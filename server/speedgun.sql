CREATE DATABASE SPEEDGUN;

\c speedgun;

CREATE TABLE jsontest (
  id serial primary key,
  data jsonb,
  email citext unique
);

CREATE TABLE imagetest (
  id serial primary key,
  data jsonb
);

insert into imagetest (data) VALUES ('1'),('2'),('3'),('4'),('5');