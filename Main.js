// --- GAME RUNTIME VARIABLES ---
let score = 0;
let timeLeft = 30;
let gameInterval = null;
let dogSpawnTimeout = null;
let isPaused = false;
let currentSpawnDelay = 1000; // Time in ms between spawns

const dogEmojis = ['🐶', '🐕', '🦮', '🐕‍🦺', '🐩', '🐾'];

// --- DOM ELEMENTS REFERENCE ---
const gameContainer = document.getElementById('game-container');
const scoreTxt = document.getElementById('score-txt');
const highTxt = document.getElementById('high-txt');
const timerTxt = document.getElementById('timer-txt');
const finalScoreTxt = document.getElementById('final-score');
const newHighMsg = document.getElementById('new-high-msg');

const startScreen = document.getElementById('start-screen');
const pauseScreen = document.getElementById('pause-screen');
const gameOverScreen = document.getElementById('game-over-screen');

const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const pauseBtn = document.getElementById('pause-btn');
const resumeBtn = document.getElementById('resume-btn');

// --- AUDIO GENERATION (Web Audio API for lag-free mobile taps) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playBarkSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.05);
    osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.16);
}

// --- PERSISTENT HIGH SCORE LOAD ---
let highScore = localStorage.getItem('dog_high_score') || 0;
highTxt.textContent = highScore;

// --- LISTENERS MATRIX ---
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

pauseBtn.addEventListener('click', () => {
    if(!isPaused) pauseGame();
});

resumeBtn.addEventListener('click', () => {
    if(isPaused) resumeGame();
});

// --- STATE ACTIONS ---

function startGame() {
    score = 0;
    timeLeft = 30;
    currentSpawnDelay = 1000;
    isPaused = false;
    
    scoreTxt.textContent = score;
    timerTxt.textContent = timeLeft;
    
    // Clear left-over targets from past rounds
    document.querySelectorAll('.dog').forEach(d => d.remove());
    
    startScreen.classList.add('hide');
    gameOverScreen.classList.add('hide');
    pauseScreen.classList.add('hide');
    pauseBtn.classList.remove('hide');
    newHighMsg.classList.add('hide');

    // Unlock browser audio protection
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    gameInterval = setInterval(updateTimer, 1000);
    spawnLoop();
}

function updateTimer() {
    timeLeft--;
    timerTxt.textContent = timeLeft;

    // DIFFICULTY SCALING LOGIC
    if (timeLeft <= 10) {
        currentSpawnDelay = 450;  // Rapid chaos speed!
    } else if (timeLeft <= 20) {
        currentSpawnDelay = 650;  // Mid-stage speed up
    }

    if (timeLeft <= 0) {
        endGame();
    }
}

function spawnLoop() {
    if (isPaused) return;

    spawnDog();
    dogSpawnTimeout = setTimeout(spawnLoop, currentSpawnDelay);
}

function spawnDog() {
    const dog = document.createElement('div');
    dog.classList.add('dog');
    dog.textContent = dogEmojis[Math.floor(Math.random() * dogEmojis.length)];

    // Boundary configuration limits inside game screen wrapper
    const padding = 90;
    const maxX = gameContainer.clientWidth - padding;
    const maxY = gameContainer.clientHeight - padding;
    
    // Ensure boundaries prevent hiding behind UI layout at top
    const randomX = Math.max(10, Math.floor(Math.random() * maxX));
    const randomY = Math.max(85, Math.floor(Math.random() * maxY));

    dog.style.left = `${randomX}px`;
    dog.style.top = `${randomY}px`;

    // Interactive Bindings (Supports desktop and mobile double-firing protection)
    dog.addEventListener('touchstart', handleDogTap);
    dog.addEventListener('mousedown', handleDogTap);

    gameContainer.appendChild(dog);

    // Timeout execution wrapper - cleaning targets if player misses
    setTimeout(() => {
        if(dog && !dog.classList.contains('clicked') && !isPaused) {
            dog.remove();
        }
    }, 1500);
}

function handleDogTap(e) {
    e.preventDefault(); // Blocks standard simulated web touch clicks
    
    const clickedDog = e.currentTarget;
    if(clickedDog.classList.contains('clicked')) return;

    clickedDog.classList.add('clicked');
    score++;
    scoreTxt.textContent = score;
    
    playBarkSound();

    setTimeout(() => {
        clickedDog.remove();
    }, 200);
}

function pauseGame() {
    isPaused = true;
    clearInterval(gameInterval);
    clearTimeout(dogSpawnTimeout);
    pauseScreen.classList.remove('hide');
}

function resumeGame() {
    isPaused = false;
    pauseScreen.classList.add('hide');
    gameInterval = setInterval(updateTimer, 1000);
    spawnLoop();
}

function endGame() {
    clearInterval(gameInterval);
    clearTimeout(dogSpawnTimeout);
    pauseBtn.classList.add('hide');
    
    document.querySelectorAll('.dog').forEach(d => d.remove());

    // Storage updates
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('dog_high_score', highScore);
        highTxt.textContent = highScore;
        newHighMsg.classList.remove('hide');
    }

    finalScoreTxt.textContent = score;
    gameOverScreen.classList.remove('hide');
}
