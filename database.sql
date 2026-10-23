-- This file creates the database and the one table the MVP needs.
-- Run it once from phpMyAdmin or with the MySQL command line inside XAMPP.

-- Create a separate database for this task without touching any other database.
CREATE DATABASE IF NOT EXISTS robotech_farm
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Select the new database so the table below is created inside it.
USE robotech_farm;

-- Create the table that stores every reading received from the MQTT broker.
CREATE TABLE IF NOT EXISTS sensor_readings (
  -- Unique number for each row; MySQL fills it automatically.
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  -- Temperature value sent by the sensor, for example 25.50.
  temperature DECIMAL(6, 2) NOT NULL,
  -- Humidity value sent by the sensor, for example 60.00.
  humidity DECIMAL(6, 2) NOT NULL,
  -- The moment the backend stored the reading; used by the web and mobile apps.
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- Every row needs a primary key, and the id column is the natural choice.
  PRIMARY KEY (id),
  -- This index keeps "newest reading first" queries fast as data grows.
  INDEX idx_created_at (created_at)
) ENGINE = InnoDB;
