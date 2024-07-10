const WebSocket = require('ws');
const { MongoClient } = require('mongodb');

// Global variable to hold WebSocket clients
let clients = [];
const uri = "mongodb+srv://Prav:temp1234@flowter-cluster.2cescmv.mongodb.net/?retryWrites=true&w=majority&appName=Flowter-Cluster";
const mongoClient = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await mongoClient.connect();
        console.log("Connected to MongoDB");

        const wss = new WebSocket.Server({ port: 8000 });
        console.log('WebSocket server running on ws://0.0.0.0:8000');
        // WebSocket connection event
        wss.on('connection', function(ws) {
            console.log('Client connected.');
            clients.push(ws);
            ws.on('message', async function(message) {
                try {
                    const data = JSON.parse(message);
                    if (data.type=="sdata"){
                const jsonData = data;
                if (!jsonData || typeof jsonData !== 'object') {
                    throw new Error('Received invalid JSON data');
                }

                const sensorId = jsonData.id;
                const flowData = jsonData.total;
                const isoTimestamp = new Date().toISOString();
                const mongoDate = isoTimestamp.split('T')[0];
                const mongoTime = isoTimestamp.split('T')[1].split('.')[0];

                console.log('Received data from Arduino:');
                console.log('Sensor ID:', sensorId);
                console.log('Timestamp:', isoTimestamp);
                console.log('Flow Rate:', flowData);

                const db = mongoClient.db("FlowterDB");

                // Fetch sensor details from user collection
                const userCollection = db.collection('users');
                const user = await userCollection.findOne({ ["sensors." + sensorId]: { $exists: true } });
                if (!user) {
                    console.error(`User with sensor ID ${sensorId} not found`);
                    return;
                }

                const userName = user.username;
                const sensorName = user.sensors[sensorId].sensorname;
                const sensorLocation = user.sensors[sensorId].sensorlocation; // Assign sensorLocation here

                console.log('Sensor details:');
                console.log('User Name:', userName);
                console.log('Sensor Name:', sensorName);
                console.log('Sensor Location:', sensorLocation);

                const newReading = {
                    type: "curr",
                    sid: sensorId,
                    username: userName,
                    sensorname: sensorName,
                    sensorlocation: sensorLocation,
                    date: mongoDate,
                    time: mongoTime,
                    value: flowData
                };

                // Broadcast data to all connected clients
                clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(newReading));
                    }
                });

                const sensorCollection = db.collection('sensors');

                // Insert new data into the sensor collection
                await sensorCollection.insertOne(newReading);
                console.log('Inserted data into MongoDB for sensor:', sensorId);
                    }else{
                    // Use sensorLocation as needed
                    if (data.date) {
                        console.log('Received date from client:', data.date);

                        const db = mongoClient.db("FlowterDB");
                        const sensorId = 'b1'; // Example sensor ID, replace with actual logic
                        const sensorCollection = db.collection('sensors');

                        const query = { date: data.date, sid: sensorId };
                        const result = await sensorCollection.find(query).toArray();

                        if (result.length > 0) {
                            console.log(`Found ${result.length} document(s) for sensor ${sensorId}`);
                            let dataVal = 0; // Initialize dataVal
                            for (let i = 0; i < result.length; i++) {
                                dataVal += result[i].value;
                            }
                            const clickDateValue = { type: "date", date: data.date, value: dataVal };
                            console.log(clickDateValue);
                            ws.send(JSON.stringify(clickDateValue));
                        } else {
                            const clickDateValue = { type: "date", date: data.date, value: 0 };
                            console.log(clickDateValue);
                            ws.send(JSON.stringify(clickDateValue));
                        }
                    } else if (data.startDate && data.endDate) {
                        console.log('Received date range from client:', data.startDate, 'to', data.endDate);

                        const db = mongoClient.db("FlowterDB");
                        const sensorId = 'b1'; // Example sensor ID, replace with actual logic
                        const sensorCollection = db.collection('sensors');

                        const query = {
                            date: { $gte: data.startDate, $lte: data.endDate },
                            sid: sensorId
                        };
                        const result = await sensorCollection.find(query).toArray();

                        const monthValues = { type: "month", sensorlocation: '', dateValues: {} }; // Initialize with an empty string

                        if (result.length > 0) {
                            // Fetch sensorLocation from user document or sensor data
                            const userCollection = db.collection('users');
                            const user = await userCollection.findOne({ ["sensors." + sensorId]: { $exists: true } });
                            if (user) {
                                monthValues.sensorlocation = user.sensors[sensorId].sensorlocation;
                            }
                        }

                        // Initialize dateValues with default value 0 for all dates in the range
                        let currentDate = new Date(data.startDate);
                        const endDate = new Date(data.endDate);
                        while (currentDate <= endDate) {
                            const dateString = currentDate.toISOString().split('T')[0];
                            monthValues.dateValues[dateString] = 0;
                            currentDate.setDate(currentDate.getDate() + 1);
                        }

                        // Update dateValues with actual data from the database
                        result.forEach(reading => {
                            monthValues.dateValues[reading.date] += reading.value;
                        });

                        ws.send(JSON.stringify(monthValues));
                        console.log(monthValues);
                    }}
                } catch (error) {
                    console.error('Error handling client message:', error);
                }
            });

            ws.on('close', function() {
                console.log('Client disconnected.');
                clients = clients.filter(client => client.readyState === WebSocket.OPEN);
            });
        });

    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
    }
}

run().catch(console.error);

