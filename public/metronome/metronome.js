// public/metronome/metronome.js

// Reusable metronome component.
// For standalone page: call initMetronomeGraph(container) where container has the expected structure.
// For embedding: call initMetronome(container) where container is any empty div – it creates the minimal UI.

// Minimal embedded metronome (used in student.html)
export function initMetronome(container) {
  container.innerHTML = `
    <div class="metronome-controls">
      <label for="bpm-input">BPM:</label>
      <input type="text" id="bpm-input" value="60" inputmode="numeric" pattern="[0-9]*">
      <button id="start-btn">Start</button>
      <button id="stop-btn">Stop</button>
    </div>
    <div id="metronome-animation">
      <div id="triangle-body"></div>
      <div class="pendulum"></div>
    </div>
  `;
  const bpmInput = container.querySelector('#bpm-input');
  const startBtn = container.querySelector('#start-btn');
  const stopBtn = container.querySelector('#stop-btn');
  setupMetronome(bpmInput, startBtn, stopBtn);
}

// Full metronome with graphs (standalone page)
export function initMetronomeGraph(container) {
  const bpmSlider = document.getElementById('bpm-slider');
  const bpmValue = document.getElementById('bpm-value');
  const bpmInput = document.getElementById('bpm-input');
  const startBtn = document.getElementById('start-btn');
  const stopBtn = document.getElementById('stop-btn');

  setupMetronome(bpmInput, startBtn, stopBtn);

  // Graph setup (identical to original script.js)
  const ctxBeats = document.getElementById('graph-beats').getContext('2d');
  const ctxBPM = document.getElementById('graph-bpm').getContext('2d');
  let intervalId = null;
  let cumulativeBeats = 0;
  let beats = [];
  let times = [];
  let bpmTimes = [];
  let bpmValues = [];
  let startTime = 0;
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  const chartBeats = new Chart(ctxBeats, {
    type: 'line',
    data: {
      labels: times,
      datasets: [{
        label: 'Cumulative Beats',
        data: beats,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 1,
      }]
    },
    options: {
      scales: {
        x: { title: { display: true, text: 'Time (s)' }, type: 'linear', position: 'bottom' },
        y: { title: { display: true, text: 'Cumulative Beats' } }
      },
      responsive: true,
      maintainAspectRatio: false
    }
  });

  const chartBPM = new Chart(ctxBPM, {
    type: 'line',
    data: {
      labels: bpmTimes,
      datasets: [{
        label: 'Current BPM',
        data: bpmValues,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderWidth: 1,
      }]
    },
    options: {
      scales: {
        x: { title: { display: true, text: 'Time (s)' }, type: 'linear', position: 'bottom' },
        y: { title: { display: true, text: 'BPM' } }
      },
      responsive: true,
      maintainAspectRatio: false
    }
  });

  function playTone(frequency, duration) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration / 1000);
    setTimeout(() => oscillator.stop(), duration);
  }

  function drawMetronome(interval, start) {
    intervalId = setInterval(() => {
      cumulativeBeats++;
      beats.push(cumulativeBeats);
      const now = Date.now();
      const elapsedTime = (now - start) / 1000;
      times.push(elapsedTime);
      bpmTimes.push(elapsedTime);
      bpmValues.push(bpmSlider.value);
      chartBeats.update();
      chartBPM.update();
      playTone(440, 150);
    }, interval);
  }

  startBtn.addEventListener('click', () => {
    if (intervalId) return;
    const bpm = bpmSlider.value;
    const interval = 60000 / bpm;
    cumulativeBeats = 0;
    beats = [];
    times = [];
    bpmTimes = [];
    bpmValues = [];
    startTime = Date.now();
    audioContext.resume().then(() => drawMetronome(interval, startTime));
  });

  stopBtn.addEventListener('click', () => {
    clearInterval(intervalId);
    intervalId = null;
  });

  bpmSlider.addEventListener('input', () => {
    bpmValue.textContent = bpmSlider.value;
    bpmInput.value = bpmSlider.value;
    document.documentElement.style.setProperty('--swing-duration', (60 / bpmSlider.value) + 's');
    if (intervalId) {
      clearInterval(intervalId);
      const bpm = bpmSlider.value;
      const interval = 60000 / bpm;
      drawMetronome(interval, startTime);
    }
  });

  bpmInput.addEventListener('input', () => {
    const value = bpmInput.value;
    if (!isNaN(value) && value >= 0 && value <= 200) {
      bpmSlider.value = value;
      bpmValue.textContent = value;
      document.documentElement.style.setProperty('--swing-duration', (60 / value) + 's');
      if (intervalId) {
        clearInterval(intervalId);
        const bpm = value;
        const interval = 60000 / bpm;
        drawMetronome(interval, startTime);
      }
    }
  });
}

// Common metronome logic
function setupMetronome(bpmInput, startBtn, stopBtn) {
  let intervalId = null;
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  function playBeep() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
  }

  function startMetronome() {
    if (intervalId) return;
    const bpm = parseInt(bpmInput.value) || 60;
    const interval = 60000 / bpm;
    document.documentElement.style.setProperty('--swing-duration', (60 / bpm) + 's');
    audioContext.resume();
    intervalId = setInterval(playBeep, interval);
  }

  function stopMetronome() {
    clearInterval(intervalId);
    intervalId = null;
  }

  bpmInput.addEventListener('input', () => {
    bpmInput.value = bpmInput.value.replace(/[^0-9]/g, '');
  });

  function applyBpm() {
    let bpm = parseInt(bpmInput.value) || 60;
    bpm = Math.min(Math.max(bpm, 40), 200);
    bpmInput.value = bpm;
    document.documentElement.style.setProperty('--swing-duration', (60 / bpm) + 's');
    if (intervalId) {
      stopMetronome();
      startMetronome();
    }
  }

  bpmInput.addEventListener('blur', applyBpm);
  bpmInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      applyBpm();
      bpmInput.blur();
    }
  });

  startBtn.addEventListener('click', startMetronome);
  stopBtn.addEventListener('click', stopMetronome);
}