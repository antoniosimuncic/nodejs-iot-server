# IoT Sensor Data Collection server

This project implements a simple server to receive, store, and retrieve IoT sensor data using Node.js. The focus is on manually handling HTTP requests without using frameworks.

## **Features**
- Receives data from IoT devices via HTTP requests
- Stores sensor readings such as temperature, humidity, CO2, and PM values
- Retrieves stored data for further analysis

## **Technology Stack**
- **Node.js**: Handles HTTP requests and responses
- **Arduino**: Framework used to program the ESP32-S3 microcontroller
- **Espressif ESP32-S3**: Sends sensor data to the server via HTTP POST.
- **JSON**: Used for data transmission.


## API

### Functionalities:

1. Threshold Monitoring
   - A function, `checkThresholds()`, evaluates sensor readings and generates alerts if values exceed predefined thresholds.

2. Device Management
   - Add, list, modify, and delete devices.
   - Devices are identified by their MAC address.

3. Sensor Data Management
   - Log sensor readings with timestamps.
   - Retrieve readings for a specific device or all devices.

4. Alert Management
   - Automatically generate alerts when thresholds are exceeded.
   - Retrieve recent alerts.  


| Endpoint            | Method | Description                                    |
|---------------------|--------|------------------------------------------------|
| `/devices`          | POST   | Add a new device                               |
| `/devices`          | GET    | Retrieve all or specified registered devices   |
| `/devices`          | PUT    | Update a device                                |
| `/devices`          | DELETE | Delete a device                                |
| `/sensor-readings`  | POST   | Submit sensor readings                         |
| `/sensor-readings`  | GET    | Retrieve all or specified sensor readings      |
| `/alerts`           | GET    | Retrieve all or specified alert                |

---

### Database Tables:
1. **Devices** (for tracking devices sending data):
   - `id` (primary key)
   - `mac_address` (unique MAC address of the device)
   - `device_name` (optional name of the device)
   - `location` (where the device is located)
   - `last_active` (timestamp of the last data submission)

2. **SensorReadings** (for storing sensor readings):
   - `id` (primary key)
   - `device_id` (foreign key linked to the Devices table)
   - `temperature` (°C)
   - `humidity` (%)
   - `pm1`, `pm2_5`, `pm4`, `pm10` (particle concentrations in µg/m³)
   - `co2` (ppm)
   - `voc` (Index 0-500)
   - `pressure` (hPa)
   - `timestamp` (time of the reading)

3. **Alerts** (for tracking alerts):
   - `id` (primary key)
   - `device_id` (foreign key linked to the Devices table)
   - `alert_type` (e.g., high CO2 level)
   - `created_at` (time of alert creation)

---

1. **Add a New Device With a Unique MAC Address** (POST `/devices`):
   - Request body:
   ```json
   {
     "mac_address": "AA:BB:CC:DD:EE:FF",
     "device_name": "ESP32-S3",
     "location": "Office"
   }
   ```
   - API:
      1. Looks up the `Devices` table using the provided `mac_address`.
      2. If not found, inserts new device into `Devices` and returns: `200` - message: "New device added successfully"
      3. If found, returns:  `400` - message: "Device already exists! No changes were made."
      4. If an internal error occurs, returns: `500` - message: "Internal Server Error: " + `error.message`
 

2. **Get Devices** (GET `/devices`):
   - Returns a list of all registered devices, including their `mac_address`, `device_name`, `location`, and `last_active`.
   - Possible to filter request by using device_id to specify wanted results.

3. **Update an Existing Device** (PUT `/devices`):
   - Request body:
   ```json
   {
     "mac_address": "AA:BB:CC:DD:EE:FF",
     "device_name": "ESP32-S3",
     "location": "Office"
   }
   ```
   - API:
      1. Looks up the `Devices` table using the provided `mac_address`.
      2. If not found, returns: `404` - message: "Device not found! No changes were made."
      3. If found, sets the new values in `Devices` and returns: `200` - message: "Device updated successfully."
      4. If an internal error occurs, returns: `500` - message: "Internal Server Error: " + `error.message`

4. **Delete an Existing Device** (DELETE `/devices`):
   - Request body:
   ```json
   {
     "mac_address": "AA:BB:CC:DD:EE:FF"
   }
   ```
   - API:
      1. Looks up the `Devices` table using the provided `mac_address`.
      2. If not found, returns: `400` - message: "Device delete failed! No device with mac_address=${`mac_address`} was found."
      3. If found, deletes the device from `Devices` and returns: `200` - message: "Device deleted successfully."
      4. If an internal error occurs, returns: `500` - message: "Internal Server Error: " + `error.message`


2. **Send Sensor Readings** (POST `/sensor-readings`):
   - Request body:
     ```json
     {
       "mac_address": "AA:BB:CC:DD:EE:FF",
       "temperature": 22.5,
       "humidity": 45.0,
       "pm1": 10,
       "pm2_5": 20,
       "pm4": 25,
       "pm10": 30,
       "co2": 450,
       "voc": 100,
       "pressure": 1013.25
     }
     ```
   - API:
     1. Looks up the `Devices` table using the provided `mac_address`.
     2. If found, inserts the readings into the `SensorReadings` table.
     3. Automatically update the `last_active` field for the device with a timestamp (UTC+1).

3. **Get All Sensor Readings** (GET `/sensor-readings`):
   - Returns the latest readings for every device including their `device_name` and `location` from `Devices` table.
   - Possible to query specific devices via `/sensor-readings?device_id=${device_id}`

4. **Get All Devices** (GET `/devices`):
   - Returns a list of all registered devices.
   - Possible to query specific devices via `/devices?device_id=${device_id}`

5. **Get All Alerts** (GET `/alerts`):
   - Returns a list of all previous alerts.
   - Possible to query specific devices via `/alerts?device_id=${device_id}`

**Alerts**:
   - If CO2, Temperature, or Humidity levels exceed a specified threshold, the API will store an alert in the `Alerts` table.
   - Thresholds are set in `handlers.js`.

---

### Code Structure
- `handlers.js`: Contains all the main request handlers for the API.
- **Database**: SQLite is used to store device data, sensor readings, and alerts in three tables:
`Devices`: Stores device information.
`SensorReadings`: Stores readings for temperature, humidity, CO2, particulate matter, etc.
`Alerts`: Tracks threshold exceedances and timestamps.

---

Sample Code Snippets
1. Threshold Checking
The `checkThresholds` function compares sensor readings against defined limits and returns a list of alerts.

   ```javascript
   const THRESHOLDS = {
       temperature: 35, 
       humidity: 70, 
       pm1: 200, 
       pm2_5: 200,
       pm4: 250,
       pm10: 300,
       co2: 1500,
       voc: 400,
       pressure: 1013.25
   };
   
   function checkThresholds(sensorData) {
       const alerts = [];
       for (const [key, value] of Object.entries(sensorData)) {
           if (THRESHOLDS[key] && value > THRESHOLDS[key]) {
               alerts.push(`High ${key}`);
           }
       }
       return alerts;
   }
   ```

2. Device Management
   - Add a New Device:

   ```javascript
   const insertSql = `
       INSERT INTO Devices (mac_address, device_name, location) 
       VALUES (:mac_address, :device_name, :location)
   `;
   const result = db.prepare(insertSql).run(params);
   ```
   - Retrieve All Devices:

   ```javascript
   const sql = "SELECT * FROM Devices";
   const devices = db.prepare(sql).all();
   ```

3. Sensor Data Logging
When sensor data is received, it is:

   - Logged into the `SensorReadings` table.
   - Checked against thresholds to generate alerts.
   ```javascript
   const insertReadingSql = `
       INSERT INTO SensorReadings (device_id, temperature, humidity, pm1, pm2_5, pm4, pm10, co2, voc, pressure, timestamp)
       VALUES (:device_id, :temperature, :humidity, :pm1, :pm2_5, :pm4, :pm10, :co2, :voc, :pressure, datetime('now'))
   `;
   db.prepare(insertReadingSql).run(sensorData);
   
   // Generate alerts
   if (sensorData.temperature > THRESHOLDS.temperature) {
       alertStmt.run({ device_id: sensorData.device_id, alert_type: 'High temperature' });
   }
   ```

4. Alerts Retrieval
The API allows retrieving alerts either for all devices or a specific one.

   ```javascript
   const sql = `
       SELECT Alerts.*, Devices.mac_address, Devices.device_name, Devices.location 
       FROM Alerts
       INNER JOIN Devices ON Alerts.device_id = Devices.id
       WHERE device_id = :device_id
       ORDER BY created_at DESC
       LIMIT 50
   `;
   const alerts = db.prepare(sql).all({ device_id });
   ```

### API Endpoints
The following endpoints are implemented in `handlers.js`:

- Devices: `/devices`
   - GET: List all devices or a specific one by MAC address.
   - POST: Add a new device.
   - PUT: Modify an existing device.
   - DELETE: Remove a device.

- Sensor Readings: `/sensor-readings`
   - GET: List sensor readings (all or by device).
   - POST: Add new sensor readings.

- Alerts: `/alerts`
   - GET: Retrieve recent alerts (all or by device).

### Database Schema
1. Devices Table
```sql
CREATE TABLE Devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mac_address TEXT UNIQUE NOT NULL,
    device_name TEXT NOT NULL,
    location TEXT,
    last_active TIMESTAMP
);
```

2. SensorReadings Table
```sql
CREATE TABLE SensorReadings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER,
    temperature REAL,
    humidity REAL,
    pm1 REAL,
    pm2_5 REAL,
    pm4 REAL,
    pm10 REAL,
    co2 REAL,
    voc REAL,
    pressure REAL,
    timestamp DATETIME,
    FOREIGN KEY (device_id) REFERENCES Devices (id)
);
```

3. Alerts Table
```sql
CREATE TABLE Alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER,
    alert_type TEXT NOT NULL,
    created_at DATETIME,
    FOREIGN KEY (device_id) REFERENCES Devices (id)
);
```


