document.addEventListener("DOMContentLoaded", function () {
  const ctx = document.getElementById("myChart").getContext("2d");
  const velocityCtx = document.getElementById("velocityChart").getContext("2d");

  const data = {
    labels: [],
    datasets: [
      {
        label: "Acceleration X",
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        data: [],
      },
      {
        label: "Acceleration Y",
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        data: [],
      },
      {
        label: "Acceleration Z",
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        data: [],
      },
    ],
  };

  const velocityData = {
    labels: [],
    datasets: [
      {
        label: "Velocity X",
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        data: [],
      },
      {
        label: "Velocity Y",
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        data: [],
      },
      {
        label: "Velocity Z",
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
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
          title: {
            display: true,
            text: "Time (ms)",
          },
        },
        y: {
          title: {
            display: true,
            text: "Acceleration",
          },
        },
      },
    },
  };

  const velocityConfig = {
    type: "line",
    data: velocityData,
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
          title: {
            display: true,
            text: "Velocity",
          },
        },
      },
    },
  };

  const myChart = new Chart(ctx, config);
  const velocityChart = new Chart(velocityCtx, velocityConfig);

  const dataCountElement = document.getElementById("dataCount");
  let dataPointCount = 0;
  const startTime = new Date().getTime();
  let isCollectingData = false;

  const startButton = document.getElementById("startButton");
  startButton.addEventListener("click", startDataCollection);

  function startDataCollection() {
    isCollectingData = true;
    dataPointCount = 0;
    data.labels = [];
    data.datasets.forEach((dataset) => {
      dataset.data = [];
    });
    velocityData.labels = [];
    velocityData.datasets.forEach((dataset) => {
      dataset.data = [];
    });
    updateDataCount();

    setTimeout(stopDataCollection, 30000);

    window.addEventListener("devicemotion", collectData);
  }

  function stopDataCollection() {
    isCollectingData = false;
    window.removeEventListener("devicemotion", collectData);
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

        const velocityX = calculateVelocity(data.datasets[0].data);
        const velocityY = calculateVelocity(data.datasets[1].data);
        const velocityZ = calculateVelocity(data.datasets[2].data);

        velocityData.labels.push(currentTime);
        velocityData.datasets[0].data.push({ x: currentTime, y: velocityX });
        velocityData.datasets[1].data.push({ x: currentTime, y: velocityY });
        velocityData.datasets[2].data.push({ x: currentTime, y: velocityZ });

        dataPointCount++;
        updateDataCount();

        myChart.update();
        velocityChart.update();
      }
    }
  }

  function calculateVelocity(data) {
    if (data.length < 2) {
      return 0;
    }
    const lastPoint = data[data.length - 1];
    const secondLastPoint = data[data.length - 2];
    const deltaTime = (lastPoint.x - secondLastPoint.x) / 1000;
    const averageAcceleration = (lastPoint.y + secondLastPoint.y) / 2;
    return averageAcceleration * deltaTime;
  }

  function updateDataCount() {
    dataCountElement.textContent = `Data Points:\n${dataPointCount}\n`;
  }
});
