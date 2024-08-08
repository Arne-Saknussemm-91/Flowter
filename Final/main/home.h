#ifndef HOME_H
#define HOME_H

#include <ESP8266WebServer.h>

extern ESP8266WebServer server;

void handleHomePage() {
  const char* homePage = R"(
    <!DOCTYPE html>
    <html>
    <head>
      <title>Home</title>
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
        <h1>Home Page</h1>
        <a href="/calibration">Go to calibration Page</a>
        <br><br><br>
        <a href="/setup">Go to Setup Page</a>
      </div>
    </body>
    </html>
  )";
  
  server.send(200, "text/html", homePage);
}


#endif // HOME_H
