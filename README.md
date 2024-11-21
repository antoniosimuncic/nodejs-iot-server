# Node.js IoT server

## **IoT Sensor Data Collection System**
This project implements a simple server to receive, store, and retrieve IoT sensor data using Node.js. The focus is on manually handling HTTP requests without using frameworks.

## **Features**
- Recieves data from IoT devices via HTTP requests
- Stores sensor readings such as temperature, humidity, CO2, and PM values
- Retrieves stored data for further analysis

## **Technology Stack**
- **Node.js**: Handles HTTP requests and responses
- **Arduino**: Framework used to program the ESP32-S3 microcontroller
- **ESP32-S3**: Sends sensor data to the server via HTTP POST.
- **JSON**: Used for data transmission.


## API

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
   - `device_id` (foreign key)
   - `alert_type` (e.g., high CO2 level)
   - `created_at` (time of alert creation)

---

### API Functionalities:

| Endpoint            | Method | Description                                    |
|---------------------|--------|------------------------------------------------|
| `/devices`          | POST   | Add or update a device                        |
| `/sensor-readings`  | POST   | Submit sensor readings                        |
| `/sensor-readings`  | GET    | Retrieve the latest sensor readings           |
| `/devices`          | GET    | Retrieve all registered devices               |


1. **Add or Update a Device Using MAC Address** (POST `/devices`):
   - Request body:
   ```json
   {
     "mac_address": "AA:BB:CC:DD:EE:FF",
     "device_name": "ESP32-S3",
     "location": "Office"
   }
   ```
   - If the `mac_address` exists, update the `device_name`, `location`, or `last_active`.
   - If it doesn't exist, create a new record in the `Devices` table.

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
   - The API:
     1. Looks up the `Devices` table using the provided `mac_address`.
     2. If found, inserts the readings into the `SensorReadings` table.
     3. Updates the `last_active` field for the device.

3. **Get All Sensor Readings** (GET `/sensor-readings`):
   - Returns the latest readings for each device.

4. **Get Devices** (GET `/devices`):
   - Returns a list of all registered devices, including their `mac_address`, `device_name`, `location`, and `last_active`.

5. **Generate Alerts**:
   - If CO2 or VOC levels exceed a specified threshold, the API can store an alert in the `Alerts` table.

---




