// Game variables
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('start-button');
const speedSelect = document.getElementById('speed-select');
const scoreDisplay = document.getElementById('score');
const ngCountDisplay = document.getElementById('ng-count');
const gameMessage = document.getElementById('game-message');

const gridSize = 20; // Size of each square in pixels
const tileCount = canvas.width / gridSize;
let snake = [];
let food = {};
let dx = gridSize; // Initial direction x (Right)
let dy = 0;        // Initial direction y
let score = 0;
let ngCount = 0;
let gameInterval;
let gameSpeed = 150; // Default normal speed (ms)
let isRunning = false;
let inputQueue = []; // For handling rapid key presses

// Speed Map
const speedMap = {
    'slow': 200,
    'normal': 150,
    'fast': 100
};

// --- Game Initialization and Control ---

function initGame() {
    snake = [
        { x: 6 * gridSize, y: 0 },
        { x: 5 * gridSize, y: 0 },
        { x: 4 * gridSize, y: 0 }
    ];
    dx = gridSize;
    dy = 0;
    score = 0;
    ngCount = 0;
    isRunning = true;
    inputQueue = [];
    
    updateDisplays();
    placeFood();
    gameMessage.classList.add('hidden');
    
    // Set game speed based on selection
    gameSpeed = speedMap[speedSelect.value];

    // Clear any existing interval and start new game loop
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeed);
}

function updateDisplays() {
    scoreDisplay.textContent = score;
    ngCountDisplay.textContent = `${ngCount} / 10`;
}

function stopGame(message) {
    clearInterval(gameInterval);
    isRunning = false;
    gameMessage.textContent = message;
    gameMessage.classList.remove('hidden');
    startButton.textContent = '▶️ دوبارہ شروع کریں (Restart Game)';
}

function handleInput() {
    if (inputQueue.length > 0) {
        const key = inputQueue.shift();
        
        // Prevent reversing direction
        if (key === 'ArrowLeft' && dx === 0) { dx = -gridSize; dy = 0; }
        else if (key === 'ArrowUp' && dy === 0) { dx = 0; dy = -gridSize; }
        else if (key === 'ArrowRight' && dx === 0) { dx = gridSize; dy = 0; }
        else if (key === 'ArrowDown' && dy === 0) { dx = 0; dy = gridSize; }
    }
}

// --- Game Logic ---

function gameLoop() {
    if (!isRunning) return;

    handleInput(); // Process one queued input per frame

    // 1. Calculate new head position
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // 2. Check for collisions (Wall and Self)
    if (checkWallCollision(head) || checkSelfCollision(head)) {
        ngCount++;
        updateDisplays();

        if (ngCount >= 10) {
            stopGame('گیم ختم! (Game Over)');
            return;
        }

        // Apply NG penalty: reset snake, keep direction, lose 1 segment (if longer than 1)
        snake = [{ x: head.x, y: head.y }]; // Reset to current position
        if (snake.length > 1) snake.pop();
        placeFood(); // Move food if snake hit wall near food
    }

    // Add new head
    snake.unshift(head);

    // 3. Check for food
    if (head.x === food.x && head.y === food.y) {
        score++;
        updateDisplays();
        placeFood(); // Place new food
        // Snake length is not popped, thus it grows
    } else {
        // Remove tail if no food eaten
        snake.pop();
    }

    // 4. Draw everything
    drawGame();
}

function checkWallCollision(head) {
    return head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height;
}

function checkSelfCollision(head) {
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) return true;
    }
    return false;
}

function placeFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * tileCount) * gridSize,
            y: Math.floor(Math.random() * tileCount) * gridSize
        };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    food = newFood;
}

// --- Drawing ---

function drawGame() {
    // Clear canvas
    ctx.fillStyle = '#e6ffe6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw food (Red circle)
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(food.x + gridSize / 2, food.y + gridSize / 2, gridSize / 2, 0, 2 * Math.PI);
    ctx.fill();

    // Draw snake (Dark green squares)
    snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? '#38761d' : '#6aa84f'; // Head is darker
        ctx.fillRect(segment.x, segment.y, gridSize, gridSize);
        ctx.strokeStyle = '#e6ffe6';
        ctx.strokeRect(segment.x, segment.y, gridSize, gridSize);
    });
}

// --- Event Listeners ---

startButton.addEventListener('click', initGame);

document.addEventListener('keydown', (e) => {
    if (!isRunning) return;

    // Only allow direction keys
    const validKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    if (validKeys.includes(e.key)) {
        e.preventDefault(); // Prevent page scrolling
        // Add key to the queue, but only if it's different from the last one
        if (inputQueue[inputQueue.length - 1] !== e.key) {
             inputQueue.push(e.key);
        }
    }
});

speedSelect.addEventListener('change', () => {
    if (isRunning) {
        // Apply new speed immediately if game is running
        gameSpeed = speedMap[speedSelect.value];
        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, gameSpeed);
    }
});