#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>
#include <time.h>
#include "main.h" // Include the main header

// MongoDB Atlas Data API details
const char* api_key = "GyI6vNMdJNHVvfXQtJ9oWv8Gas1nPVKrPp0LoPeCSHA5BIfFEBDJMbiI7lwAhlor";
const char* data_api_url = "https://ap-south-1.aws.data.mongodb-api.com/app/data-nlwmghl/endpoint/data/v1/action/insertOne";

// Your MongoDB Atlas cluster and database details
const char* cluster_name = "Flowter-Cluster";
const char* db_name = "FlowterDB";
const char* collection_name = "sensors";

std::unique_ptr<BearSSL::WiFiClientSecure> client(new BearSSL::WiFiClientSecure);

unsigned long previousMillis = 0;
const long interval = 10000; // interval at which to send data (milliseconds)

const char* ssid = ""; 
const char* password = ""; 

void setup() {
    Serial.begin(9600);
    delay(100);
    pinMode(input, INPUT);  // Set input pin mode

    // Connect to Wi-Fi
    connectToWiFi();
    client->setInsecure();
    sendDataToMongoDB();

}

void loop() {
    printWiFiStatus();
    server.handleClient();

    // If measuring, check if it's time to take a measurement
    // unsigned long currentTime = millis();
    // if (currentTime - lastMeasurementTime >= 1000) { // Check if 1 second has passed
    //     if (measuring) {
    //         handleMeasurement();
    //         lastMeasurementTime = currentTime; // Update the last measurement time
    //     }
    // }
      int X = pulseIn(input, HIGH);
      int Y = pulseIn(input, LOW);
      TIME = X + Y;
      FREQUENCY = 1000000 / TIME;
      WATER = FREQUENCY / calibration_factor;
      LS = WATER / 60;

      // Log sensor readings and calculations
      Serial.print("X: "); Serial.println(X);
      Serial.print("Y: "); Serial.println(Y);
      Serial.print("TIME: "); Serial.println(TIME);
      Serial.print("FREQUENCY: "); Serial.println(FREQUENCY);
      Serial.print("WATER: "); Serial.println(WATER);
      Serial.print("LS: "); Serial.println(LS);

      if (FREQUENCY >= 0 && !isinf(FREQUENCY)) {
          TOTAL += LS; // Accumulate total volume
          SUPPERTOTAL += LS;
      }

      // Log accumulated total
    Serial.print("TOTAL: "); Serial.println(TOTAL);
    Serial.print("SUPPERTOTAL: "); Serial.println(SUPPERTOTAL);

      // Check if it's time to send data
      unsigned long currentMillis = millis();
      if (currentMillis - previousMillis >= interval && !(measuring)) {
          previousMillis = currentMillis;
          Serial.print("calibration factor: "); Serial.println(calibration_factor);
          if (TOTAL <1.50 ){
            TOTAL = 0;
          }
          if (TOTAL>0){
          sendDataToMongoDB();
          TOTAL = 0; // Reset total after sending
          }
      }
}

void connectToWiFi() {
    Serial.print("Connecting to Wi-Fi");
    WiFi.begin(ssid, password);
    int retryCount = 0;
    while (WiFi.status() != WL_CONNECTED && retryCount < 20) {
        delay(500);
        Serial.print(".");
        retryCount++;
    }
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWiFi connected");
            // Configure the client to skip certificate validation for now (you might want to use proper validation in production)

    // Initialize time (NTP) to get actual date and time
    configTime(19800, 0, "pool.ntp.org", "time.nist.gov"); // UTC+5:30 offset (19800 seconds)

    // Wait for time synchronization
    waitForNTP();


    } else {
        Serial.println("\nFailed to connect to WiFi. Starting Access Point.");
        startAccessPoint();
    }
}

void startAccessPoint() {

    // Start the Access Point
    if (WiFi.softAP("ESP8266_AP")) {
        Serial.println("AP started successfully");
        Serial.println("AP name: ESP8266_AP");
        Serial.print("AP IP address: ");
        Serial.println(WiFi.softAPIP());
    } else {
        Serial.println("Failed to start AP");
    }
    // Configure server routes
    server.on("/", HTTP_GET, handleHomePage);
    server.on("/calibration", HTTP_GET, handleCalibrationPage);
    server.on("/calibration/results", HTTP_GET, handleCalibrationResultsPage); // New results page
    server.on("/setup", HTTP_GET, handleSetupPage);
    server.on("/save", HTTP_POST, handleSave);
    server.on("/disconnect", HTTP_GET, handleDisconnect);
    server.on("/start_measurement", HTTP_GET, handleStartMeasurement);
    server.on("/stop_measurement", HTTP_GET, handleStopMeasurement);

    server.begin(); // Start the server
}

void waitForNTP() {
    Serial.print("Waiting for NTP time sync");
    while (time(nullptr) < 8 * 3600 * 2) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nNTP time synchronized");
}

void sendDataToMongoDB() {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(*client, data_api_url);

        // Set headers
        http.addHeader("Content-Type", "application/json");
        http.addHeader("api-key", api_key);

        // Create JSON payload
        String payload = "{"
                         "\"collection\":\"" + String(collection_name) + "\","
                         "\"database\":\"" + String(db_name) + "\","
                         "\"dataSource\":\"" + String(cluster_name) + "\","
                         "\"document\":{"
                         "\"sid\":\"b1\","
                         "\"value\":" + String(TOTAL) + "," // Send accumulated total volume
                         "\"date\":\"" + getDate() + "\","
                         "\"time\":\"" + getTime() + "\""
                         "}"
                         "}";

        // Log payload
        Serial.print("Payload: "); Serial.println(payload);

        // Send POST request
        int httpResponseCode = http.POST(payload);

        // Print response
        if (httpResponseCode > 0) {
            String response = http.getString();
            Serial.println(httpResponseCode);
            Serial.println(response);
        } else {
            Serial.print("Error on sending POST: ");
            Serial.println(httpResponseCode);
            Serial.println(http.errorToString(httpResponseCode).c_str()); // Print the error string
        }

        http.end();
    } else {
        Serial.println("WiFi not connected");
    }
}

String getDate() {
    time_t now = time(nullptr);
    struct tm* p_tm = localtime(&now);
    char dateStr[11];
    snprintf(dateStr, sizeof(dateStr), "%04d-%02d-%02d", (p_tm->tm_year + 1900), (p_tm->tm_mon + 1), p_tm->tm_mday);
    return String(dateStr);
}

String getTime() {
    time_t now = time(nullptr);
    struct tm* p_tm = localtime(&now);
    char timeStr[9];
    snprintf(timeStr, sizeof(timeStr), "%02d:%02d:%02d", p_tm->tm_hour, p_tm->tm_min, p_tm->tm_sec);
    return String(timeStr);
}
