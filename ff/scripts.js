document.addEventListener('DOMContentLoaded', function() {
    const monthAndYear = document.getElementById('monthAndYear');
    const prevMonth = document.getElementById('prevMonth');
    const nextMonth = document.getElementById('nextMonth');
    const gridCalendar = document.querySelector('.grid-calendar');

    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();

    // Object to store values for each date
    let dateValues = {};

    // Initialize total value
    let totalValue = 0;

    // Initialize WebSocket
    const socket = new WebSocket('ws://localhost:8000'); // Adjust URL as needed

    socket.onopen = function(event) {
        console.log('WebSocket connection opened.');
        // Request data for the current month when the WebSocket connection opens
        requestDataForMonth(currentYear, currentMonth);
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

        // Check if the received data is for a single date or for the entire month
        if (data.type === 'curr') {
            // Handle data for a single date
            const receivedDate = new Date(data.date);
            const receivedDay = receivedDate.getDate();
            const dateString = data.date;

            // Increment total value
            totalValue += data.value || 0;

            dateValues[dateString] = data.value || 0;
            // Update the UI for the specific date
            updateDateBox(receivedDay, data.value);

            // Update Chart.js
            const timestamp = `${data.date} ${data.time}`;
            if (myChart.data.labels.length >= 6) {
                myChart.data.labels.shift();
                myChart.data.datasets[0].data.shift();
            }
            myChart.data.labels.push(timestamp);
            myChart.data.datasets[0].data.push(totalValue);
            myChart.update();

            console.log('Chart updated:', myChart.data);
        } else if (data.type === 'date') {
            document.getElementById('date').textContent = data.date;
            document.getElementById('datevalue').textContent = data.value;
        } else {
            // Handle data for the entire month
            document.getElementById('location').textContent = data.sensorlocation;
            dateValues = data.dateValues;

            // Update the UI for the entire month
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
                    type: 'time',
                    time: {
                        unit: 'second'
                    }
                },
                y: {
                    ticks: {
                        beginAtZero: true
                    }
                }
            }
        }
    });

    function generateDateBoxes(days) {
        gridCalendar.innerHTML = '';
        for (let day = 1; day <= days; day++) {
            const dateBox = document.createElement('div');
            dateBox.className = 'date-box';

            const dateSpan = document.createElement('span');
            dateSpan.textContent = day; // Display only day part without leading zeros

            dateBox.appendChild(dateSpan);
            gridCalendar.appendChild(dateBox);

            // Initialize dateValues with default value 0
            const dateString = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            dateValues[dateString] = 0;

            dateBox.addEventListener('click', function() {
                console.log('Date clicked:', dateString);
                socket.send(JSON.stringify({ type: "webdata", date: dateString }));
            });
        }
    }

    function updateDateBox(day, value) {
        const dateString = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const dateBoxes = gridCalendar.querySelectorAll('.date-box');
        const dateBox = Array.from(dateBoxes).find(box => box.querySelector('span').textContent == day);
        if (dateBox) {
            dateBox.dataset.value = value; // Store value in a dataset attribute
            dateBox.querySelector('span').textContent = day; // Update day part without leading zeros
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

    // Initial setup
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
                dateBox.style.backgroundColor = '#808080'; // Set default gray color
                dateBox.querySelector('span').style.color = '#FFFFFF'; // Set default text color for better contrast
                return;
            }

            // Calculate color intensity based on relative value
            const values = Object.values(dateValues).filter(v => v > 0); // Filter out zeros
            const max = Math.max(...values);
            const min = Math.min(...values);
            let intensity;
            if (max !== min) {
                intensity = (value - min) / (max - min); // Calculate intensity relative to min and max
            } else {
                intensity = 0.5; // If all values are the same, set intensity to midpoint
            }

            const startColor = [171, 200, 245]; // RGB values for lighter color
            const endColor = [8, 33, 74];       // RGB values for darker color

            const r = Math.round(startColor[0] * (1 - intensity) + endColor[0] * intensity);
            const g = Math.round(startColor[1] * (1 - intensity) + endColor[1] * intensity);
            const b = Math.round(startColor[2] * (1 - intensity) + endColor[2] * intensity);

            dateBox.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;

            // Determine text color based on background color intensity
            const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
            const dateSpan = dateBox.querySelector('span');
            dateSpan.style.color = (brightness > 150) ? '#1D282E' : '#FDFDFD'; // Light text on dark, dark text on light
        });
    }

    function requestDataForMonth(year, month) {
        const startDate = new Date(year, month, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
        console.log('Requesting data for date range:', startDate, 'to', endDate);
        socket.send(JSON.stringify({ type: "webdata", startDate: startDate, endDate: endDate }));
    }

    function getMonthName(monthIndex) {
        const monthNames = ["January", "February", "March", "April", "May", "June",
                            "July", "August", "September", "October", "November", "December"];
        return monthNames[monthIndex];
    }
});
