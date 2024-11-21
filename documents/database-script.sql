-- Create the Devices table
CREATE TABLE Devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- Auto-incrementing primary key
    mac_address TEXT UNIQUE NOT NULL,     -- Unique MAC address
    device_name TEXT,                     -- Optional device name
    location TEXT,                        -- Device location
    last_active DATETIME                  -- Timestamp of last activity
);

-- Create the SensorReadings table
CREATE TABLE SensorReadings (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- Auto-incrementing primary key
    device_id INTEGER NOT NULL,           -- Foreign key referencing Devices
    temperature REAL,                     -- Temperature in Celsius
    humidity REAL,                        -- Humidity in percentage
    pm1 REAL,                             -- PM1 concentration in µg/m³
    pm2_5 REAL,                           -- PM2.5 concentration in µg/m³
    pm4 REAL,                             -- PM4 concentration in µg/m³
    pm10 REAL,                            -- PM10 concentration in µg/m³
    co2 REAL,                             -- CO2 concentration in ppm
    voc REAL,                             -- VOC index (0-500)
    pressure REAL,                        -- Atmospheric pressure in hPa
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, -- Time of reading
    FOREIGN KEY (device_id) REFERENCES Devices (id) -- Reference to Devices table
);

-- Create the Alerts table
CREATE TABLE Alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- Auto-incrementing primary key
    device_id INTEGER NOT NULL,           -- Foreign key referencing Devices
    alert_type TEXT NOT NULL,             -- Type of alert (e.g., high CO2)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Time of alert creation
    FOREIGN KEY (device_id) REFERENCES Devices (id) -- Reference to Devices table
);


PRAGMA foreign_keys = ON; -- Enforce foreign keys

-- Insert a test device
INSERT INTO Devices (mac_address, device_name, location, last_active) 
VALUES ('00:1A:7D:DA:71:13', 'Test ESP32-S3', 'Lab', CURRENT_TIMESTAMP);

-- Insert some test sensor readings
INSERT INTO SensorReadings (device_id, temperature, humidity, pm1, pm2_5, pm4, pm10, co2, voc, pressure) 
VALUES 
(1, 22.5, 45.0, 10, 20, 25, 30, 450, 100, 1013.25);

-- Insert a test alert
INSERT INTO Alerts (device_id, alert_type) 
VALUES 
(1, 'High CO2 Level');



