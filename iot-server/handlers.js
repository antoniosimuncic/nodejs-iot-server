const sqlite = require("node:sqlite");

let handlers = new Map();

// Handler to get all devices
function _Devices(req, res, q, data) {
    const sp=q.searchParams;
    const id=sp.get("id");
    const mac_address = data.mac_address;
    const device_name = data.device_name;
    const location = data.location;

    if (req.method == 'GET' && id == null) {
        const db = new sqlite.DatabaseSync("./sensor_data.db", { open: false });
        db.open();
        const sql = "SELECT * FROM Devices";
        const statement = db.prepare(sql);
        const result = statement.all();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.write(JSON.stringify(result));
        db.close();
        res.end();
        return true;
    }
    else if (req.method == 'GET' && id != null) {
        const db = new sqlite.DatabaseSync("./sensor_data.db", { open: false });
        db.open();
        const sql = "SELECT * FROM Devices WHERE id=:id";
        const params = {"id":id};
        const statement = db.prepare(sql);
        const result = statement.get(params);
        if (result == undefined){
            res.statusCode = 404;
            res.statusMessage = 'Device with id='+id+' does not exist.';
            res.end();
            db.close();
            return true;
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.write(JSON.stringify(result));
        db.close();
        res.end();
        return true;
    }
    else if (req.method == 'POST') {
        const db = new sqlite.DatabaseSync("./sensor_data.db", { open: false });
        db.open();

        // Check if device exists
        const checkDeviceSql = "SELECT * FROM Devices WHERE mac_address = :mac_address";
        const checkDeviceStmt = db.prepare(checkDeviceSql);
        const existingDevice = checkDeviceStmt.get({ mac_address });

        if (existingDevice) {
            // Update device if exists
            const updateSql = "UPDATE Devices SET device_name = :device_name, location = :location, last_active = CURRENT_TIMESTAMP WHERE mac_address = :mac_address";
            const updateStmt = db.prepare(updateSql);
            updateStmt.run({ device_name, location, mac_address });
            res.writeHead(200, { "Content-Type": "application/json" });
            res.write(JSON.stringify({ message: "Device updated successfully" }));
        } else {
            // Insert new device if not found
            const insertSql = "INSERT INTO Devices (mac_address, device_name, location) VALUES (:mac_address, :device_name, :location)";
            const insertStmt = db.prepare(insertSql);
            insertStmt.run({ mac_address, device_name, location });
            res.writeHead(200, { "Content-Type": "application/json" });
            res.write(JSON.stringify({ message: "Device added successfully" }));
        }
        db.close();
        res.end();
        return true;
        }
    
    return false;
}



// Handler to receive sensor readings
function _SensorReadings(req, res, q, data) {
    const mac_address = data.mac_address;
    const temperature = data.temperature;
    const humidity = data.humidity;
    const pm1 = data.pm1;
    const pm2_5 = data.pm2_5;
    const pm4 = data.pm4;
    const pm10 = data.pm10;
    const co2 = data.co2;
    const voc = data.voc;
    const pressure = data.pressure;

    if (req.method == 'POST') {
        const db = new sqlite.DatabaseSync("./sensor_data.db", { open: false });
        db.open();

        // Find device by mac_address
        const deviceSql = "SELECT id FROM Devices WHERE mac_address = :mac_address";
        const deviceStmt = db.prepare(deviceSql);
        const device = deviceStmt.get({ mac_address });

        if (!device) {
            res.statusCode = 404;
            res.statusMessage = "Device not found";
            res.end();
            db.close();
            return true;
        }

        // Insert sensor readings
        const insertSql = `
            INSERT INTO SensorReadings (device_id, temperature, humidity, pm1, pm2_5, pm4, pm10, co2, voc, pressure)
            VALUES (:device_id, :temperature, :humidity, :pm1, :pm2_5, :pm4, :pm10, :co2, :voc, :pressure)
        `;
        const insertStmt = db.prepare(insertSql);
        insertStmt.run({
            device_id: device.id,
            temperature,
            humidity,
            pm1,
            pm2_5,
            pm4,
            pm10,
            co2,
            voc,
            pressure
        });

        // Update last_active timestamp in Devices table
        const updateDeviceSql = "UPDATE Devices SET last_active = CURRENT_TIMESTAMP WHERE id = :device_id";
        const updateDeviceStmt = db.prepare(updateDeviceSql);
        updateDeviceStmt.run({ device_id: device.id });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.write(JSON.stringify({ message: "Sensor data stored successfully" }));
        db.close();
        res.end();
        return true;
    }

    return false;
}

// Handler to retrieve the latest sensor readings
function _GetSensorReadings(req, res, q, data) {
    if (req.method === 'GET') {
        const db = new sqlite.DatabaseSync("./sensor_data.db", { open: false });
        db.open();

        // Query to get the latest sensor readings for each device
        const sql = `
            SELECT sr.id, sr.device_id, d.mac_address, d.device_name, d.location, 
                   sr.temperature, sr.humidity, sr.pm1, sr.pm2_5, sr.pm4, sr.pm10, 
                   sr.co2, sr.voc, sr.pressure, sr.timestamp
            FROM SensorReadings sr
            INNER JOIN Devices d ON sr.device_id = d.id
            WHERE sr.timestamp = (
                SELECT MAX(timestamp) 
                FROM SensorReadings 
                WHERE device_id = sr.device_id
            )
            ORDER BY sr.timestamp DESC;
        `;
        const statement = db.prepare(sql);
        const result = statement.all();

        res.writeHead(200, { "Content-Type": "application/json" });
        res.write(JSON.stringify(result));
        db.close();
        res.end();
        return true;
    }

    return false;
}

handlers.set("/devices", _Devices);
handlers.set("/sensor-readings", _SensorReadings);
handlers.set("/sensor-readings", _GetSensorReadings);

module.exports = handlers;
