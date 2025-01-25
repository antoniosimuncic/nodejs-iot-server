-- Delete and reset SensorReadings table
DELETE FROM SensorReadings;
UPDATE sqlite_sequence SET seq = 0 WHERE name = 'SensorReadings';

DELETE FROM Alerts;
UPDATE sqlite_sequence SET seq = 0 WHERE name = 'Alerts';

DELETE FROM Devices;
UPDATE sqlite_sequence SET seq = 0 WHERE name = 'Devices';