const sqlite = require("node:sqlite");

let handlers = new Map();

const THRESHOLDS = {
    temperature: 35, 
    humidity: 80, 
    pm1: 100, 
    pm2_5: 200,
    pm4: 250,
    pm10: 300,
    co2: 1000,
    voc: 200,
    pressure: 1013.25
  };

// List, add, modify or delete devices
function _Devices(req, res, q, data) {
    const sp = q.searchParams;
    const id = sp.get("id");

    // List all devices or specific device by id from database
    if (req.method == 'GET') {
        try{
            const db = new sqlite.DatabaseSync("./sensor_data.db", { open: false });
            db.open();

            if (id == undefined) {
                // Get all devices
                const sql = "SELECT * FROM Devices";

                const stmt = db.prepare(sql);
                const result = stmt.all();

                if (!result) {
                    res.writeHead(404, { "Content-Type": "application/json" });
                    res.write(JSON.stringify({ message: `No sensor readings found.` }));
                    res.end();
                    db.close();
                    return true;
                }

                res.writeHead(200, { "Content-Type": "application/json" });
                res.write(JSON.stringify(result));
            }

            else if (id != undefined) {
                // Get a specific device by id
                const sql = "SELECT * FROM Devices WHERE id=:id";

                const stmt = db.prepare(sql);
                const result = stmt.get({ id });

                if (!result){
                    res.writeHead(404, { "Content-Type": "application/json" });
                    res.write(JSON.stringify({ message: `No device with id=${id} was found.` }));
                    res.end();
                    db.close();
                    return true;
                }

                res.writeHead(200, { "Content-Type": "application/json" });
                res.write(JSON.stringify(result));
            }

            db.close();
            res.end();
            return true;
    } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.write(JSON.stringify({ message: "Internal Server Error: " + error.message}));
        res.end();
        return true;
      }
    }

    // Insert new devices into database
    else if (req.method === 'POST') {
        try {
            const mac_address = sp.get("mac_address");
            const device_name = sp.get("device_name");
            const location = sp.get("location");

            const db = new sqlite.DatabaseSync("./sensor_data.db", { open: false });
            db.open();

            // Check if the device exists
            const checkDeviceSql = "SELECT * FROM Devices WHERE mac_address = :mac_address";
            const existingDevice = db.prepare(checkDeviceSql).get({ mac_address });
            //console.log(existingDevice);

            if (existingDevice){
                // Error message - device already exists
                res.writeHead(400, { "Content-Type": "application/json" });
                res.write(JSON.stringify({ message: "Device already exists! No changes were made." }));
            } else {
                const insertSql = `
                INSERT INTO Devices (mac_address, device_name, location) 
                VALUES (:mac_address, :device_name, :location)
                `;

                db.prepare(insertSql).run({ mac_address, device_name, location });
                res.writeHead(200, { "Content-Type": "application/json" }); // maybe 201 statusCode?
                res.write(JSON.stringify({ message: "New device added successfully" }));
            }

            res.end()
            db.close()
            return true;
        } catch (error) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.write(JSON.stringify({ message: "Internal Server Error: " + error.message}));
            res.end();
            return true;
        }
    }

    // Modify existing devices in database
    else if (req.method === 'PUT') {
        try {
            const mac_address = sp.get("mac_address");
            const device_name = sp.get("device_name");
            const location = sp.get("location");

            const db = new sqlite.DatabaseSync("./sensor_data.db", { open: false });
            db.open();

            // Check if the device exists
            const checkDeviceSql = "SELECT * FROM Devices WHERE mac_address = :mac_address";
            const existingDevice = db.prepare(checkDeviceSql).get({ mac_address });
            console.log(existingDevice);
        
            if (existingDevice){
                // Update existing device
                const updateSql = `
                UPDATE Devices 
                SET device_name = :device_name, location = :location 
                WHERE mac_address = :mac_address
                `;

                db.prepare(updateSql).run({ mac_address, device_name, location });
                res.writeHead(200, { "Content-Type": "application/json" });
                res.write(JSON.stringify({ message: "Device updated successfully." }));
            } else {
                // Error message, no device found
                res.writeHead(400, { "Content-Type": "application/json" });
                res.write(JSON.stringify({ message: "Device update failed! No such device was found." }));
            }
            
            res.end()
            db.close()
            return true;
        } catch (error) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.write(JSON.stringify({ message: "Internal Server Error: " + error.message}));
            res.end();
            return true;
        }
    }

    // Delete existing devices from database
    else if (req.method === 'DELETE') {
        try {
            const mac_address = sp.get("mac_address");

            const db = new sqlite.DatabaseSync("./sensor_data.db", { open: false });
            db.open();

            // Check if the device exists
            const checkDeviceSql = "SELECT * FROM Devices WHERE mac_address = :mac_address";
            const existingDevice = db.prepare(checkDeviceSql).get({ mac_address });
            console.log(existingDevice);
        
            if (existingDevice){
                // Delete device with the provided MAC address
                const deleteSql = `
                Delete from Devices 
                WHERE mac_address = :mac_address
                `;

                db.prepare(deleteSql).run({ mac_address});

                res.writeHead(200, { "Content-Type": "application/json" });
                res.write(JSON.stringify({ message: "Device deleted successfully." }));
            } else {
                // Error message, no device found
                res.writeHead(400, { "Content-Type": "application/json" });
                res.write(JSON.stringify({ message: `Device delete failed! No device with mac_address=${mac_address} was found.` }));
            }
            
            res.end()
            db.close()
            return true;
        } catch (error) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.write(JSON.stringify({ message: "Internal Server Error: " + error.message}));
            res.end();
            return true;
        }
    }
        else {
            res.writeHead(405, { "Content-Type": "application/json" });
            res.write(JSON.stringify({ message: "Method not allowed." }));
            res.end();
            return true;
        }
}

// List or add sensor readings
function _SensorReadings(req, res, q, data) {
    const sp = q.searchParams;
    const id = sp.get("id");
    const device_id = sp.get("device_id");
    const mac_address = sp.get("mac_address");
    const temperature = sp.get("temperature");
    const humidity = sp.get("humidity");
    const pm1 = sp.get("pm1");
    const pm2_5 = sp.get("pm2_5");
    const pm4 = sp.get("pm4");
    const pm10 = sp.get("pm10");
    const co2 = sp.get("co2");
    const voc = sp.get("voc");
    const pressure = sp.get("pressure");

    if (req.method === 'GET') {
        try {
            const db = new sqlite.DatabaseSync("./sensor_data.db", { open: false });
            db.open();

            if (id == undefined && device_id == undefined) {
                // Get all sensor readings
                const sql = `
                    SELECT sr.*, d.mac_address, d.device_name, d.location
                    FROM SensorReadings sr
                    INNER JOIN Devices d ON sr.device_id = d.id
                    ORDER BY sr.timestamp DESC
                `;
                const stmt = db.prepare(sql);
                const result = stmt.all();

                if (!result) {
                    res.writeHead(404, { "Content-Type": "application/json" });
                    res.write(JSON.stringify({ message: `No sensor readings found.` }));
                    res.end();
                    db.close();
                    return true;
                }

                res.writeHead(200, { "Content-Type": "application/json" });
                res.write(JSON.stringify(result));
            }

        else if (id != undefined && device_id == undefined) {
            // Get a specific sensor reading by id
            const sql = `
                SELECT sr.*, d.mac_address, d.device_name, d.location
                FROM SensorReadings sr
                INNER JOIN Devices d ON sr.device_id = d.id
                WHERE sr.id = :id
            `;
            const stmt = db.prepare(sql);
            const result = stmt.get({ id });

            if (!result) {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.write(JSON.stringify({ message: `Sensor reading with id=${id} not found.` }));
                res.end();
                db.close();
                return true;
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            res.write(JSON.stringify(result));
        } 
        
        else if (id == undefined && device_id != undefined) {
            // Get a specific sensor reading by device_id
            const sql = `
                SELECT sr.*, d.mac_address, d.device_name, d.location
                FROM SensorReadings sr
                INNER JOIN Devices d ON sr.device_id = d.id
                WHERE sr.device_id = :device_id
                ORDER BY sr.id DESC
            `;
            const stmt = db.prepare(sql);
            const result = stmt.all({ device_id }); 

            if (!result[0]) {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.write(JSON.stringify({ message: `Sensor readings with device_id=${device_id} not found.` }));
                res.end();
                db.close();
                return true;
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            res.write(JSON.stringify(result));
        }

        else if (id != undefined && device_id != undefined) {
            // Get a specific sensor reading by id and device_id
            const sql = `
                SELECT sr.*, d.mac_address, d.device_name, d.location
                FROM SensorReadings sr
                INNER JOIN Devices d ON sr.device_id = d.id
                WHERE sr.id = :id AND sr.device_id = :device_id
                ORDER BY sr.id DESC
            `;
            const stmt = db.prepare(sql);
            const result = stmt.all({ id, device_id }); 

            if (!result[0]) {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.write(JSON.stringify({ message: `Sensor readings with id=${id} and device_id=${device_id} not found.` }));
                res.end();
                db.close();
                return true;
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            res.write(JSON.stringify(result));
        }

        else {
            // Return no sensors found message
            res.writeHead(404, { "Content-Type": "application/json" });
            res.write(JSON.stringify({ message: `Sensor readings with device_id=${device_id} and id=${id} not found.` }));
            res.end();
            return true;
        }

        db.close();
        res.end();
        return true;
    } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.write(JSON.stringify({ message: "Internal Server Error: " + error.message}));
        res.end();
        return true;
    }
    }

    else if (req.method === 'POST') {
        try {
            const db = new sqlite.DatabaseSync("./sensor_data.db", { open: false });
            db.open();

            // Find device by mac_address
            const deviceSql = "SELECT id FROM Devices WHERE mac_address = :mac_address";
            const deviceStmt = db.prepare(deviceSql);
            const device = deviceStmt.get({ mac_address });
            
            // Deny request if no such device is found
            if (!device) {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.write(JSON.stringify({ message: `No device with mac_address=${mac_address} found.` }));
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

            // Update the Alerts table
            const alertSql = `
            INSERT INTO Alerts (device_id, alert_type, created_at)
            VALUES (:device_id, :alert_type, CURRENT_TIMESTAMP)
            `;
            const alertStmt = db.prepare(alertSql);

            let alertMessage = ''

            if (temperature > THRESHOLDS.temperature) {
                alertStmt.run({ device_id: device.id, alert_type: 'High temperature' });
                alertMessage += 'Alert: High temperature '
            }
            if (humidity > THRESHOLDS.humidity) {
                alertStmt.run({ device_id: device.id, alert_type: 'High humidity' });
                alertMessage += 'Alert: High humidity '
            }
            if (co2 > THRESHOLDS.co2) {
                alertStmt.run({ device_id: device.id, alert_type: 'High CO2' });
                alertMessage += 'Alert: High CO2 '
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            res.write(JSON.stringify({ message: `Sensor data stored successfully. ${alertMessage}` }));
            db.close();
            res.end();
            return true;
        } catch (error) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.write(JSON.stringify({ message: "Internal Server Error: " + error.message}));
            res.end();
            return true;
        } 
    } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.write(JSON.stringify({ message: "Method not allowed" }));
        res.end();
        return true;
    } 
}

function _Alerts(req, res, q, data) {
    const sp = q.searchParams;
    const id = sp.get("id");
    const device_id = sp.get("device_id");

    // List all alerts or specific alert by id or device_id from database
    if (req.method == 'GET') {
        try {
            const db = new sqlite.DatabaseSync("./sensor_data.db", { open: false });
            db.open();
            if (id == undefined) {
                // Get all devices
                const sql = "SELECT * FROM Alerts";

                const stmt = db.prepare(sql);
                const result = stmt.all();

                if (!result) {
                    res.writeHead(404, { "Content-Type": "application/json" });
                    res.write(JSON.stringify({ message: `No alerts found.` }));
                    res.end();
                    db.close();
                    return true;
                }

                res.writeHead(200, { "Content-Type": "application/json" });
                res.write(JSON.stringify(result));
            }

        } catch (error) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.write(JSON.stringify({ message: "Internal Server Error: " + error.message}));
            res.end();
            return true;
        } 
    } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.write(JSON.stringify({ message: "Method not allowed" }));
        res.end();
        return true;
    } 
}


handlers.set("/devices", _Devices);
handlers.set("/sensor-readings", _SensorReadings);
handlers.set("/alerts", _Alerts);

module.exports = handlers;
