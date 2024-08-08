#ifndef SETUP_H
#define SETUP_H

#include <ESP8266WebServer.h>

extern ESP8266WebServer server;

void handleSetupPage() {
  const char* setupPage = R"(
    <!DOCTYPE html>
    <html>
    <head>
      <title>Setup</title>
      <style>
        body {
          background-color: black;
          color: white;
          font-family: Arial, sans-serif;
          margin: 0;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .container {
          text-align: center;
        }
        h1 {
          color: #f1c40f;
        }
        label {
          display: block;
          margin: 10px 0 5px;
        }
        input[type="text"], input[type="password"] {
          padding: 10px;
          border: 1px solid #3498db;
          border-radius: 5px;
          background-color: black;
          color: white;
          margin-bottom: 10px;
        }
        input[type="submit"] {
          padding: 10px 20px;
          border: 1px solid #3498db;
          border-radius: 5px;
          background-color: #3498db;
          color: black;
          cursor: pointer;
        }
        input[type="submit"]:hover {
          background-color: #f1c40f;
        }
        a {
          color: #3498db;
          text-decoration: none;
          padding: 10px;
          border: 1px solid #3498db;
          border-radius: 5px;
          background-color: black;
        }
        a:hover {
          background-color: #3498db;
          color: black;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Setup Page</h1>
        <form action="/save" method="POST">
          <label for="ssid">SSID:</label>
          <input type="text" id="ssid" name="ssid"><br>
          <label for="password">Password:</label>
          <input type="password" id="password" name="password"><br>
          <input type="submit" value="Save">
        </form>
        <br>
        <a href="/">Go to home Page</a>
      </div>
    </body>
    </html>
  )";

  server.send(200, "text/html", setupPage);
}

void handleSave() {
  String ssid = server.arg("ssid");
  String password = server.arg("password");

  // Attempt to connect to Wi-Fi
  WiFi.begin(ssid.c_str(), password.c_str());
  Serial.print("Connecting to Wi-Fi");
  Serial.print("SSID: "); Serial.println(ssid);
  Serial.print("PASSWORD: "); Serial.println(password);
  int retryCount = 0;
  while (WiFi.status() != WL_CONNECTED && retryCount < 20) {
    delay(500);
    Serial.print(".");
    retryCount++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected");
    
    // Display success message with disconnect option
    const char* savePage = R"(
      <!DOCTYPE html>
      <html>
      <head>
        <title>Credentials Saved</title>
        <style>
          body {
            background-color: black;
            color: white;
            font-family: Arial, sans-serif;
            margin: 0;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .container {
            text-align: center;
          }
          h1 {
            color: #f1c40f;
          }
          a {
            color: #3498db;
            text-decoration: none;
            padding: 10px;
            border: 1px solid #3498db;
            border-radius: 5px;
            background-color: black;
            cursor: pointer;
          }
          a:hover {
            background-color: #3498db;
            color: black;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Credentials Saved</h1>
          <a href='/disconnect'>Disconnect</a>
          <br><br><br>
          <a href='/setup'>Back</a>
        </div>
      </body>
      </html>
    )";

    server.send(200, "text/html", savePage);
  } else {
    // Connection failed, display error message
    Serial.println("\nFailed to connect to WiFi");
    const char* errorPage = R"(
      <!DOCTYPE html>
      <html>
      <head>
        <title>Connection Failed</title>
        <style>
          body {
            background-color: black;
            color: white;
            font-family: Arial, sans-serif;
            margin: 0;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .container {
            text-align: center;
          }
          h1 {
            color: #f1c40f;
          }
          a {
            color: #3498db;
            text-decoration: none;
            padding: 10px;
            border: 1px solid #3498db;
            border-radius: 5px;
            background-color: black;
          }
          a:hover {
            background-color: #3498db;
            color: black;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Error: Failed to Connect to Wi-Fi</h1>
          <a href='/setup'>Back to Setup</a>
        </div>
      </body>
      </html>
    )";

    server.send(200, "text/html", errorPage); // Send the error response
  }
}

void handleDisconnect() {
  // Display disconnection confirmation
  const char* disconnectPage = R"(
    <!DOCTYPE html>
    <html>
    <head>
      <title>Disconnected</title>
      <style>
        body {
          background-color: black;
          color: white;
          font-family: Arial, sans-serif;
          margin: 0;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .container {
          text-align: center;
        }
        h1 {
          color: #f1c40f;
        }
        a {
          color: #3498db;
          text-decoration: none;
          padding: 10px;
          border: 1px solid #3498db;
          border-radius: 5px;
          background-color: black;
        }
        a:hover {
          background-color: #3498db;
          color: black;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Disconnected</h1>
        <p>The Access Point has been successfully disconnected.</p>
        <p>Feel free to close the tab.</p>
      </div>
    </body>
    </html>
  )";
  server.send(200, "text/html", disconnectPage);
  delay(1000);
    // Disconnect the Access Point
  WiFi.softAPdisconnect(true);
  Serial.println("AP disconnected");
}

void registerRoutes() {
  server.on("/setup", HTTP_GET, handleSetupPage);
  server.on("/save", HTTP_POST, handleSave);
  server.on("/disconnect", HTTP_GET, handleDisconnect);
}

#endif // SETUP_H
