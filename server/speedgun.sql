CREATE DATABASE SPEEDGUN;

\c speedgun;

CREATE TABLE jsontest (
  id serial primary key,
  data jsonb
);