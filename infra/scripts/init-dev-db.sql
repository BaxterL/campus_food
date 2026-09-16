-- Dev bootstrap after a local PostgreSQL 17 install.
-- Run as superuser (postgres):
--   psql -U postgres -f infra/scripts/init-dev-db.sql

SELECT 'CREATE USER campus_food WITH PASSWORD ''campus_food_dev'''
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'campus_food')\gexec

SELECT 'CREATE DATABASE campus_food OWNER campus_food'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'campus_food')\gexec

GRANT ALL PRIVILEGES ON DATABASE campus_food TO campus_food;
