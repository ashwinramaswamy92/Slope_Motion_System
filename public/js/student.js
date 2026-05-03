// public/js/student.js

import { socket } from './socketClient.js';
import { initMetronome } from '../metronome/metronome.js';

Chart.defaults.font.size = 18;

const ctx = document.getElementById('myChart').getContext('2d');
const data = {
  labels: [],
  datasets: [
    { label: 'Acceleration X', borderColor: 'rgba(255, 99, 132, 1)', backgroundColor: 'rgba(255, 99, 132, 0.2)', borderWidth: 3, data: [] },
    { label: 'Acceleration Y', borderColor: 'rgba(54, 162, 235, 1)', backgroundColor: 'rgba(54, 162, 235, 0.2)', borderWidth: 3, data: [] },
    { label: 'Acceleration Z', borderColor: 'rgba(75, 192, 192, 1)', backgroundColor: 'rgba(75, 192, 192, 0.2)', borderWidth: 3, data: [] }
  ]
};

const config = {
  type: 'line',
  data: data,
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { type: 'linear', position: 'bottom', min: 0, max: 30000, title: { display: true, text: 'Time (ms) - (X - axis)' } },
      y: { min: -80, max: 80, title: { display: true, text: 'Acceleration - (Y -axis)' } }
    }
  }
};

const myChart = new Chart(ctx, config);
let steps = [];
let isCollectingData = false;
let startTime = 0;
let stepsChart = null;
const stepCountElement = document.getElementById('stepCount');
const dataCountElement = document.getElementById('dataCount');

// Classroom join
document.getElementById('joinButton').addEventListener('click', () => {
  const code = document.getElementById('classroomCode').value.trim();
  if (code) {
    socket.emit('joinClassroom', code);
    document.getElementById('connectionStatus').style.display = 'block';
    document.getElementById('connectionError').style.display = 'block';
    document.getElementById('connectionStatus').textContent = `Attempting to join classroom: ${code}`;
    document.getElementById('connectionError').textContent = '';
  }
});

socket.on('joinedClassroom', (code) => {
  document.getElementById('connectionStatus').textContent = `Successfully joined classroom: ${code}`;
  document.getElementById('connectionError').textContent = '';
});
socket.on('joinError', (err) => {
  document.getElementById('connectionStatus').textContent = '';
  document.getElementById('connectionError').textContent = `Failed to join: ${err.message}`;
});

// Start collection with countdown
document.getElementById('startButton').addEventListener('click', () => {
  let countdown = 5;
  const countdownElement = document.getElementById('countdown');
  countdownElement.style.display = 'block';
  const interval = setInterval(() => {
    countdown--;
    if (countdown > 0) {
      countdownElement.textContent = `Starting in ${countdown}...`;
    } else {
      clearInterval(interval);
      countdownElement.textContent = 'Go!';
      setTimeout(() => {
        countdownElement.style.display = 'none';
        countdownElement.textContent = '';
      }, 500);

      startTime = Date.now();
      isCollectingData = true;
      data.labels = [];
      data.datasets.forEach(ds => ds.data = []);
      steps = [];
      stepCountElement.textContent = 'Step Count: 0';
      dataCountElement.style.display = 'block';
      stepCountElement.style.display = 'block';

      setTimeout(stopDataCollection, 30000);
      window.addEventListener('devicemotion', collectData);
    }
  }, 1000);
});

function stopDataCollection() {
  isCollectingData = false;
  window.removeEventListener('devicemotion', collectData);
  countSteps();
}

function collectData(event) {
  if (!isCollectingData) return;
  const acc = event.accelerationIncludingGravity;
  if (!acc) return;
  const now = Date.now() - startTime;
  if (now > 30000) {
    stopDataCollection();
    return;
  }
  data.labels.push(now);
  data.datasets[0].data.push({ x: now, y: acc.x });
  data.datasets[1].data.push({ x: now, y: acc.y });
  data.datasets[2].data.push({ x: now, y: acc.z });
  dataCountElement.textContent = `Data Points: ${data.labels.length}`;
  myChart.update();
}

function countSteps() {
  const threshold = 8.0;
  const windowSize = 5;
  const xData = data.datasets[0].data.map(p => p.y);
  for (let i = windowSize; i < xData.length - windowSize; i++) {
    let isPeak = true;
    for (let j = i - windowSize; j <= i + windowSize; j++) {
      if (xData[i] <= xData[j] && i !== j) {
        isPeak = false;
        break;
      }
    }
    if (isPeak && xData[i] > threshold) {
      steps.push({ time: data.labels[i], acceleration: xData[i] });
    }
  }
  // Extend to 30000ms
  const lastTime = data.labels[data.labels.length - 1];
  if (lastTime < 30000) {
    steps.push({ time: 30000, acceleration: xData[xData.length - 1] });
  }
  stepCountElement.textContent = `Step Count: ${Math.floor(steps.length / 2)}`;
  drawStepsChart();
}

function drawStepsChart() {
  const stepsCtx = document.getElementById('stepsChart').getContext('2d');
  const stepsData = {
    labels: steps.map(s => s.time),
    datasets: [{
      label: 'Steps',
      borderColor: 'rgba(255, 159, 64, 1)',
      backgroundColor: 'rgba(255, 159, 64, 0.2)',
      data: steps.map((s, i) => ({ x: s.time, y: i + 1 }))
    }]
  };
  const stepsConfig = {
    type: 'line',
    data: stepsData,
    options: {
      responsive: true,
      scales: {
        x: { min: 0, max: 30000, type: 'linear', title: { display: true, text: 'Time (ms) - (X - axis)' } },
        y: { min: 0, max: 50, title: { display: true, text: 'Movement Count - (Y - axis)' } }
      }
    }
  };

  if (stepsChart) stepsChart.destroy();
  stepsChart = new Chart(stepsCtx, stepsConfig);
  document.getElementById('steps-class').style.display = 'block';

  document.getElementById('yMaxInput').addEventListener('input', function () {
    const val = parseFloat(this.value);
    if (!isNaN(val) && stepsChart) {
      stepsChart.options.scales.y.max = val;
      stepsChart.update();
    }
  });
}

// Send data
document.getElementById('sendButton').addEventListener('click', () => {
  const code = document.getElementById('classroomCode').value.trim();
  const graphData = {
    labels: steps.map(s => s.time),
    userSteps: steps.map((s, i) => ({ x: s.time, y: i + 1 }))
  };
  socket.emit('sendGraphData', { classroomCode: code, graphData });
  this.disabled = true;
});

// Refresh
document.getElementById('refreshDataButton').addEventListener('click', () => {
  data.labels = [];
  data.datasets.forEach(ds => ds.data = []);
  myChart.update();
  if (stepsChart) {
    stepsChart.destroy();
    stepsChart = null;
  }
  steps = [];
  document.getElementById('steps-class').style.display = 'none';
  stepCountElement.style.display = 'none';
  dataCountElement.style.display = 'none';
  document.getElementById('sendButton').disabled = false;
  socket.emit('clearData');
});

// Initialise embedded metronome
initMetronome(document.getElementById('metronome-container'));