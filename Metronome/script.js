const bpmSlider = document.getElementById("bpm-slider");
const bpmValue = document.getElementById("bpm-value");
const bpmInput = document.getElementById("bpm-input");
const startBtn = document.getElementById("start-btn");
const stopBtn = document.getElementById("stop-btn");
const ctxBeats = document.getElementById("graph-beats").getContext("2d");
const ctxBPM = document.getElementById("graph-bpm").getContext("2d");

let intervalId = null;
let cumulativeBeats = 0;
let beats = [];
let times = [];
let bpmTimes = [];
let bpmValues = [];
let startTime = 0;

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Create the Chart.js chart for cumulative beats
const chartBeats = new Chart(ctxBeats, {
  type: "line",
  data: {
    labels: times,
    datasets: [
      {
        label: "Cumulative Beats",
        data: beats,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderWidth: 1,
      },
    ],
  },
  options: {
    scales: {
      x: {
        title: {
          display: true,
          text: "Time (s)",
        },
        type: "linear",
        position: "bottom",
      },
      y: {
        title: {
          display: true,
          text: "Cumulative Beats",
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  },
});

// Create the Chart.js chart for BPM vs Time
const chartBPM = new Chart(ctxBPM, {
  type: "line",
  data: {
    labels: bpmTimes,
    datasets: [
      {
        label: "Current BPM",
        data: bpmValues,
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderWidth: 1,
      },
    ],
  },
  options: {
    scales: {
      x: {
        title: {
          display: true,
          text: "Time (s)",
        },
        type: "linear",
        position: "bottom",
      },
      y: {
        title: {
          display: true,
          text: "BPM",
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  },
});

// Update BPM display
bpmSlider.addEventListener("input", () => {
  bpmValue.textContent = bpmSlider.value;
  bpmInput.value = bpmSlider.value; // Update input field

  // If metronome is running, restart with the new BPM
  if (intervalId) {
    clearInterval(intervalId);
    const bpm = bpmSlider.value;
    const interval = 60000 / bpm;
    drawMetronome(interval, startTime);
  }
});

// Update slider and BPM value when typing in the input field
bpmInput.addEventListener("input", () => {
  const value = bpmInput.value;

  // Allow only numbers between 40 and 200
  if (!isNaN(value) && value >= 40 && value <= 200) {
    bpmSlider.value = value; // Update slider position
    bpmValue.textContent = value; // Update BPM label

    // If metronome is running, restart with the new BPM
    if (intervalId) {
      clearInterval(intervalId);
      const bpm = bpmInput.value;
      const interval = 60000 / bpm;
      drawMetronome(interval, startTime);
    }
  } else if (value === "") {
    bpmSlider.value = 60; // Reset if input is empty
    bpmValue.textContent = 60;
  }
});

// Start the metronome
startBtn.addEventListener("click", () => {
  if (intervalId) return;

  const bpm = bpmSlider.value;
  const interval = 60000 / bpm;
  cumulativeBeats = 0;
  beats = [];
  times = [];
  bpmTimes = [];
  bpmValues = [];

  chartBeats.data.labels = times;
  chartBeats.data.datasets[0].data = beats;
  chartBeats.update();

  chartBPM.data.labels = bpmTimes;
  chartBPM.data.datasets[0].data = bpmValues;
  chartBPM.update();

  startTime = Date.now();
  audioContext.resume().then(() => {
    drawMetronome(interval, startTime);
  });
});

function playTone(frequency, duration) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain(); 

  oscillator.type = "sine"; //triangle or square can also be used
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime); // Set frequency
  oscillator.connect(gainNode); 
  gainNode.connect(audioContext.destination); 

  oscillator.start();

  gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(
    0,
    audioContext.currentTime + duration / 1000
  );
  setTimeout(() => oscillator.stop(), duration);
}

function drawMetronome(interval, startTime) {
  intervalId = setInterval(() => {
    cumulativeBeats += 1;
    beats.push(cumulativeBeats);
    const now = Date.now();
    const elapsedTime = (now - startTime) / 1000; // Time in seconds

    times.push(elapsedTime);
    bpmTimes.push(elapsedTime);
    bpmValues.push(bpmSlider.value); // Log current BPM

    updateGraphBeats();
    updateGraphBPM();

    playTone(440, 150); // Plays a 440Hz tone for 100ms
  }, interval);
}

// Stop the metronome
stopBtn.addEventListener("click", () => {
  if (!intervalId) return;

  clearInterval(intervalId);
  intervalId = null;
});

// Update the graph for cumulative beats
function updateGraphBeats() {
  chartBeats.data.labels = times;
  chartBeats.data.datasets[0].data = beats;
  chartBeats.update();
}

// Update the graph for BPM vs Time
function updateGraphBPM() {
  chartBPM.data.labels = bpmTimes;
  chartBPM.data.datasets[0].data = bpmValues;
  chartBPM.update();
}
