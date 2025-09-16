document.addEventListener("DOMContentLoaded", function () {
  const socket = io();
  Chart.defaults.font.size = 18;
  const mainChartCtx = document.getElementById("mainChart").getContext("2d");
  const mainData = {
    labels: [],
    datasets: [],
  };

  const mainChart = new Chart(mainChartCtx, {
    type: "line",
    data: mainData,
    options: {
      responsive: true,
      scales: {
        x: {
          type: "linear",
          position: "bottom",
          grid: {
            display: true,
          },
          title: {
            display: true,
            text: "Time (ms) (X-axis)",
          },
        },
        y: {
          min: 0,
          max: 60,
          grid: {
            display: true,
          },
          title: {
            display: true,
            text: "Movement Count (Y-axis)",
          },
        },
      },
      plugins: {
        legend: {
          display: true,
        },
      },
    },
  });

  // Predefined set of vibrant colors
  const colors = [
    "rgba(255, 99, 132, 1)",
    "rgba(54, 162, 235, 1)",
    "rgba(255, 206, 86, 1)",
    "rgba(75, 192, 192, 1)",
    "rgba(153, 102, 255, 1)",
    "rgba(255, 159, 64, 1)",
    "rgba(0, 255, 127, 1)",
    "rgba(255, 0, 255, 1)",
  ];

  const names = [
    "Penguin",
    "Tortoise",
    "Fox",
    "Dog",
    "Cat",
    "Bat",
    "Bull",
    "Chicken",
    "Horse",
    "Lizard",
    "Goat",
    "Kangaroo",
    "Rabbit",
    "Deer",
    "Cheetah",
    "Zebra",
    "Elephant",
    "Leopard",
    "Tiger",
    "Wolf",
    "Dolphin",
    "Panda",
    "Owl",
    "Hedgehog",
    "Squirrel"
  ];

  let randomNames = null;

  function shuffleNames(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
  }
  
  function getName(index) {
    return randomNames[index % names.length];
  }

  function getColor(index) {
    return colors[index % colors.length];
  }

  // Handle dropdown change for input type selection
  const inputTypeSelect = document.getElementById("inputTypeSelect");
  const dataInputContainer = document.getElementById("dataInputContainer");
  const functionInputContainer = document.getElementById("functionInputContainer");

  const downloadDataButton = document.getElementById("downloadDataButton");
  downloadDataButton.addEventListener("click", () => {
    socket.emit("requestAllData");
  });

  function convertToCSV(data) {
    const headers = ["User", "Time (ms)", "Movement Count"];
    const rows = [];
    data.forEach((user) => {
      const userID = user.user;
      const labels = user.data.labels;
      const userSteps = user.data.userSteps;
      labels.forEach((time, index) => {
        const movementCount = userSteps[index]?.y || 0;
        rows.push([userID, time, movementCount].join(","));
      });
    });
    return [headers.join(","), ...rows].join("\n");
  }

  function downloadChartImage(chart) {
    const image = chart.toBase64Image();
    const link = document.createElement("a");
    link.href = image;
    link.download = "graph_image.png";
    link.click();
  }

  socket.on("allDataResponse", (data) => {
    const csvData = convertToCSV(data);
    const csvBlob = new Blob([csvData], { type: "text/csv" });
    const csvUrl = URL.createObjectURL(csvBlob);
    const csvLink = document.createElement("a");
    csvLink.href = csvUrl;
    csvLink.download = "user_data.csv";
    csvLink.click();
    URL.revokeObjectURL(csvUrl);
    downloadChartImage(mainChart);
  });

  inputTypeSelect.addEventListener("change", () => {
    if (inputTypeSelect.value === "points") {
      dataInputContainer.style.display = "block";
      functionInputContainer.style.display = "none";
    } else {
      dataInputContainer.style.display = "none";
      functionInputContainer.style.display = "block";
    }
  });

  socket.on("updateMainScreen", (data) => {
    mainData.labels = data.labels;
    mainData.datasets.push({
      label: "Predrawn Steps",
      borderColor: "rgba(255, 159, 64, 1)",
      backgroundColor: "rgba(255, 159, 64, 0.2)",
      data: data.predrawnSteps,
      fill: false,
    });
    mainChart.update();
  });

  socket.on("receiveGraphData", (data) => {
    console.log("received graph data");
    mainData.labels = data.labels;
    const currIndex = mainData.datasets.length;
    const borderColor = getColor(currIndex);
    const currName = getName(currIndex);
    const backgroundColor = borderColor.replace(", 1)", ", 0.2)");

    mainData.datasets.push({
      label: currName,
      borderColor: borderColor,
      backgroundColor: backgroundColor,
      data: data.userSteps,
      fill: false,
    });

    mainChart.update();
  });

  const generateCodeButton = document.getElementById("generateCodeButton");
  const codeDisplay = document.getElementById("codeDisplay");

  generateCodeButton.addEventListener("click", () => {
    generateCodeButton.style.display = "none";
    generateCodeButton.style.fontSize = "0px";
    randomNames = shuffleNames(names);
    socket.emit("createClassroom");
  });

  socket.on("classroomCreated", (classroomCode) => {
    codeDisplay.textContent = `Classroom Code: ${classroomCode}`;
  });

  const yMaxInput = document.getElementById("yMaxInput");
  yMaxInput.addEventListener("input", function () {
    const newYMax = parseFloat(yMaxInput.value);
    if (!isNaN(newYMax)) {
      mainChart.options.scales.y.max = newYMax;
      mainChart.update();
    }
  });

  const addDataButton = document.getElementById("addDataButton");
  const dataPointsInput = document.getElementById("dataPointsInput");
  const functionInput = document.getElementById("functionInput");

  const refreshDataButton = document.getElementById("refreshDataButton");
  refreshDataButton.addEventListener("click", () => {
    mainData.labels = [];
    mainData.datasets = [];
    mainChart.update();
    socket.emit("clearData");
  });

  const dataExampleSelect = document.getElementById("data_example_select");
  const functionExampleSelect = document.getElementById("function_example_select");

  dataExampleSelect.addEventListener("change", () => {
    const selectedValue = dataExampleSelect.value;
    dataPointsInput.value = selectedValue !== "v0" ? selectedValue : "";
  });

  functionExampleSelect.addEventListener("change", () => {
    const selectedValue = functionExampleSelect.value;
    functionInput.value = selectedValue !== "v0" ? selectedValue : "";
  });

  addDataButton.addEventListener("click", () => {
    const colorIndex = mainData.datasets.length;
    const borderColor = getColor(colorIndex);
    const backgroundColor = borderColor.replace(", 1)", ", 0.2)");

    if (inputTypeSelect.value === "points") {
      const input = dataPointsInput.value.trim();
      if (input) {
        const dataPoints = input.split(" ").map((pair) => {
          const [x, y] = pair.split(",").map(Number);
          return { x, y };
        });

        if (dataPoints.every((point) => !isNaN(point.x) && !isNaN(point.y))) {
          mainData.datasets.push({
            label: `Custom Data ${mainData.datasets.length + 1}`,
            borderColor: borderColor,
            backgroundColor: backgroundColor,
            data: dataPoints,
            fill: false,
          });

          mainChart.update();
          dataPointsInput.value = "";
        } else {
          alert("Invalid input. Please enter data points in x,y format.");
        }
      }
    } else if (inputTypeSelect.value === "function") {
      const funcStr = functionInput.value.trim();
      if (funcStr) {
        try {
          const parsedFunction = new Function("x", `return ${funcStr};`);
          const dataPoints = [];
          for (let x = 0; x <= 30000; x += 1) {
            const y = parsedFunction(x);
            if (!isNaN(y)) {
              dataPoints.push({ x, y });
            }
          }

          mainData.datasets.push({
            label: `Function: y = ${funcStr}`,
            borderColor: borderColor,
            backgroundColor: backgroundColor,
            data: dataPoints,
            fill: false,
          });

          mainChart.update();
          functionInput.value = "";
        } catch (e) {
          alert("Invalid function. Please enter a valid JavaScript expression for the function.");
        }
      }
    }
  });

  // === NEW: Toggle Controls for Plot, Grid, Axes, Legend ===
  document.getElementById("togglePlot").addEventListener("change", function () {
    mainData.datasets.forEach((ds) => (ds.hidden = !this.checked));
    mainChart.update();
  });

  document.getElementById("toggleGrid").addEventListener("change", function () {
    mainChart.options.scales.x.grid.display = this.checked;
    mainChart.options.scales.y.grid.display = this.checked;
    mainChart.update();
  });

  document.getElementById("toggleAxes").addEventListener("change", function () {
    mainChart.options.scales.x.display = this.checked;
    mainChart.options.scales.y.display = this.checked;
    mainChart.update();
  });

  document.getElementById("toggleLegend").addEventListener("change", function () {
    mainChart.options.plugins.legend.display = this.checked;
    mainChart.update();
  });
});
