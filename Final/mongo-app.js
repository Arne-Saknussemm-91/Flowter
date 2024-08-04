const WebSocket = require('ws');
const { MongoClient } = require('mongodb');

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

                    if (data.type === 'date') {
                        console.log('Received date from client:', data.date);
                        await handleDateQuery(data.date,  data.toaffect,ws);
                    } else if (data.type === 'daterange') {
                        console.log('Received date range from client:', data.startDate, 'to', data.endDate);
                        await handleDateRangeQuery(data.startDate, data.endDate, data.toaffect, ws);
                    } else if (data.type === 'time') {
                        console.log('Received time range from client:', data.date, data.startTime, 'to', data.endTime);
                        await handleTimeRangeQuery(data.date, data.startTime, data.endTime, data.toaffect, data.timeType, ws);
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
        // listenToChanges().catch(console.error);

    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
    }
}

// Function to handle fetching data for a specific date
async function handleDateQuery(date, toaffect, ws) {
    try {
        const db = mongoClient.db("FlowterDB");
        const sensorId = 'b1'; // Example sensor ID, replace with actual logic
        const sensorCollection = db.collection('sensors');

        // Construct the start and end Date objects
        const startDateTime = new Date(`${date}T00:00:00Z`);
        const endDateTime = new Date(`${date}T23:59:59Z`);

        // Construct the MongoDB query
        const query = {
            date: date
        };

        console.log('MongoDB query:', query);

        // Fetch the results from MongoDB
        const result = await sensorCollection.find(query).toArray();
// console.log('MongoDB result:', result);

        // Function to generate time intervals based on timeType
        function generateIntervals(start, end, intervalMs) {
            let intervals = [];
            let current = new Date(start);
            while (current < end) {
                let next = new Date(current.getTime() + intervalMs);
                intervals.push({ start: current.toISOString(), end: next.toISOString() });
                current = next;
            }
            return intervals;
        }

        let intervals = [];
        let intervalMs;
        intervalMs = 60 * 60 * 1000; // 1 hour
        intervals = generateIntervals(startDateTime, endDateTime, intervalMs);
//         console.log(intervals);
        const timeValues = { type: "date", toaffect: toaffect, date: date, startTime: "00:00:00", endTime: "23:59:59", values: [] };

        // Initialize the timeValues with zeroes
        intervals.forEach(interval => {
            timeValues.values.push({ start: interval.start, end: interval.end, value: 0 });
        });

        // Populate timeValues with data from result
        result.forEach(reading => {
            const readingDateTime = new Date(`${reading.date}T${reading.time}Z`);
            timeValues.values.forEach(interval => {
                const intervalStart = new Date(interval.start);
                const intervalEnd = new Date(interval.end);
                if (readingDateTime >= intervalStart && readingDateTime < intervalEnd) {
                    interval.value += reading.value;
                }
            });
        });

        // Calculate the total value
        const totval = timeValues.values.reduce((sum, interval) => sum + interval.value, 0);

        // Include totval in the data sent via WebSocket
        const response = { ...timeValues, totval };
        ws.send(JSON.stringify(response));
//         console.log(response);
    } catch (error) {
        console.error('Error handling time range query:', error.message);
        console.error('Date:', date);
    }
}

// Function to handle fetching data for a date range
async function handleDateRangeQuery(startDate, endDate, toaffect, ws) {
    try {
        const db = mongoClient.db("FlowterDB");
        const sensorId = 'b1'; // Example sensor ID, replace with actual logic
        const sensorCollection = db.collection('sensors');

        const query = {
            date: { $gte: startDate, $lte: endDate }
        };

        console.log('MongoDB query:', query);

        const result = await sensorCollection.find(query).toArray();
//         console.log('Fetched result:', result);

        const monthValues = { type: "month", toaffect: toaffect, sensorlocation: '', dateValues: {} };

        if (result.length > 0) {
            const userCollection = db.collection('users');
            const user = await userCollection.findOne({ ["sensors." + sensorId]: { $exists: true } });
            if (user) {
                monthValues.sensorlocation = user.sensors[sensorId].sensorlocation;
            }
        }

        let currentDate = new Date(startDate);
        while (currentDate <= new Date(endDate)) {
            const dateString = currentDate.toISOString().split('T')[0];
            monthValues.dateValues[dateString] = 0;
            currentDate.setDate(currentDate.getDate() + 1);
        }

        result.forEach(reading => {
            const dateKey = reading.date;
            monthValues.dateValues[dateKey] = (monthValues.dateValues[dateKey] || 0) + reading.value;
        });

        ws.send(JSON.stringify(monthValues));
//         console.log(monthValues);
    } catch (error) {
        console.error('Error handling date range query:', error.message);
        console.error('Start Date:', startDate);
        console.error('End Date:', endDate);
    }
}

// Function to handle fetching data for a time range with specified timeType
async function handleTimeRangeQuery(date, startTime, endTime, toaffect, timeType, ws) {
    try {
        if (!date || !startTime || !endTime) {
            throw new Error('Invalid time range: date, startTime, and endTime must be defined');
        }

        const db = mongoClient.db("FlowterDB");
        const sensorId = 'b1'; // Example sensor ID, replace with actual logic
        const sensorCollection = db.collection('sensors');

        // Construct the start and end Date objects
        const startDateTime = new Date(`${date}T${startTime}Z`);
        const endDateTime = new Date(`${date}T${endTime}Z`);

        // Construct the MongoDB query
        const query = {
            date: date,
            $expr: {
                $and: [
                    { $gte: [{ $toDate: { $concat: ["$date", "T", "$time"] } }, startDateTime] },
                    { $lte: [{ $toDate: { $concat: ["$date", "T", "$time"] } }, endDateTime] }
                ]
            },
            value: { $ne: 0 }
        };
        

        console.log('MongoDB query:', query);

        // Fetch the results from MongoDB
        const result = await sensorCollection.find(query).toArray();
        // console.log('Fetched result:', result);
        // Function to generate time intervals based on timeType
        function generateIntervals(start, end, intervalMs) {
            let intervals = [];
            let current = new Date(start);
            while (current < end) {
                let next = new Date(current.getTime() + intervalMs);
                intervals.push({ start: current.toISOString(), end: next.toISOString() });
                current = next;
            }
            return intervals;
        }

        let intervals = [];
        let intervalMs;

        if (timeType) {
            switch (timeType) {
                case 'day':
                    intervalMs = 60 * 60 * 1000; // 1 hour
                    intervals = generateIntervals(startDateTime, endDateTime, intervalMs);
                    break;
                case 'hour':
                    intervalMs = 5 * 60 * 1000; // 5 minutes
                    intervals = generateIntervals(startDateTime, endDateTime, intervalMs);
                    break;
                case 'minute':
                    intervalMs = 10 * 1000; // 10 seconds
                    intervals = generateIntervals(startDateTime, endDateTime, intervalMs);
                    break;
                default:
                    throw new Error('Invalid timeType. Must be "day", "hour", or "minute".');
            }
        } else {
            intervals.push({ start: startDateTime.toISOString(), end: endDateTime.toISOString() });
        }
//         console.log(intervals);

        const timeValues = { type: timeType || "custom", timeType: "true", toaffect: toaffect, date: date, startTime: startTime, endTime: endTime, values: [] };

        // Initialize the timeValues with zeroes
        intervals.forEach(interval => {
            timeValues.values.push({ start: interval.start, end: interval.end, value: 0 });
        });

        // Populate timeValues with data from result
        result.forEach(reading => {
            const readingDateTime = new Date(`${reading.date}T${reading.time}Z`);
            timeValues.values.forEach(interval => {
                const intervalStart = new Date(interval.start);
                const intervalEnd = new Date(interval.end);
                if (readingDateTime >= intervalStart && readingDateTime < intervalEnd) {
                    interval.value += reading.value;
                }
            });
        });

        ws.send(JSON.stringify(timeValues));
//         console.log(timeValues);
    } catch (error) {
        console.error('Error handling time range query:', error.message);
        console.error('Date:', date);
        console.error('Start Time:', startTime);
        console.error('End Time:', endTime);
        if (timeType) {
            console.error('TimeType:', timeType);
        }
    }
}

// Function to listen for new data from MongoDB and broadcast to clients
// async function listenToChanges() {
//     const db = mongoClient.db("FlowterDB");
//     const sensorCollection = db.collection('sensors');

//     const changeStream = sensorCollection.watch();

//     changeStream.on('change', async function(change) {
//         console.log('Change detected in MongoDB:', change);

//         try {
//             const newData = change.fullDocument;
//             if (!newData || !newData.sensor_id) {
//                 throw new Error('Invalid or missing document from MongoDB change stream');
//             }

//             // Prepare new reading data
//             const newReading = {
//                 type: "curr",
//                 sensor_id: newData.sensor_id,
//                 date: newData.date,
//                 time: newData.time,
//                 value: newData.value
//             };

//             // Broadcast new reading data to all connected clients
//             clients.forEach(client => {
//                 if (client.readyState === WebSocket.OPEN) {
//                     client.send(JSON.stringify(newReading));
//                 }
//             });

//             console.log('Broadcasted new reading data to clients:', newReading);
//         } catch (error) {
//             console.error('Error processing MongoDB change event:', error);
//         }
//     });

//     changeStream.on('error', function(error) {
//         console.error('Error in MongoDB change stream:', error);
//     });
// }

// Start WebSocket server and handle connections/messages
handleWebSocket().catch(console.error);
