const sqlite = require("node:sqlite");

let handlers = new Map();

// Handler to get all devices or specific device by id
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
        }/*
        else if (req.method == 'POST') {
            if (!mac_address || !device_name || !location) {
                res.statusCode = 400; // Bad Request
                res.statusMessage = "mac_address, device_name, and location are required.";
                res.end();
                return true;
            }
        
            const db = new sqlite.DatabaseSync("./sensor_data.db", { open: false });
            db.open();
        
            // Check if device exists
            const checkDeviceSql = "SELECT * FROM Devices WHERE mac_address = :mac_address";
            const checkDeviceStmt = db.prepare(checkDeviceSql);
            const existingDevice = checkDeviceStmt.get({ mac_address });
        
            if (existingDevice) {
                // Update device if exists
                const updateSql = `
                    UPDATE Devices 
                    SET device_name = :device_name, location = :location, last_active = CURRENT_TIMESTAMP 
                    WHERE mac_address = :mac_address
                `;
                const updateStmt = db.prepare(updateSql);
                updateStmt.run({ device_name, location, mac_address });
        
                res.writeHead(200, { "Content-Type": "application/json" });
                res.write(JSON.stringify({ message: "Device updated successfully" }));
            } else {
                // Insert new device if not found
                const insertSql = `
                    INSERT INTO Devices (mac_address, device_name, location) 
                    VALUES (:mac_address, :device_name, :location)
                `;
                const insertStmt = db.prepare(insertSql);
                insertStmt.run({ mac_address, device_name, location });
        
                res.writeHead(200, { "Content-Type": "application/json" });
                res.write(JSON.stringify({ message: "Device added successfully" }));
            }
        
            db.close();
            res.end();
            return true;
        }*/
        
    
    return false;
}

function _SensorReadings(req, res, q, data) {
    const sp = q.searchParams;
    const id = sp.get("id");
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
        const db = new sqlite.DatabaseSync("./sensor_data.db", { open: false });
        db.open();

        if (id) {
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
                res.statusCode = 404;
                res.statusMessage = "Sensor reading with id=${id} not found.";
                res.end();
                db.close();
                return true;
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            res.write(JSON.stringify(result));
        } else {
            // Get all sensor readings
            const sql = `
                SELECT sr.*, d.mac_address, d.device_name, d.location
                FROM SensorReadings sr
                INNER JOIN Devices d ON sr.device_id = d.id
                ORDER BY sr.timestamp DESC
            `;
            const stmt = db.prepare(sql);
            const result = stmt.all();

            res.writeHead(200, { "Content-Type": "application/json" });
            res.write(JSON.stringify(result));
        }

        db.close();
        res.end();
        return true;
    }

    if (req.method === 'POST') {
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


handlers.set("/devices", _Devices);
handlers.set("/sensor-readings", _SensorReadings);

module.exports = handlers;
