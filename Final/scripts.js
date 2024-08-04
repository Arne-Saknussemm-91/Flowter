    document.addEventListener('DOMContentLoaded', function() {
        const monthAndYear = document.getElementById('monthAndYear');
        const prevMonth = document.getElementById('prevMonth');
        const nextMonth = document.getElementById('nextMonth');
        const gridCalendar = document.querySelector('.grid-calendar');
        const totalConsumptionElement = document.getElementById('totalConsumption');
        const consumptionStatusElement = document.getElementById('consumptionStatus');
        const lasthele = document.getElementById('lasth');

        // Time interval buttons
        const past1MinButton = document.getElementById('past1Min');
        const past1HourButton = document.getElementById('past1Hour');
        const wholeDayButton = document.getElementById('wholeDay');
        const thisWeekButton = document.getElementById('thisWeek');
        const thisMonthButton = document.getElementById('thisMonth');

        let currentMonth = new Date().getMonth();
        let currentYear = new Date().getFullYear();
        let today = new Date().toISOString().split('T')[0];
        let totalValue = 0;
        let todayTotalValue = 0;
        let t1 = 0;
        let dateValues = {};

        const socket = new WebSocket('ws://localhost:8000'); // Adjust URL as needed

        socket.onopen = function(event) {
            console.log('WebSocket connection opened.');
            updateChartData('minute', 1); // Default to past 1 minute
            requestDataForMonth(currentYear, currentMonth); // Request data for the current month
            requestDataForDate(today); // Request data for today
        };

        socket.onclose = function(event) {
            console.log('WebSocket connection closed.');
        };

        socket.onerror = function(error) {
            console.error('WebSocket error:', error);
        };

        socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        console.log('Received data from server:', data);
        if (data.type === 'date') {
            totalConsumptionElement.textContent = data.totval;
            todayTotalValue = data.totval; // Update today's total consumption totval
            lasthele.textContent = data.date;
            updateConsumptionStatus();
            if (t1 == 0){
                t1++;
            }
            else{
            const { values } = data;
            const now = new Date();
            const currentTime = now.toISOString().split('T')[1].split('.')[0]; // Current time in HH:MM:SS format
    
            // Initialize labels and data arrays
            let labels = [];
            let dataset = [];
    
            // Helper function to convert 24-hour time to 12-hour time with AM/PM
            function formatTo12Hour(timeString, includeSeconds) {
                const [hours, minutes, seconds] = timeString.split(':').map(Number);
                const period = hours >= 12 ? 'PM' : 'AM';
                const adjustedHours = hours % 12 || 12; // Convert 0 hours to 12 for AM
    
                if (includeSeconds) {
                    return `${adjustedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${period}`;
                } else {
                    return `${adjustedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
                }
            }
    
            values.forEach(interval => {
                const { start, value } = interval;
    
                // Convert start time to HH:MM:SS format for comparison
                const startTime = new Date(start).toISOString().split('T')[1].split('.')[0];
    
                // Determine if seconds should be included based on type
                const includeSeconds = data.type === 'minute';
                const displayStartTime = formatTo12Hour(startTime, includeSeconds);
    
                // Only add data if it is before or equal to the current time
                if (data.type === 'day' || data.type === 'minute' || data.type === 'date') {
                    labels.push(displayStartTime);
                    dataset.push(value);
                }
            });
    
            // Update the chart data
            myChart.data.labels = labels;
            myChart.data.datasets[0].data = dataset;
    
            myChart.update();
        }}
            else if (data.timeType === 'true') {
                lasthele.textContent = data.date;
            
                const { values } = data;
// Get the current local time
const now = new Date();

// Function to format time as HH:MM:SS
function formatTime(dateObj) {
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`; // hh:mm:ss
}

// Get current time in local time zone in HH:MM:SS format
const currentTime = formatTime(now);

// console.log('Current local time:', currentTime);

            
                // Initialize labels and data arrays
                let labels = [];
                let dataset = [];
            
                // Helper function to convert 24-hour time to 12-hour time with AM/PM
                function formatTo12Hour(timeString, includeSeconds) {
                    const [hours, minutes, seconds] = timeString.split(':').map(Number);
                    const period = hours >= 12 ? 'PM' : 'AM';
                    const adjustedHours = hours % 12 || 12; // Convert 0 hours to 12 for AM
            
                    if (includeSeconds) {
                        return `${adjustedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${period}`;
                    } else {
                        return `${adjustedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
                    }
                }
            
                values.forEach(interval => {
                    const { start, value } = interval;
            
                    // Convert start time to HH:MM:SS format for comparison
                    const startTime = new Date(start).toISOString().split('T')[1].split('.')[0];
            
                    // Format start time based on type
                    let displayStartTime;
                    if (data.type === 'minute') {
                        // Convert to 12-hour format with seconds
                        displayStartTime = formatTo12Hour(startTime, true);
                    } else {
                        // Convert to 12-hour format without seconds
                        const [hours, minutes] = startTime.split(':');
                        displayStartTime = formatTo12Hour(`${hours}:${minutes}:00`, false);
                    }
            
                    // Only add data if it is before or equal to the current time
                    if (data.type === 'day') {
                        if (startTime <= currentTime) {
                            labels.push(displayStartTime);
                            dataset.push(value);
                        }
                    } else {
                        labels.push(displayStartTime);
                        dataset.push(value);
                    }
                });
            
                // Update the chart data
                myChart.data.labels = labels;
                myChart.data.datasets[0].data = dataset;
            
                myChart.update();
            }
             
 else if (data.toaffect === 'chart') {
                // Extract dates and values
                const dates = Object.keys(data.dateValues);
                const values = Object.values(data.dateValues);

                // Update chart data
                myChart.data.labels = dates;
                myChart.data.datasets[0].data = values;

                // Optionally update other chart properties here, like labels or colors
                // myChart.data.datasets[0].label = "Sensor Data"; // For example

                // Render the chart
                myChart.update();
            } else {
                dateValues = data.dateValues;
                updateCalendar();
            }
        };

        const myChart = new Chart(document.getElementById('myChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Total Volume (mL)',
                    tension: 0,
                    data: [],
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    fill: true
                }]
            },
            options: {
                scales: {
                    x: {
                        type: 'category'
                    },
                    y: {
                        ticks: {
                            beginAtZero: true,
                            callback: function(value) {
                                const date = new Date(value * 1000);
                                return date.toISOString().substr(11, 8); // Return hh:mm:ss
                            }
                        }
                    }
                }
            }
        });

        let refreshIntervals = {
            minute: 10000, // 10 seconds
            hour: 300000,  // 5 minutes
            day: 3600000   // 1 hour
        };

        let currentRefreshInterval = null;

        function startAutoRefresh(unit) {
            if (currentRefreshInterval) {
                clearInterval(currentRefreshInterval);
            }

            switch (unit) {
                case 'minute':
                    currentRefreshInterval = setInterval(() => updateChartData('minute', 1), refreshIntervals.minute);
                    break;
                case 'hour':
                    currentRefreshInterval = setInterval(() => updateChartData('hour', 1), refreshIntervals.hour);
                    break;
                case 'day':
                    currentRefreshInterval = setInterval(() => updateChartData('day', 24), refreshIntervals.day);
                    break;
                default:
                    clearInterval(currentRefreshInterval);
                    currentRefreshInterval = null;
                    break;
            }
        }

        past1MinButton.addEventListener('click', function() {
            updateChartData('minute', 1);
            startAutoRefresh('minute');
        });

        past1HourButton.addEventListener('click', function() {
            updateChartData('hour', 1);
            startAutoRefresh('hour');
        });

        wholeDayButton.addEventListener('click', function() {
            updateChartData('day', 24);
            startAutoRefresh('day');
        });

        thisWeekButton.addEventListener('click', function() {
            requestDataForWeek();
        });

        thisMonthButton.addEventListener('click', function() {
            requestDataForMonthchart(currentYear, currentMonth);
        });
        startAutoRefresh('minute'); // Default refresh interval
    function updateChartData(unit, value) {
        const timestamp = new Date();
        const date = timestamp.toISOString().split('T')[0]; // yyyy-mm-dd
        let startTime, endTime;

        // Function to format the time only
        function formatTime(dateObj) {
            const hours = String(dateObj.getHours()).padStart(2, '0');
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
            const seconds = String(dateObj.getSeconds()).padStart(2, '0');
            return `${hours}:${minutes}:${seconds}`; // hh:mm:ss
        }

        switch(unit) {
            case 'minute':
                timeType = 'minute';
                const minutes = timestamp.getMinutes();
                const seconds = timestamp.getSeconds();
                const milliseconds = timestamp.getMilliseconds();

                endTime = formatTime(timestamp);

                const startDate = new Date(timestamp);
                startDate.setMinutes(minutes - 1);
                startDate.setSeconds(seconds);
                startDate.setMilliseconds(milliseconds);
                startTime = formatTime(startDate);
                break;

            case 'hour':
                timeType = 'hour';
                endTime = formatTime(timestamp);

                // Calculate start time by subtracting one hour
                const startDateHour = new Date(timestamp);
                startDateHour.setHours(timestamp.getHours() - 1);
                startTime = formatTime(startDateHour);
                break;

            case 'day':
                timeType = 'day';
                const startOfDay = new Date(timestamp);
                startOfDay.setHours(0, 0, 0, 0); // Start of the day
                startTime = formatTime(startOfDay);

                const endOfDay = new Date(timestamp);
                endOfDay.setHours(23, 59, 59, 999); // End of the day
                endTime = formatTime(endOfDay);
                break;
        }

        console.log('Requesting data of', date, 'from:', startTime, 'to', endTime);

        // Clear previous chart data
        myChart.data.labels = [];
        myChart.data.datasets[0].data = [];
        myChart.update();

        // Send data with appropriate parameters
        socket.send(JSON.stringify({
            type: "time",
            toaffect: "chart",
            timeType: timeType,
            date: date,
            startTime: startTime,
            endTime: endTime
        }));
    }

        function generateDateBoxes(days) {
            gridCalendar.innerHTML = '';
            for (let day = 1; day <= days; day++) {
                const dateBox = document.createElement('div');
                dateBox.className = 'date-box';

                const dateSpan = document.createElement('span');
                dateSpan.textContent = day;

                dateBox.appendChild(dateSpan);
                gridCalendar.appendChild(dateBox);

                const dateString = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                dateValues[dateString] = 0;

                dateBox.addEventListener('click', function() {
                    console.log('Date clicked:', dateString);
                                        function formatTime(dateObj) {
            const hours = String(dateObj.getHours()).padStart(2, '0');
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
            const seconds = String(dateObj.getSeconds()).padStart(2, '0');
            return `${hours}:${minutes}:${seconds}`; // hh:mm:ss
        }
                    const timestamp = new Date();
                const startOfDay = new Date(timestamp);
                startOfDay.setHours(0, 0, 0, 0); // Start of the day
                startTime = formatTime(startOfDay);

                const endOfDay = new Date(timestamp);
                endOfDay.setHours(23, 59, 59, 999); // End of the day
                endTime = formatTime(endOfDay);

            console.log('Requesting data for date:', dateString, startTime,endTime);

            socket.send(JSON.stringify({ type: "date", toaffect: "chart",startTime: startTime,endTime: endTime,date: dateString}));

                });
            }
        }

        function updateDateBox(day, value) {
            const dateString = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const dateBoxes = gridCalendar.querySelectorAll('.date-box');
            const dateBox = Array.from(dateBoxes).find(box => box.querySelector('span').textContent == day);
            if (dateBox) {
                dateBox.dataset.value = value;
                dateBox.querySelector('span').textContent = day;
            }
        }

        function updateConsumptionStatus() {
            if (todayTotalValue > 19410) {
                consumptionStatusElement.style.backgroundColor = 'red';
            } else if (todayTotalValue > 17230) {
                consumptionStatusElement.style.backgroundColor = 'yellow';
            } else {
                consumptionStatusElement.style.backgroundColor = 'green';
            }
        }

        prevMonth.addEventListener('click', function() {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            monthAndYear.textContent = `${getMonthName(currentMonth)} ${currentYear}`;
            generateCalendar();
            requestDataForMonth(currentYear, currentMonth);
        });

        nextMonth.addEventListener('click', function() {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            monthAndYear.textContent = `${getMonthName(currentMonth)} ${currentYear}`;
            generateCalendar();
            requestDataForMonth(currentYear, currentMonth);
        });

        monthAndYear.textContent = `${getMonthName(currentMonth)} ${currentYear}`;
        generateCalendar();

        function generateCalendar() {
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            generateDateBoxes(daysInMonth);
            updateCalendar();
        }

        function updateCalendar() {
            const dateBoxes = gridCalendar.querySelectorAll('.date-box');

            dateBoxes.forEach(dateBox => {
                const day = parseInt(dateBox.querySelector('span').textContent);
                const dateString = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                const value = dateValues[dateString] || 0;

                if (value === 0) {
                    dateBox.style.backgroundColor = '#FFFFFF';
                    dateBox.querySelector('span').style.color = '#1D282E';
                    return;
                }

                const values = Object.values(dateValues).filter(v => v > 0);
                const max = Math.max(...values);
                const min = Math.min(...values);
                let intensity;
                if (max !== min) {
                    intensity = (value - min) / (max - min);
                } else {
                    intensity = 0.5;
                }

                const startColor = [171, 200, 245];
                const endColor = [8, 33, 74];

                const r = Math.round(startColor[0] * (1 - intensity) + endColor[0] * intensity);
                const g = Math.round(startColor[1] * (1 - intensity) + endColor[1] * intensity);
                const b = Math.round(startColor[2] * (1 - intensity) + endColor[2] * intensity);

                dateBox.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;

                const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
                const dateSpan = dateBox.querySelector('span');
                dateSpan.style.color = (brightness > 150) ? '#1D282E' : '#FDFDFD';
            });
        }

        function requestDataForMonth(year, month) {
            // Start date: first day of the current month
            const startDate = new Date(year, month, 1).toISOString().split('T')[0];

            // End date: last day of the current month
            const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

            console.log('Requesting data for date range:', startDate, 'to', endDate);

            socket.send(JSON.stringify({
                type: "daterange",
                toaffect: "calendar",
                startDate: startDate,
                endDate: endDate
            }));
        }

        function requestDataForMonthchart(year, month) {
            // Start date: first day of the current month
            const startDate = new Date(year, month, 1).toISOString().split('T')[0];

            // End date: last day of the current month
            const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

            console.log('Requesting data for date range:', startDate, 'to', endDate);

            socket.send(JSON.stringify({
                type: "daterange",
                toaffect: "chart",
                startDate: startDate,
                endDate: endDate
            }));
        }

        function requestDataForWeek() {
            const today = new Date();

            // Calculate the first day of the week (assuming the week starts on Monday)
            const firstDayOfWeek = new Date(today);
            firstDayOfWeek.setDate(today.getDate() - today.getDay() + 1);
            
            // Calculate the last day of the week (assuming the week ends on Sunday)
            const lastDayOfWeek = new Date(today);
            lastDayOfWeek.setDate(today.getDate() - today.getDay() + 7);
            
            // Format the dates as needed (e.g., YYYY-MM-DD)
            const formatDate = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const startDate = formatDate(firstDayOfWeek);
            const endDate = formatDate(lastDayOfWeek);

            console.log('Requesting data for date range:', startDate, 'to', endDate);
            socket.send(JSON.stringify({ type: "daterange", toaffect: "chart", startDate: startDate, endDate: endDate }));
        }

        function requestDataForDate(date) {
            console.log('Requesting data for date:', date);
            socket.send(JSON.stringify({ type: "date", date: date }));
        }

        function getMonthName(monthIndex) {
            const monthNames = ["January", "February", "March", "April", "May", "June",
                                "July", "August", "September", "October", "November", "December"];
            return monthNames[monthIndex];
        }
    });


