// Таймер
let timer = {
    isRunning: false,
    startTime: 0,
    totalSeconds: 0,
    interval: null
};

function updateTimerDisplay() {
    const hours = Math.floor(timer.totalSeconds / 3600);
    const minutes = Math.floor((timer.totalSeconds % 3600) / 60);
    const seconds = timer.totalSeconds % 60;
    document.querySelector('.timer-display').textContent =
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function toggleTimer() {
    if (timer.isRunning) {
        clearInterval(timer.interval);
        timer.isRunning = false;
        document.getElementById('timer-toggle').textContent = '▶️';
    } else {
        timer.startTime = Date.now() - (timer.totalSeconds * 1000);
        timer.interval = setInterval(() => {
            timer.totalSeconds = Math.floor((Date.now() - timer.startTime) / 1000);
            updateTimerDisplay();
            localStorage.setItem('work-timer', JSON.stringify({
                totalSeconds: timer.totalSeconds,
                isRunning: true
            }));
        }, 1000);
        timer.isRunning = true;
        document.getElementById('timer-toggle').textContent = '⏸️';
    }
}

// Загрузка состояния таймера
const savedTimer = JSON.parse(localStorage.getItem('work-timer'));
if (savedTimer) {
    timer.totalSeconds = savedTimer.totalSeconds || 0;
    timer.isRunning = savedTimer.isRunning || false;
    if (timer.isRunning) {
        timer.startTime = Date.now() - (timer.totalSeconds * 1000);
        timer.interval = setInterval(() => {
            timer.totalSeconds = Math.floor((Date.now() - timer.startTime) / 1000);
            updateTimerDisplay();
        }, 1000);
        document.getElementById('timer-toggle').textContent = '⏸️';
    }
    updateTimerDisplay();
}

document.getElementById('timer-toggle').addEventListener('click', toggleTimer);