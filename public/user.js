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
                    title: { display: true, text: "Time (ms)" },
                },
                y: {
                    min: -80,
                    max: 80,
                    title: { display: true, text: "Acceleration" },
                },
            },
        },
    };

    const myChart = new Chart(ctx, config);

    const dataCountElement = document.getElementById("dataCount");
    const stepCountElement = document.getElementById("stepCount");
    const countdownElement = document.getElementById("countdown"); // Added for countdown

    let dataPointCount = 0;
    var startTime = 0;
    let isCollectingData = false;

    const startButton = document.getElementById("startButton");
    startButton.addEventListener("click", startDataCollection);

    function startDataCollection() {
        // 5-second countdown before starting data collection
        let countdown = 5;
        countdownElement.style.display = "block";

        const countdownInterval = setInterval(() => {
            countdownElement.textContent = `Starting in ${countdown}...`;
            countdown--;
            if (countdown < 0) {
                clearInterval(countdownInterval);
                countdownElement.style.display = "none";

                // Start data collection after countdown
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
        }, 1000); // Countdown interval
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
                data.datasets[0].data.push({ x: currentTime, y: acceleration.x });
                data.datasets[1].data.push({ x: currentTime, y: acceleration.y });
                data.datasets[2].data.push({ x: currentTime, y: acceleration.z });

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
        const threshold = 8.0; 
        const windowSize = 5;

        const xData = data.datasets[0].data.map((point) => point.y);

        for (let i = windowSize; i < xData.length - windowSize; i++) {
            let isPeak = true;
            for (let j = i - windowSize; j <= i + windowSize; j++) {
                if (xData[i] <= xData[j] && i !== j) {
                    isPeak = false;
                    break;
                }
            }

            if (isPeak && xData[i] > threshold) {
                const peakTime = data.labels[i];
                const step = { time: peakTime, acceleration: xData[i] };
                steps.push(step);
            }
        }

        // Ensure graph extends to 30 seconds (30000 ms)
        let lastX = data.labels[data.labels.length - 1];
        let lastY = xData[xData.length - 1] || 0;

        if (lastX < 30000) {
            data.labels.push(30000);
            data.datasets[0].data.push({ x: 30000, y: lastY });
        }

        stepCountElement.textContent = `Step Count: ${steps.length / 2}`;

        drawStepsChart();
    }

    let stepsChart = null;

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

        const stepsConfig = {
            type: "line",
            data: stepsData,
            options: {
                responsive: true,
                scales: {
                    x: { min: 0, max: 30000, type: "linear", position: "bottom" },
                    y: { min: 0, max: 50, title: { display: true, text: "Movement Count" } },
                },
            },
        };

        const stepsChartCtx = document.getElementById("stepsChart").getContext("2d");
        stepsChart = new Chart(stepsChartCtx, stepsConfig);

        const stepsclass = document.getElementById("steps-class");
        stepsclass.style.display = "block";
        stepsChart.update();
    }

    const sendButton = document.getElementById("sendButton");
    sendButton.addEventListener("click", sendGraphData);

    const refreshDataButton = document.getElementById("refreshDataButton");
    refreshDataButton.addEventListener("click", () => {
        data.labels = [];
        data.datasets.forEach(dataset => dataset.data = []);
        myChart.update();

        if (stepsChart) {
            stepsChart.destroy();
            stepsChart = null;
        }
        steps = [];

        sendButton.disabled = false;
        socket.emit("clearData");
    });

    function sendGraphData() {
        const graphData = {
            labels: steps.map((step) => step.time),
            userSteps: steps.map((step, index) => ({
                x: step.time,
                y: index + 1,
            })),
        };

        const classroomCode = document.getElementById("classroomCode").value.trim();
        if (classroomCode) {
            socket.emit('sendGraphData', { classroomCode, graphData });
            sendButton.disabled = true;
        } else {
            alert("Please join a classroom first.");
        }
    }
});
