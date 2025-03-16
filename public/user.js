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
  
    // Global variable for the steps chart so it can be accessed in refresh
    let stepsChart;
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
  
    socket.on("joinedClassroom", (classroomCode) => {
        document.getElementById("connectionStatus").textContent = `Successfully joined classroom with code: ${classroomCode}`;
        document.getElementById("connectionError").textContent = ""; // Clear any previous error
    });
  
    socket.on("joinError", (error) => {
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
                    acceleration: xData[i],
                };
                steps.push(step);
            }
        }
  
        // Update step count display
        stepCountElement.textContent = `Step Count: ${steps.length / 2}`;
  
        // Draw steps chart with updated steps data
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
  
        const stepsChartCtx = document.getElementById("stepsChart").getContext("2d");
  
        // If the stepsChart already exists, update its data; otherwise, create it.
        if (stepsChart) {
            stepsChart.data = stepsData;
            stepsChart.update();
        } else {
            const stepsConfig = {
                type: "line",
                data: stepsData,
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
                            min: 0,
                            max: 50,
                            title: {
                                display: true,
                                text: "Movement Count",
                            },
                        },
                    },
                },
            };
            stepsChart = new Chart(stepsChartCtx, stepsConfig);
        }
  
        // Add event listener to adjust the y-axis maximum
        const yMaxInput = document.getElementById("yMaxInput");
        yMaxInput.addEventListener("input", function () {
            const newYMax = parseFloat(yMaxInput.value);
            if (!isNaN(newYMax)) {
                stepsChart.options.scales.y.max = newYMax;
                stepsChart.update();
            }
        });
  
        // Display the steps chart container
        const stepsclass = document.getElementById("steps-class");
        stepsclass.style.display = "block";
    }
  
    const sendButton = document.getElementById("sendButton");
    sendButton.addEventListener("click", function () {
        sendGraphData();
    });
  
    // Refresh Data Button modifications:
    const refreshDataButton = document.getElementById("refreshDataButton");
    refreshDataButton.addEventListener("click", () => {
      // Clear the main chart data (used for collecting points)
      data.labels = [];
      data.datasets.forEach(dataset => dataset.data = []);
      myChart.update();
  
      // Clear the steps chart data if it exists
      if (stepsChart) {
          stepsChart.data.labels = [];
          stepsChart.data.datasets.forEach(dataset => dataset.data = []);
          stepsChart.update();
      }
  
      // Reset the steps array for new data collection
      steps = [];
  
      // Optionally, notify the server to clear stored data
      socket.emit("clearData");
  
      // Re-enable the send button (removing the lock)
      sendButton.disabled = false;
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
            socket.emit("sendGraphData", { classroomCode, graphData });
            // Removed the disabling of the send button so it doesn't lock after sending.
        } else {
            alert("Please join a classroom first.");
        }
    }
  });
  