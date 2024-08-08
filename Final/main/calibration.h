#ifndef CALIBRATION_H
#define CALIBRATION_H

#include <ESP8266WebServer.h>

extern ESP8266WebServer server;
extern float calibration_factor;      // Declare the calibration_factor variable
extern float new_calibration_factor;  // Declare a variable for the new calibration factor

void handleCalibrationPage() {
  const char* calibrationPage = R"(
    <!DOCTYPE html>
    <html>
    <head>
      <title>Calibration</title>
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
        a, button {
          color: #3498db;
          text-decoration: none;
          padding: 10px;
          border: 1px solid #3498db;
          border-radius: 5px;
          background-color: black;
        }
        a:hover, button:hover {
          background-color: #3498db;
          color: black;
        }
        button {
         margin: 10px; /* Add margin to buttons */
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Calibration Page</h1>
        <p>Old Calibration Factor: <span id="oldFactor">%OLD_FACTOR%</span></p>
        <p style="display:none;">New Calibration Factor: <span id="newFactor">%NEW_FACTOR%</span></p>
        <button onclick='startMeasurement()'>Start Measurement</button>
        <button onclick='stopMeasurement()'>Stop Measurement</button>
        <br><br>
        <a href="/">Go to Home Page</a>
      </div>
<script>
  function startMeasurement() {
    fetch('/start_measurement').catch(err => console.error('Error starting measurement:', err));
  }

function stopMeasurement() {
  fetch('/stop_measurement')
    .then(response => {
      if (response.ok) {
        return response.text(); // Get the response text, which contains both factors
      } else {
        throw new Error('Error stopping measurement: ' + response.statusText);
      }
    })
    .then(data => {
      // Split the response to get the calibration factors
      const [oldCalibrationFactor, newCalibrationFactor] = data.split(',');
      // Store the calibration factors in localStorage
      localStorage.setItem('oldCalibrationFactor', oldCalibrationFactor.trim());
      localStorage.setItem('newCalibrationFactor', newCalibrationFactor.trim());
      // Redirect to results page
      window.location.href = '/calibration/results';
    })
    .catch(err => console.error('Error stopping measurement:', err));
}


</script>
    </body>
    </html>
  )";

  // Send the calibration page with the current calibration factor
  String page = calibrationPage;
  page.replace("%OLD_FACTOR%", String(calibration_factor).c_str());
  server.send(200, "text/html", page);
}

void handleCalibrationResultsPage() {
  const char* resultsPage = R"(
    <!DOCTYPE html>
    <html>
    <head>
      <title>Calibration Results</title>
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
        <h1>Calibration Results</h1>
    <p>Old Calibration Factor: <span id="oldFactor">N/A</span></p>
    <p>New Calibration Factor: <span id="newFactor">N/A</span></p>
            <br>
        <a href='/calibration'>Back to Calibration</a>
        <br><br>
        <a href="/">Go to Home Page</a>
      </div>
        <script>
    // Retrieve the old and new calibration factors from localStorage
    const oldFactor = localStorage.getItem('oldCalibrationFactor');
    const newFactor = localStorage.getItem('newCalibrationFactor');
    document.getElementById('oldFactor').innerText = oldFactor ? oldFactor : 'N/A';
    document.getElementById('newFactor').innerText = newFactor ? newFactor : 'N/A';
  </script>
    </body>
    </html>
  )";

  // Send the results page with both factors
  String page = resultsPage;
  server.send(200, "text/html", page);
}

void handleStartMeasurement();
void handleStopMeasurement();

// void registerRoutes() {
//   server.on("/start_measurement", HTTP_GET, handleStartMeasurement);
//   server.on("/stop_measurement", HTTP_GET, handleStopMeasurement);
//   server.on("/calibration/results", HTTP_GET, handleCalibrationResultsPage); // New results page
// }

#endif  // CALIBRATION_H
