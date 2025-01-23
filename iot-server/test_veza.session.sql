-- Delete and reset SensorReadings table
DELETE FROM SensorReadings;
UPDATE sqlite_sequence SET seq = 0 WHERE name = 'SensorReadings';
