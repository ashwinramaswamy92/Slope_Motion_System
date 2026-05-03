// public/js/teacher.js

import { socket } from './socketClient.js';
import { convertToCSV, downloadFile } from './utils.js';

Chart.defaults.font.size = 18;

const mainChartCtx = document.getElementById('mainChart').getContext('2d');
const mainData = { labels: [], datasets: [] };

const mainChart = new Chart(mainChartCtx, {
  type: 'line',
  data: mainData,
  options: {
    responsive: true,
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        grid: { display: true },
        title: { display: true, text: 'Time (ms) (X-axis)' }
      },
      y: {
        min: 0,
        max: 60,
        grid: { display: true },
        title: { display: true, text: 'Movement Count (Y-axis)' }
      }
    },
    plugins: { legend: { display: true } }
  }
});

const colors = [
  'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)',
  'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)',
  'rgba(0, 255, 127, 1)', 'rgba(255, 0, 255, 1)'
];
const names = [
  'Penguin', 'Tortoise', 'Fox', 'Dog', 'Cat', 'Bat', 'Bull', 'Chicken',
  'Horse', 'Lizard', 'Goat', 'Kangaroo', 'Rabbit', 'Deer', 'Cheetah',
  'Zebra', 'Elephant', 'Leopard', 'Tiger', 'Wolf', 'Dolphin', 'Panda',
  'Owl', 'Hedgehog', 'Squirrel'
];

let randomNames = null;
function shuffleNames(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function getName(index) { return randomNames[index % names.length]; }
function getColor(index) { return colors[index % colors.length]; }

// Input type toggling
const inputTypeSelect = document.getElementById('inputTypeSelect');
const dataInputContainer = document.getElementById('dataInputContainer');
const functionInputContainer = document.getElementById('functionInputContainer');

inputTypeSelect.addEventListener('change', () => {
  if (inputTypeSelect.value === 'points') {
    dataInputContainer.style.display = 'block';
    functionInputContainer.style.display = 'none';
  } else {
    dataInputContainer.style.display = 'none';
    functionInputContainer.style.display = 'block';
  }
});

// Download data
document.getElementById('downloadDataButton').addEventListener('click', () => {
  socket.emit('requestAllData');
});

socket.on('allDataResponse', (data) => {
  const csv = convertToCSV(data);
  downloadFile('user_data.csv', csv);
  // Also download chart image
  const image = mainChart.toBase64Image();
  const link = document.createElement('a');
  link.href = image;
  link.download = 'graph_image.png';
  link.click();
});

// Receive student data
socket.on('receiveGraphData', (data) => {
  mainData.labels = data.labels;
  const idx = mainData.datasets.length;
  const borderColor = getColor(idx);
  const backgroundColor = borderColor.replace(', 1)', ', 0.2)');
  mainData.datasets.push({
    label: getName(idx),
    borderColor,
    backgroundColor,
    data: data.userSteps,
    fill: false
  });
  mainChart.update();
});

// Classroom code generation
const generateCodeButton = document.getElementById('generateCodeButton');
const codeDisplay = document.getElementById('codeDisplay');
generateCodeButton.addEventListener('click', () => {
  generateCodeButton.style.display = 'none';
  randomNames = shuffleNames([...names]);
  socket.emit('createClassroom');
});
socket.on('classroomCreated', (code) => {
  codeDisplay.textContent = `Classroom Code: ${code}`;
});

// Y-Axis max input
document.getElementById('yMaxInput').addEventListener('input', function () {
  const val = parseFloat(this.value);
  if (!isNaN(val)) {
    mainChart.options.scales.y.max = val;
    mainChart.update();
  }
});

// Add custom data (points or function)
const addDataButton = document.getElementById('addDataButton');
const dataPointsInput = document.getElementById('dataPointsInput');
const functionInput = document.getElementById('functionInput');
const dataExampleSelect = document.getElementById('data_example_select');
const functionExampleSelect = document.getElementById('function_example_select');

dataExampleSelect.addEventListener('change', () => {
  dataPointsInput.value = dataExampleSelect.value !== 'v0' ? dataExampleSelect.value : '';
});
functionExampleSelect.addEventListener('change', () => {
  functionInput.value = functionExampleSelect.value !== 'v0' ? functionExampleSelect.value : '';
});

addDataButton.addEventListener('click', () => {
  const idx = mainData.datasets.length;
  const borderColor = getColor(idx);
  const backgroundColor = borderColor.replace(', 1)', ', 0.2)');

  if (inputTypeSelect.value === 'points') {
    const input = dataPointsInput.value.trim();
    if (!input) return;
    const points = input.split(' ').map(pair => {
      const [x, y] = pair.split(',').map(Number);
      return { x, y };
    });
    if (points.every(p => !isNaN(p.x) && !isNaN(p.y))) {
      mainData.datasets.push({
        label: `Custom Data ${idx + 1}`,
        borderColor,
        backgroundColor,
        data: points,
        fill: false,
        isCustom: true
      });
      mainChart.update();
      dataPointsInput.value = '';
    } else alert('Invalid input.');
  } else {
    const funcStr = functionInput.value.trim();
    if (!funcStr) return;
    try {
      const fn = new Function('x', `return ${funcStr};`);
      const points = [];
      for (let x = 0; x <= 30000; x += 1) {
        const y = fn(x);
        if (!isNaN(y)) points.push({ x, y });
      }
      const display = funcStr.replace(/\*\*/g, '^');
      mainData.datasets.push({
        label: `Function: y = ${display}`,
        borderColor,
        backgroundColor,
        data: points,
        fill: false,
        isCustom: true
      });
      mainChart.update();
      functionInput.value = '';
    } catch (e) { alert('Invalid function.'); }
  }
});

// Refresh data
document.getElementById('refreshDataButton').addEventListener('click', () => {
  mainData.labels = [];
  mainData.datasets = [];
  mainChart.update();
  socket.emit('clearData');
});

// Toggle controls
document.getElementById('togglePlot').addEventListener('change', function () {
  mainData.datasets.forEach(ds => ds.hidden = !this.checked);
  mainChart.update();
});
document.getElementById('toggleGrid').addEventListener('change', function () {
  mainChart.options.scales.x.grid.display = this.checked;
  mainChart.options.scales.y.grid.display = this.checked;
  mainChart.update();
});
document.getElementById('toggleAxes').addEventListener('change', function () {
  mainChart.options.scales.x.display = this.checked;
  mainChart.options.scales.y.display = this.checked;
  mainChart.update();
});
document.getElementById('toggleLegend').addEventListener('change', function () {
  mainChart.options.plugins.legend.display = this.checked;
  mainChart.update();
});
document.getElementById('toggleAlgebra').addEventListener('change', function () {
  mainData.datasets.forEach(ds => {
    if (ds.isCustom) ds.hidden = !this.checked;
  });
  mainChart.update();
});