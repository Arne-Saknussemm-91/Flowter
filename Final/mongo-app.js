const WebSocket = require('ws');
const { MongoClient, ObjectId } = require('mongodb');

// WebSocket server initialization
const wss = new WebSocket.Server({ port: 8000 });
console.log('WebSocket server running on ws://0.0.0.0:8000');

// MongoDB Atlas connection URI
const uri = "mongodb+srv://Prav:temp1234@flowter-cluster.2cescmv.mongodb.net/?retryWrites=true&w=majority";
const mongoClient = new MongoClient(uri);

// Global array to hold WebSocket clients
let clients = [];

// Function to handle WebSocket connections and messages
async function handleWebSocket() {
    try {
        // Connect to MongoDB
        await mongoClient.connect();
        console.log("Connected to MongoDB");

        // WebSocket connection event
        wss.on('connection', function(ws) {
            console.log('Client connected.');
            clients.push(ws);

            // WebSocket message event
            ws.on('message', async function(message) {
                try {
                    const data = JSON.parse(message);

                    if (data.date) {
                        console.log('Received date from client:', data.date);
                        await handleDateQuery(data.date, ws);
                    } else if (data.startDate && data.endDate) {
                        console.log('Received date range from client:', data.startDate, 'to', data.endDate);
                        await handleDateRangeQuery(data.startDate, data.endDate, ws);
                    }
                } catch (error) {
                    console.error('Error handling client message:', error);
                }
            });

            // WebSocket close event
            ws.on('close', function() {
                console.log('Client disconnected.');
                clients = clients.filter(client => client.readyState === WebSocket.OPEN);
            });
        });

        // Start listening to MongoDB changes
        listenToChanges().catch(console.error);

    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
    }
}

// Function to handle fetching data for a specific date
async function handleDateQuery(date, ws) {
    try {
        const db = mongoClient.db("FlowterDB");
        const sensorId = 'b1'; // Example sensor ID, replace with actual logic
        const sensorCollection = db.collection('sensors');

        const query = { date: date, sid: sensorId };
        const result = await sensorCollection.find(query).toArray();

        if (result.length > 0) {
            console.log(`Found ${result.length} document(s) for sensor ${sensorId}`);
            let dataVal = 0;
            for (let i = 0; i < result.length; i++) {
                dataVal += result[i].value;
            }
            const clickDateValue = { type: "date", date: date, value: dataVal };
            console.log(clickDateValue);
            ws.send(JSON.stringify(clickDateValue));
        } else {
            const clickDateValue = { type: "date", date: date, value: 0 };
            console.log(clickDateValue);
            ws.send(JSON.stringify(clickDateValue));
        }
    } catch (error) {
        console.error('Error handling date query:', error);
    }
}

// Function to handle fetching data for a date range
async function handleDateRangeQuery(startDate, endDate, ws) {
    try {
        const db = mongoClient.db("FlowterDB");
        const sensorId = 'b1'; // Example sensor ID, replace with actual logic
        const sensorCollection = db.collection('sensors');

        const query = {
            date: { $gte: startDate, $lte: endDate },
            sid: sensorId
        };
        const result = await sensorCollection.find(query).toArray();

        const monthValues = { type: "month", sensorlocation: '', dateValues: {} };

        if (result.length > 0) {
            const userCollection = db.collection('users');
            const user = await userCollection.findOne({ ["sensors." + sensorId]: { $exists: true } });
            if (user) {
                monthValues.sensorlocation = user.sensors[sensorId].sensorlocation;
            }
        }

        let currentDate = new Date(startDate);
        const endDateObj = new Date(endDate);
        while (currentDate <= endDateObj) {
            const dateString = currentDate.toISOString().split('T')[0];
            monthValues.dateValues[dateString] = 0;
            currentDate.setDate(currentDate.getDate() + 1);
        }

        result.forEach(reading => {
            monthValues.dateValues[reading.date] += reading.value;
        });

        ws.send(JSON.stringify(monthValues));
        console.log(monthValues);
    } catch (error) {
        console.error('Error handling date range query:', error);
    }
}

// Function to listen for new data from MongoDB and broadcast to clients
async function listenToChanges() {
    const db = mongoClient.db("FlowterDB");
    const sensorCollection = db.collection('sensors');

    const changeStream = sensorCollection.watch();

    changeStream.on('change', async function(change) {
        console.log('Change detected in MongoDB:', change);

        try {
            const newData = change.fullDocument;
            if (!newData || !newData.sid) {
                throw new Error('Invalid or missing document from MongoDB change stream');
            }

            // Prepare new reading data
            const newReading = {
                type: "curr",
                sid: newData.sid,
                date: newData.date,
                time: newData.time,
                value: newData.value
            };

            // Broadcast new reading data to all connected clients
            clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(newReading));
                }
            });

            console.log('Broadcasted new reading data to clients:', newReading);
        } catch (error) {
            console.error('Error processing MongoDB change event:', error);
        }
    });

    changeStream.on('error', function(error) {
        console.error('Error in MongoDB change stream:', error);
    });
}

// Start WebSocket server and handle connections/messages
handleWebSocket().catch(console.error);
