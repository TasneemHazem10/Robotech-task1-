# RoboTech IoT Dashboard (MVP)

A minimal IoT dashboard built for the RoboTech technical task. It receives temperature and
humidity readings from a public MQTT broker, stores them in MySQL (XAMPP), and displays the
latest reading on a web dashboard and a React Native mobile app.

Plain PHP was chosen instead of Laravel because this MVP only needs one receiver script and one
JSON endpoint. There are no Composer packages, no build step for the backend, and no login or
other features outside the required flow.

## How it works

```
HiveMQ public broker
        |
        |  MQTT (TCP, port 1883)
        v
backend/subscriber.php  --->  MySQL: robotech_farm.sensor_readings
                                      ^
                                      |
                            backend/api.php (JSON)
                              ^               ^
                     web dashboard      React Native app
```

The flow is exactly the required one: **receive data -> store data -> display data**.

## Project structure

```
RoboTech(app_task)/
|-- database.sql              Creates the database and the sensor_readings table
|-- run-subscriber.bat        Starts the PHP MQTT receiver on Windows
|-- backend/
|   |-- config.php            Database and MQTT settings (edit here if needed)
|   |-- db.php                Shared PDO database connection
|   |-- mqtt.php              Small MQTT 3.1.1 client written with PHP sockets
|   |-- subscriber.php        Long-running receiver: MQTT -> validation -> MySQL
|   `-- api.php               JSON endpoint: latest reading from MySQL
|-- web/
|   |-- index.html            Web dashboard markup
|   |-- style.css             Web dashboard styles
|   `-- app.js                Fetches the latest reading every 3 seconds
`-- mobile/
    |-- App.js                React Native dashboard screen
    |-- config.js             Builds the backend URL automatically
    |-- app.json              Expo app configuration
    |-- index.js              Expo entry point
    `-- package.json          Mobile dependencies and scripts
```

## Requirements

- XAMPP with **Apache** and **MySQL** running (PHP 8.0 or newer).
- Node.js 20 or newer for the React Native app.
- Expo Go on an Android or iOS phone, or an emulator.
- Internet access for the public HiveMQ broker and for installing npm packages.

## 1. Create the database

**Option A - phpMyAdmin (recommended)**

1. Open <http://localhost/phpmyadmin>.
2. Click **Import**.
3. Choose `database.sql` from this project and click **Go**.

**Option B - command line (PowerShell)**

```powershell
Get-Content database.sql -Raw | C:\xampp\mysql\bin\mysql.exe -u root
```

This creates the database `robotech_farm` and the table `sensor_readings`. Existing databases are
not touched. The default XAMPP MySQL user is `root` with an empty password; if your setup is
different, update `backend/config.php`.

## 2. Start the MQTT receiver

The PHP receiver must stay running to receive messages:

- **Windows:** double-click `run-subscriber.bat`.
- **Or from a terminal:**

```powershell
C:\xampp\php\php.exe backend\subscriber.php
```

Expected output:

```
[2026-10-23 10:12:00] Starting RoboTech MQTT subscriber for topic: robotech/smart-farm/readings
[2026-10-23 10:12:01] Connected to broker.hivemq.com:1883 as robotech_php_8990d071
```

Keep this window open. The script reconnects automatically if the connection drops.

## 3. Publish a test reading

**MQTT broker:** `broker.hivemq.com`
**MQTT topic:** `robotech/smart-farm/readings`

Use the free [HiveMQ WebSocket Client](https://www.hivemq.com/demos/websocket-client/):

1. Keep the default connection settings (host `broker.hivemq.com`, secure WebSocket port `8884`,
   path `/mqtt`). If the connection fails, try the plain WebSocket port `8000` with SSL disabled.
2. Click **Connect**.
3. In the **Publish** section, set the topic to `robotech/smart-farm/readings`.
4. Set the message to the JSON below and click **Publish**:

```json
{"temp": 25, "humidity": 60}
```

The receiver terminal should print:

```
[2026-10-23 10:12:37] Stored reading: temperature=25 humidity=60
```

Send another message such as `{"temp": 31.5, "humidity": 48}` to see the dashboard update.

> The topic and broker are configured in `backend/config.php`. The key names `temp` and
> `humidity` are the ones from the task example.

## 4. Open the web dashboard

Make sure Apache is running, then open:

```
http://localhost/RoboTech(app_task)/web/
```

The page refreshes every 3 seconds and shows the newest stored reading. If no message has been
stored yet, it shows `--` and "Waiting for sensor data...".

## 5. Run the mobile app

```powershell
cd mobile
npm install
npx expo start
```

Scan the QR code with **Expo Go** (Android) or the **Camera** app (iOS). The phone and the
computer must be on the same Wi-Fi network.

The app reads the computer's LAN address from Expo automatically. If it cannot connect:

1. Open `mobile/config.js`.
2. Set `manualHost` to the computer's IPv4 address (for example `192.168.1.6`).
3. Allow `httpd.exe` (Apache) through the Windows Firewall for private networks.
4. Test the API from the phone browser:
   `http://YOUR-PC-IP/RoboTech(app_task)/backend/api.php?action=latest`.

If your XAMPP folder has a different name, update the URL path in `mobile/config.js` too.

## API

`GET backend/api.php?action=latest`

Example response:

```json
{
  "temperature": 25,
  "humidity": 60,
  "created_at": "2026-10-23 10:12:37"
}
```

Before the first reading is stored:

```json
{
  "temperature": null,
  "humidity": null,
  "created_at": null
}
```

## Troubleshooting

| Problem | Check |
| --- | --- |
| Dashboard shows "Cannot reach the backend" | Apache is running, and the URL uses the correct folder name. |
| Dashboard shows "Waiting for sensor data..." | The subscriber window is running, the topic is exactly `robotech/smart-farm/readings`, and a message was published. |
| PHP receiver prints a database error | MySQL is running and `database.sql` was imported into `robotech_farm`. |
| Mobile app cannot reach the API | Phone and computer are on the same Wi-Fi; the firewall allows Apache; `manualHost` is the computer's LAN IP. |
| HiveMQ disconnects | The public broker can drop idle or busy clients; the receiver reconnects every 3 seconds automatically. |
| Timestamps look different | `created_at` is stored in the MySQL server's local time zone. |

## Notes

This MVP uses a free public broker and a public topic with no authentication, which is enough for
testing the required flow. For a real farm deployment, the broker would need authentication, TLS,
and a private topic.

## Publish the source code to GitHub

The project is ready to commit. From the project root:

```powershell
git init
git add .
git commit -m "RoboTech IoT dashboard MVP"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

`node_modules`, Expo cache, and log files are already excluded by `.gitignore`.
