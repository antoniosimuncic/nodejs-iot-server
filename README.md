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





