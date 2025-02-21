document.addEventListener("DOMContentLoaded", function () {
    const socket = io();
    Chart.defaults.font.size = 18;
    const ctx = document.getElementById("myChart").getContext("2d");
    const data = {
        labels: [],
        datasets: [
            {
                label: "Acceleration X",
                borderColor: "rgba(255, 99, 132, 1)",
                backgroundColor: "rgba(255, 99, 132, 0.2)",
                borderWidth: 3,
                data: [],
            },
            {
                label: "Acceleration Y",
                borderColor: "rgba(54, 162, 235, 1)",
                backgroundColor: "rgba(54, 162, 235, 0.2)",
                borderWidth: 3,
                data: [],
            },
            {
                label: "Acceleration Z",
                borderColor: "rgba(75, 192, 192, 1)",
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                borderWidth: 3,
                data: [],
            },
        ],
    };

    const stepsChartCtx = document
        .getElementById("stepsChart")
        .getContext("2d");
    let steps = [];

    const config = {
        type: "line",
        data: data,
        options: {
            
            responsive: true,
            scales: {
                x: {
                    type: "linear",
                    position: "bottom",
                    min: 0,
                    max: 30000,
                    title: {
                        display: true,
                        text: "Time (ms)",
                    },
                },
                y: {
                    min: -80,
                    max: 80,
                    title: {
                        display: true,
                        text: "Acceleration",
                    },
                },
            },
        },
    };

    const myChart = new Chart(ctx, config);

    const dataCountElement = document.getElementById("dataCount");
    const stepCountElement = document.getElementById("stepCount");
    let dataPointCount = 0;
    var startTime = 0;
    let isCollectingData = false;

    const startButton = document.getElementById("startButton");
    startButton.addEventListener("click", startDataCollection);

    const classroomCodeInput = document.getElementById("classroomCode");
    const joinButton = document.getElementById("joinButton");

    joinButton.addEventListener("click", () => {
        const classroomCode = classroomCodeInput.value.trim();
        if (classroomCode) {
            socket.emit("joinClassroom", classroomCode);
            document.getElementById("connectionStatus").style.display = "block";
            document.getElementById("connectionError").style.display = "block";
            document.getElementById("connectionStatus").textContent = `Attempting to join classroom with code: ${classroomCode}`;
            document.getElementById("connectionError").textContent = ""; // Clear any previous error
        }
        
    });

    socket.on('joinedClassroom', (classroomCode) => {
        document.getElementById("connectionStatus").textContent = `Successfully joined classroom with code: ${classroomCode}`;
        document.getElementById("connectionError").textContent = ""; // Clear any previous error
    });

    socket.on('joinError', (error) => {
        document.getElementById("connectionStatus").textContent = ""; // Clear any previous status
        document.getElementById("connectionError").textContent = `Failed to join classroom: ${error.message}`;
    });



    function startDataCollection() {
        startTime = new Date().getTime();
        isCollectingData = true;
        dataPointCount = 0;
        data.labels = [];
        data.datasets.forEach((dataset) => {
            dataset.data = [];
        });
        updateDataCount();
        stepCountElement.textContent = "Step Count: 0";

        setTimeout(stopDataCollection, 30000);

        window.addEventListener("devicemotion", collectData);
    }

    function stopDataCollection() {
        isCollectingData = false;
        window.removeEventListener("devicemotion", collectData);
        countSteps();
    }

    function collectData(event) {
        if (isCollectingData) {
            const acceleration = event.accelerationIncludingGravity;
            if (acceleration) {
                const currentTime = new Date().getTime() - startTime;
                if (currentTime > 30000) {
                    stopDataCollection();
                    return;
                }

                data.labels.push(currentTime);
                data.datasets[0].data.push({
                    x: currentTime,
                    y: acceleration.x,
                });
                data.datasets[1].data.push({
                    x: currentTime,
                    y: acceleration.y,
                });
                data.datasets[2].data.push({
                    x: currentTime,
                    y: acceleration.z,
                });

                dataPointCount++;
                updateDataCount();

                myChart.update();
            }
        }
    }

    function updateDataCount() {
        dataCountElement.textContent = `Data Points:\n${dataPointCount}\n`;
    }

    function countSteps() {
        const threshold = 8.0; // Adjusted threshold value based on your testing
        const windowSize = 5; // Number of points to consider before and after the current point

        // Use X-axis acceleration for step detection
        const xData = data.datasets[0].data.map((point) => point.y);

        for (let i = windowSize; i < xData.length - windowSize; i++) {
            let isPeak = true;

            // Check if xData[i] is higher than the previous and next windowSize points
            for (let j = i - windowSize; j <= i + windowSize; j++) {
                if (xData[i] <= xData[j] && i !== j) {
                    isPeak = false;
                    break;
                }
            }

            if (isPeak && xData[i] > threshold) {
                // Store the time of peak along with any other relevant data
                const peakTime = data.labels[i];
                const step = {
                    time: peakTime,
                    acceleration: xData[i], // Example: You can include other relevant data here
                };
                steps.push(step);
            }
        }

        // Update step count display
        stepCountElement.textContent = `Step Count: ${steps.length / 2}`;

        // Display all components of each step in stepCountElement
        // stepCountElement.textContent += '\nSteps Array:\n';
        // steps.forEach((step, index) => {
        //     stepCountElement.textContent += `Step ${index + 1}: Time=${step.time}, Acceleration=${step.acceleration}\n`;
        // });

        // Draw steps chart
        drawStepsChart();
    }

    function drawStepsChart() {
        const stepsData = {
            labels: steps.map((step) => step.time),
            datasets: [
                {
                    label: "Steps",
                    borderColor: "rgba(255, 159, 64, 1)",
                    backgroundColor: "rgba(255, 159, 64, 0.2)",
                    data: steps.map((step, index) => ({
                        x: step.time,
                        y: index + 1,
                    })),
                },
            ],
        };

        console.log("Steps Data:", stepsData);
        console.log("Steps Data Length:", stepsData.datasets[0].data.length);

        const stepsConfig = {
            type: "line",
            data: stepsData,
            options: {
                responsive: true,
                scales: {
                    x: {
                        min: 0,
                        max: 30000,
                        type: "linear",
                        position: "bottom",
                        title: {
                            display: true,
                            text: "Time (ms)",
                        },
                    },
                    y: {
                        min: 0,
                        max: 50, // Default max value
                        title: {
                            display: true,
                            text: "Movement Count",
                        },
                    },
                },
            },
        };

        const stepsChartCtx = document
            .getElementById("stepsChart")
            .getContext("2d");
        const stepsChart = new Chart(stepsChartCtx, stepsConfig);

        // Add event listener to the input field
        const yMaxInput = document.getElementById("yMaxInput");
        yMaxInput.addEventListener("input", function () {
            const newYMax = parseFloat(yMaxInput.value);
            if (!isNaN(newYMax)) {
                stepsChart.options.scales.y.max = newYMax;
                stepsChart.update();
            }
        });

        // Update the stepsChart after creating it
        const stepsclass = document.getElementById("steps-class");
        stepsclass.style.display = "block";
        stepsChart.update();
    }

    const sendButton = document.getElementById("sendButton");
    sendButton.addEventListener("click", function () {
        sendGraphData();
    });

    function sendGraphData() {
        const graphData = {
            labels: steps.map((step) => step.time),
            userSteps: steps.map((step, index) => ({
                x: step.time,
                y: index + 1,
            })),
        };
        const classroomCode = classroomCodeInput.value.trim();
        if (classroomCode) {
            socket.emit('sendGraphData', { classroomCode, graphData });
            const sendButton = document.getElementById('sendButton');
            sendButton.disabled = true; // Disable the button after it's clicked once
        } else {
            alert("Please join a classroom first.");
        }
    }


});
