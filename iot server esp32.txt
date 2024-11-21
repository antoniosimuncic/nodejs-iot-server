To je odličan izbor za projekt! IoT (Internet of Things) primena sa senzorima kao što su temperatura, vlažnost, VOC (Volatile Organic Compounds), CO2, tlak i čestice (PM) može biti veoma interesantna za implementaciju, a integracija sa serverom i bazom podataka daje mnoge mogućnosti za proširenje i analizu podataka.

### 1. **Pregled projekta**
U ovom slučaju, tvoje IoT uređaje (ESP32-S3) prikupljaju podatke sa senzora i šalju ih na server koji će ih skladištiti u SQLite bazu podataka. Server će omogućiti interakciju sa podacima, kao i pregled statusa senzora u realnom vremenu.

- **Tablice u bazi:**
  - **Senzori**: Tablica koja sadrži informacije o svakom senzoru (tip senzora, lokacija, jedinstveni ID).
  - **Podaci**: Tablica koja sadrži sve očitane podatke sa senzora (vreme očitanja, vrednosti senzora).
  - **Lokacije** (opciono): Ako su tvoji senzori raspoređeni na više lokacija, možeš imati tablicu za to.

### 2. **Struktura baze podataka**
Prvo, potrebno je dizajnirati SQL bazu. U ovom slučaju, koristićemo SQLite jer je lako implementirati u ovakvim projektima.

#### SQL DDL za tabelu:

```sql
-- Tablica koja sadrži informacije o senzorima
CREATE TABLE senzori (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tip TEXT NOT NULL,            -- Tip senzora (temp, vlaga, CO2...)
    lokacija TEXT,                -- Lokacija senzora
    jedinstveni_id TEXT UNIQUE    -- Jedinstveni identifikator senzora
);

-- Tablica za pohranu očitanih podataka
CREATE TABLE podaci (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    senzor_id INTEGER,            -- ID senzora iz tablice 'senzori'
    vreme DATETIME DEFAULT CURRENT_TIMESTAMP,  -- Vreme kada je očitan podatak
    temperatura REAL,
    vlaga REAL,
    voc REAL,
    co2 REAL,
    tlak REAL,
    pm REAL,
    FOREIGN KEY(senzor_id) REFERENCES senzori(id)
);

-- (Opcionalno) Tablica za pohranu lokacija ako je potrebno
CREATE TABLE lokacije (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    naziv TEXT,
    opis TEXT
);
```

### 3. **ESP32-S3 i JS Server (Node.js)**

#### a) **ESP32-S3 kod** (Koristeći Arduino ili ESP-IDF)
ESP32 će prikupljati podatke sa senzora (npr. temperatura, vlažnost, CO2, itd.) i slati ih na server putem HTTP ili MQTT protokola. U ovom primeru ćemo koristiti **HTTP POST** za slanje podataka.

**Arduino kod za ESP32:**

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>  // Za temperaturne i vlažne senzore (ako koristite DHT senzor)

const char* ssid = "tvojaWiFi";
const char* password = "tvojaLozinka";
const char* serverUrl = "http://tvoj-server.com/api/senzori"; // Tvoj API endpoint

DHT dht(4, DHT22);  // DHT senzor spojen na pin 4

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }

  Serial.println("Connected to WiFi");
  dht.begin();
}

void loop() {
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  
  if (isnan(temp) || isnan(hum)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }

  // Kreiraj JSON objekat sa podacima koje šalješ
  String jsonData = "{";
  jsonData += "\"temperatura\": " + String(temp) + ",";
  jsonData += "\"vlaga\": " + String(hum) + ",";
  jsonData += "\"co2\": " + String(random(400, 800)) + ",";  // Simuliraj CO2 vrednosti
  jsonData += "\"pm\": " + String(random(10, 50)) + "}";
  jsonData += "}";

  // Pošaljite podatke na server
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  int httpResponseCode = http.POST(jsonData);

  if (httpResponseCode > 0) {
    Serial.println("Data sent successfully");
  } else {
    Serial.println("Error sending data");
  }
  
  http.end();
  delay(10000);  // Pošaljite podatke svakih 10 sekundi
}
```

- Ovaj kod koristi DHT22 senzor kao primer za temperaturu i vlažnost, ali možete dodati i ostale senzore kao što su CO2, PM (čestice), itd.
- Podaci se šalju u JSON formatu serveru putem HTTP POST.

#### b) **Node.js Server**
Server koji prima podatke sa ESP32, obrađuje ih i sprema u SQLite bazu. Koristićemo Express.js za izradu API-ja.

**Instalacija potrebnih paketa:**

```bash
npm install express sqlite3 body-parser
```

**Node.js kod za server:**

```javascript
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

const db = new sqlite3.Database('./senzori.db');

// Middleware za parsiranje JSON-a
app.use(bodyParser.json());

// API endpoint za prijem podataka sa ESP32
app.post('/api/senzori', (req, res) => {
  const { temperatura, vlaga, co2, pm } = req.body;

  // Umetanje podataka u bazu
  const stmt = db.prepare('INSERT INTO podaci (temperatura, vlaga, co2, pm) VALUES (?, ?, ?, ?)');
  stmt.run(temperatura, vlaga, co2, pm, function(err) {
    if (err) {
      res.status(500).json({ error: 'Došlo je do greške prilikom unosa podataka' });
      return;
    }
    res.status(200).json({ message: 'Podaci su uspešno uneseni' });
  });
  stmt.finalize();
});

// Pokretanje servera
app.listen(port, () => {
  console.log(`Server je pokrenut na http://localhost:${port}`);
});
```

### 4. **Testiranje i integracija**
1. Pokrenite Node.js server.
2. ESP32 će svakih nekoliko sekundi slati podatke na server.
3. Server prima te podatke i sprema ih u SQLite bazu.
4. Po želji, možete implementirati GET API endpoint za pregled svih podataka.

**GET endpoint za dohvat svih podataka:**

```javascript
app.get('/api/podaci', (req, res) => {
  db.all('SELECT * FROM podaci ORDER BY vreme DESC LIMIT 10', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Došlo je do greške prilikom dohvaćanja podataka' });
      return;
    }
    res.json(rows);
  });
});
```

### 5. **Dodatna proširenja**
- **Web interfejs**: Možete napraviti frontend aplikaciju koja će prikazivati podatke u realnom vremenu (npr. pomoću React-a ili plain HTML/JS).
- **Alati za analizu**: Dodavanje funkcionalnosti za analizu podataka, npr. grafikon temperature, CO2 koncentracije, itd.

### 6. **Zaključak**
Ovaj projekt omogućava prikupljanje, slanje i pohranjivanje podataka sa IoT senzora, a koristići Node.js i SQLite kao backend, dobijaš jednostavan, skalabilan sistem za pohranu podataka. Ovaj sistem može biti proširen sa dodatnim senzorima, funkcionalnostima za analizu podataka ili vizualizacijom u stvarnom vremenu.
