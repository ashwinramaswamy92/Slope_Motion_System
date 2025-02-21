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
          title: {
            display: true,
            text: "Time (ms)",
          },
        },
        y: {
          min: 0,
          max: 60,
          title: {
            display: true,
            text: "Movement Count",
          },
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

  // Function to get a color from the predefined set
  function getColor(index) {
    return colors[index % colors.length];
  }

  // Handle dropdown change for input type selection
  const inputTypeSelect = document.getElementById("inputTypeSelect");
  const dataInputContainer = document.getElementById("dataInputContainer");
  const functionInputContainer = document.getElementById(
    "functionInputContainer"
  );

  inputTypeSelect.addEventListener("change", () => {
    if (inputTypeSelect.value === "points") {
      dataInputContainer.style.display = "block";
      functionInputContainer.style.display = "none";
    } else {
      dataInputContainer.style.display = "none";
      functionInputContainer.style.display = "block";
    }
  });

  // Listen for updates from the server about the classroom data
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

  // Listen for incoming graph data from users
  socket.on("receiveGraphData", (data) => {
    console.log("received graph data");
    mainData.labels = data.labels;

    // Get a color from the predefined set
    const colorIndex = mainData.datasets.length;
    const borderColor = getColor(colorIndex);
    const backgroundColor = borderColor.replace(", 1)", ", 0.2)");

    // Add the new dataset
    mainData.datasets.push({
      label: `User ${mainData.datasets.length + 1}`,
      borderColor: borderColor,
      backgroundColor: backgroundColor,
      data: data.userSteps,
      fill: false,
    });

    mainChart.update();
  });

  // Button to generate and display a classroom code
  const generateCodeButton = document.getElementById("generateCodeButton");
  const codeDisplay = document.getElementById("codeDisplay");

  generateCodeButton.addEventListener("click", () => {
    generateCodeButton.style.display = "none";
    generateCodeButton.style.fontSize = "0px";
    socket.emit("createClassroom"); // Request server to create a classroom
  });

  socket.on("classroomCreated", (classroomCode) => {
    codeDisplay.textContent = `Classroom Code: ${classroomCode}`;
  });

  // Add event listener to the input field for Y-axis max value
  const yMaxInput = document.getElementById("yMaxInput");
  yMaxInput.addEventListener("input", function () {
    const newYMax = parseFloat(yMaxInput.value);
    if (!isNaN(newYMax)) {
      mainChart.options.scales.y.max = newYMax;
      mainChart.update();
    }
  });

  // Adding data points or function values
  const addDataButton = document.getElementById("addDataButton");
  const dataPointsInput = document.getElementById("dataPointsInput");
  const functionInput = document.getElementById("functionInput");

  addDataButton.addEventListener("click", () => {
    const colorIndex = mainData.datasets.length;
    const borderColor = getColor(colorIndex);
    const backgroundColor = borderColor.replace(", 1)", ", 0.2)");

    if (inputTypeSelect.value === "points") {
      // Handle data points input
      const input = dataPointsInput.value.trim();
      if (input) {
        const dataPoints = input.split(" ").map((pair) => {
          const [x, y] = pair.split(",").map(Number);
          return { x, y };
        });

        // Validate data
        if (dataPoints.every((point) => !isNaN(point.x) && !isNaN(point.y))) {
          mainData.datasets.push({
            label: `Custom Data ${mainData.datasets.length + 1}`,
            borderColor: borderColor,
            backgroundColor: backgroundColor,
            data: dataPoints,
            fill: false,
          });

          mainChart.update();
          dataPointsInput.value = ""; // Clear input
        } else {
          alert("Invalid input. Please enter data points in x,y format.");
        }
      }
    } else if (inputTypeSelect.value === "function") {
      // Handle function input
      const funcStr = functionInput.value.trim();
      if (funcStr) {
        try {
          const parsedFunction = new Function("x", `return ${funcStr};`);
          const dataPoints = [];

          // Generate values for x from 0 to 30 (for 30 seconds)
          for (let x = 0; x <= 30; x += 1) {
            // Adjust step size if needed
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
          functionInput.value = ""; // Clear input
        } catch (e) {
          alert(
            "Invalid function. Please enter a valid JavaScript expression for the function."
          );
        }
      }
    }
  });
});
