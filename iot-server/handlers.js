const sqlite = require("node:sqlite");

let handlers = new Map();

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


// implement this
function checkThresholds(sensorData) {
    const alerts = [];
    for (const [key, value] of Object.entries(sensorData)) {
        if (THRESHOLDS[key] && value > THRESHOLDS[key]) {
            alerts.push(`High ${key}`);
        }
    }
    return alerts;
}



// List, add, modify or delete devices
function _Devices(req, res, q, data) {
    const sp = q.searchParams;
    const mac_address = sp.get("mac_address");

    // List all devices or specific device by id from database
    if (req.method == 'GET') {
        try{
            const db = new sqlite.DatabaseSync("./sensor_data.db", { open: false });
            db.open();

            if (mac_address == undefined) {
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

            else if (mac_address != undefined) {
                // Get a specific device by mac_address
                const sql = "SELECT * FROM Devices WHERE mac_address=:mac_address";

                const stmt = db.prepare(sql);
                const result = stmt.get({ mac_address });

                if (!result){
                    res.writeHead(404, { "Content-Type": "application/json" });
                    res.write(JSON.stringify({ message: `No device with mac_address=${mac_address} was found.` }));
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

    else if (req.method == 'POST') {
        try {
            if (data=='' || req.headers['content-type']!='application/json') {
                res.statusCode = 406; // not acceptable - trebamo JSON objekt
                res.statusMessage = "Not acceptable - missing JSON body";
                res.end();
                return true;
            }

            let params = data;
            const db = new sqlite.DatabaseSync("./sensor_data.db", { open: false });
            db.open();

            // Check if the device exists
            const checkDeviceSql = "SELECT * FROM Devices WHERE mac_address = :mac_address";
            const existingDevice = db.prepare(checkDeviceSql).get({ mac_address: params.mac_address });

            if (existingDevice) {
                // Error message - device already exists
                res.writeHead(400, { "Content-Type": "application/json" });
                res.write(JSON.stringify({ message: "Device already exists! No changes were made." }));
            } else {
                const insertSql = `
                INSERT INTO Devices (mac_address, device_name, location) 
                VALUES (:mac_address, :device_name, :location)
                `;
                const statement = db.prepare(insertSql)
                const result = statement.run(params);
                params['id'] = result.lastInsertRowid;
                res.writeHead(200, { "Content-Type": "application/json" });
                res.write(JSON.stringify({ message: "New device added successfully" }));
                //res.write(JSON.stringify(params));
            }
            res.end();
            db.close();
            return true;
        } catch (error) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.write(JSON.stringify({ message: "Internal Server Error: " + error.message}));
            res.end();
            return true;
        }
    }

    else if (req.method == 'PUT') {
        try {
            if (data=='' || req.headers['content-type']!='application/json') {
                res.statusCode = 406; // not acceptable - trebamo JSON objekt
                res.statusMessage = "Not acceptable - missing JSON body";
                res.end();
                return true;
            }

            let params = data;
            const db = new sqlite.DatabaseSync("./sensor_data.db", { open: false });
            db.open();

            const checkDeviceSql = "SELECT * FROM Devices WHERE mac_address = :mac_address";
            const existingDevice = db.prepare(checkDeviceSql).get({ mac_address: params.mac_address });

            if (existingDevice) {
                const insertSql = `
                UPDATE Devices 
                SET device_name = :device_name, location = :location 
                WHERE mac_address = :mac_address
                `;
                const statement = db.prepare(insertSql)
                const result = statement.run(params); // ovaj params mozda jebe
                res.writeHead(200, { "Content-Type": "application/json" });
                res.write(JSON.stringify({ message: "Device updated successfully" }));
                //res.write(JSON.stringify(params));
            } else {
                // Error message - device already exists
                res.writeHead(404, { "Content-Type": "application/json" });
                res.write(JSON.stringify({ message: "Device not found! No changes were made." }));
            } 
            res.end();
            db.close();
            return true;
        } catch (error) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.write(JSON.stringify({ message: "Internal Server Error: " + error.message }));
            res.end();
            return true;
        }
    }


    // Delete existing devices from database
    else if (req.method == 'DELETE') {
        try {
            if (data=='' || req.headers['content-type']!='application/json') {
                res.statusCode = 406; // not acceptable - trebamo JSON objekt
                res.statusMessage = "Not acceptable - missing JSON body";
                res.end();
                return true;
            }

            let params = data;
            const db = new sqlite.DatabaseSync("./sensor_data.db", { open: false });
            db.open();

            const checkDeviceSql = "SELECT * FROM Devices WHERE mac_address = :mac_address";
            const existingDevice = db.prepare(checkDeviceSql).get({ mac_address: params.mac_address });

            if (existingDevice){
                // Delete device with the provided MAC address
                const deleteSql = `
                Delete from Devices 
                WHERE mac_address = :mac_address
                `;

                db.prepare(deleteSql).run({ mac_address: params.mac_address });

                res.writeHead(200, { "Content-Type": "application/json" });
                res.write(JSON.stringify({ message: "Device deleted successfully." }));
            } else {
                // Error message, no device found
                res.writeHead(404, { "Content-Type": "application/json" });
                res.write(JSON.stringify({ message: `Device delete failed! No device with mac_address=${mac_address} was found.` }));
            }
        } catch (error) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.write(JSON.stringify({ message: "Internal Server Error: " + error.message}));
            res.end();
            return true;
        }
    } else {
        res.writeHead(405, { "Content-Type": "application/json" });
        res.write(JSON.stringify({ message: "Method not allowed." }));
        res.end();
        return true;
    }
}

// List or add sensor readings
function _SensorReadings(req, res, q, data) {
    const sp = q.searchParams;
    const device_id = sp.get("device_id");

    if (req.method == 'GET') {
        try {
            const db = new sqlite.DatabaseSync("./sensor_data.db", { open: false });
            db.open();

            if (device_id == undefined) {
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
            else {
            // Get the last 1000 readings from specific sensor by device_id
                const sql = `    
                    SELECT * FROM SensorReadings
                    WHERE device_id = :device_id
                    ORDER BY id DESC
                    LIMIT 100
                `;
                // const sql = `
                //     SELECT sr.*, d.mac_address, d.device_name, d.location
                //     FROM SensorReadings sr
                //     INNER JOIN Devices d ON sr.device_id = d.id
                //     WHERE sr.device_id = :device_id
                //     ORDER BY sr.id DESC
                //     LIMIT 1000  
                // `;
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

    else if (req.method == 'POST') {
        try {
            if (data=='' || req.headers['content-type']!='application/json') {
                res.statusCode = 406; // not acceptable - trebamo JSON objekt
                res.statusMessage = "Not acceptable - missing JSON body";
                res.end();
                return true;
            }

            let params = data;
            const db = new sqlite.DatabaseSync("./sensor_data.db", { open: false });
            db.open();

            // Find device by mac_address
            const deviceSql = "SELECT id FROM Devices WHERE mac_address = :mac_address";
            const deviceStmt = db.prepare(deviceSql);
            const device = deviceStmt.get({ mac_address: params.mac_address });

            // Deny request if no such device is found
            if (!device) {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.write(JSON.stringify({ message: `No device with mac_address = ${params.mac_address} found.` }));
                res.end();
                db.close();
                return true;
            }

            // Insert sensor readings
            const insertSql = `
                INSERT INTO SensorReadings (device_id, temperature, humidity, pm1, pm2_5, pm4, pm10, co2, voc, pressure, timestamp)
                VALUES (:device_id, :temperature, :humidity, :pm1, :pm2_5, :pm4, :pm10, :co2, :voc, :pressure, datetime('now', '+1 hour'))
            `;
            const insertStmt = db.prepare(insertSql);
            const result = insertStmt.run(
            {
                device_id: device.id,
                temperature: params.temperature,
                humidity: params.humidity,
                pm1: params.pm1,
                pm2_5: params.pm2_5,
                pm4: params.pm4,
                pm10: params.pm10,
                co2: params.co2,
                voc: params.voc,
                pressure: params.pressure
            });
            params['id'] = result.lastInsertRowid;

            // Update last_active timestamp in Devices table
            const updateDeviceSql = `
            UPDATE Devices
            SET last_active = datetime('now', '+1 hour')
            WHERE id = :device_id
            `;
            const updateDeviceStmt = db.prepare(updateDeviceSql);
            updateDeviceStmt.run({ device_id: device.id });

            // Update the Alerts table
            const alertSql = `
            INSERT INTO Alerts (device_id, alert_type, created_at)
            VALUES (:device_id, :alert_type, datetime('now', '+1 hour'))
            `;
            const alertStmt = db.prepare(alertSql);

            let alertMessage = ''

            if (params.temperature > THRESHOLDS.temperature) {
                alertStmt.run({ device_id: device.id, alert_type: 'High temperature' });
                alertMessage += 'Alert: High temperature '
            }
            if (params.humidity > THRESHOLDS.humidity) {
                alertStmt.run({ device_id: device.id, alert_type: 'High humidity' });
                alertMessage += 'Alert: High humidity '
            }
            if (params.co2 > THRESHOLDS.co2) {
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


/****************************************************************************************************************/
// OLD code

// devices via q param
    /*
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
    */

//sensor reading via q param
/*
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
        }*/