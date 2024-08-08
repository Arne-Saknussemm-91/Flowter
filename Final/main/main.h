#ifndef MAIN_H
#define MAIN_H

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include "home.h"
#include "calibration.h"
#include "setup.h"
#include "web_server.h"

// Your other includes...

ESP8266WebServer server(80); // Create a web server on port 80

// Global variables
const int input = 4;  // Use GPIO number directly if D2 is not defined
float calibration_factor = 39;
float new_calibration_factor = 0; // Variable to store the new calibration factor
float TOTAL = 0;  // Initialize total volume
bool measuring = false;  // Flag for measurement status
unsigned long lastMeasurementTime = 0;  // To track measurement timing
extern const char* ssid;
extern const char* password;
// Declare a global variable to store the previous Wi-Fi status
wl_status_t previousStatus = WL_IDLE_STATUS; // Initialize with an idle status
float TIME = 0;
float FREQUENCY = 0;
float WATER = 0;
float SUPPERTOTAL = 0;
float LS = 0;
// Measurement code
// void handleMeasurement() {

//     // Simulate the WATER and LS calculations based on the random value
//       int X = pulseIn(input, HIGH);
//       int Y = pulseIn(input, LOW);
//       TIME = X + Y;
//       FREQUENCY = 1000000 / TIME;
//       WATER = FREQUENCY / calibration_factor;
//       LS = WATER / 60;

//     if (WATER >= 0) {
//         TOTAL += LS; // Accumulate total volume
//     }
//     Serial.print("TOTAL: "); Serial.println(TOTAL);
// }

void handleStartMeasurement() {
    if (!measuring) {
        measuring = true;
        TOTAL = 0; // Reset TOTAL for a new session
        Serial.println("Measurement started");
        server.send(200, "text/plain", "Measurement started");
    } else {
        server.send(400, "text/plain", "Measurement is running");
    }
}

void handleStopMeasurement() {
    if (measuring) {
        measuring = false;
        float new_calibration_factor = TOTAL; // Calculate the new calibration factor
        Serial.print("New Calibration Factor: "); Serial.println(new_calibration_factor);
        Serial.println("Measurement stopped");
        String response = String(calibration_factor) + "," + String(new_calibration_factor);
        server.send(200, "text/plain", response);
        calibration_factor = new_calibration_factor; // Update calibration factor
    } else {
        server.send(400, "text/plain", "Measurement is not running");
    }
}

void printWiFiStatus() {
    // Get the current Wi-Fi status
    wl_status_t currentStatus = WiFi.status();

    // Check if the current status is different from the previous status
    if (currentStatus != previousStatus) {
        if (currentStatus == WL_CONNECTED) {
            Serial.print("Connected to Wi-Fi. IP Address: ");
            Serial.println(WiFi.localIP());
        } else {
            Serial.println("Not connected to Wi-Fi.");
        }
        // Update the previous status to the current status
        previousStatus = currentStatus;
    }
    delay(500);
}

// Function declarations for Wi-Fi connection and AP
void connectToWiFi();
void startAccessPoint();

#endif // MAIN_H
