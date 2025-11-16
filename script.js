const gameContainer = document.getElementById("game-container");
const basket = document.getElementById("basket");
const heartsContainer = document.getElementById("hearts");
const scoreDisplay = document.getElementById("score");
const gameOverScreen = document.getElementById("game-over");
const finalScore = document.getElementById("final-score");
const restartBtn = document.getElementById("restart-btn");

// Sounds
const catchSound = new Audio("sound1.mp3");
const missSound = new Audio("sound2.mp3");
const bonusSound = new Audio("sound3.mp3");

// Unlock sounds on first user interaction
let soundUnlocked = false;
function unlockSounds() {
  if (!soundUnlocked) {
    // Play one short silent sound to unlock audio
    catchSound.play().then(() => catchSound.pause()).catch(() => {});
    soundUnlocked = true;
  }
}
document.addEventListener("click", unlockSounds, { once: true });
document.addEventListener("mousemove", unlockSounds, { once: true });

// Game state
let score = 0;
let lives = 3;
let level = 1;
let objects = [];
let gameRunning = true;
let highScore = localStorage.getItem("highScore") || 0;

// Smooth basket movement using mouse
let targetX = basket.offsetLeft;
document.addEventListener("mousemove", (e) => {
  const rect = gameContainer.getBoundingClientRect();
  let x = e.clientX - rect.left - basket.offsetWidth / 2;
  if (x < 0) x = 0;
  if (x > gameContainer.offsetWidth - basket.offsetWidth)
    x = gameContainer.offsetWidth - basket.offsetWidth;
  targetX = x;
});
function moveBasket() {
  const currentX = parseFloat(basket.style.left || 0);
  basket.style.left = currentX + (targetX - currentX) * 0.2 + "px";
  requestAnimationFrame(moveBasket);
}
moveBasket();

// Update hearts
function updateHearts() {
  heartsContainer.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const img = document.createElement("img");
    img.src = i < lives ? "heart_full.png" : "heart_empty.png";
    heartsContainer.appendChild(img);
  }
}

// Update level
function updateLevel() {
  level = Math.floor(score / 10) + 1;
}

// Create sparkles
function createSparkles(x, y, count = 10) {
  for (let i = 0; i < count; i++) {
    const sparkle = document.createElement("div");
    sparkle.classList.add("sparkle");
    sparkle.style.left = x + Math.random() * 30 - 15 + "px";
    sparkle.style.top = y + Math.random() * 30 - 15 + "px";
    sparkle.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
    gameContainer.appendChild(sparkle);
    sparkle.addEventListener("animationend", () => sparkle.remove());
  }
}

// Create falling object
function createObject() {
  const obj = document.createElement("img");
  const rand = Math.random();
  if (rand < 0.7) obj.src = "object1.png";      // normal
  else if (rand < 0.9) obj.src = "object2.png"; // harmful
  else obj.src = "object3.png";                 // bonus

  obj.classList.add("object");
  obj.style.left = Math.random() * (gameContainer.offsetWidth - 50) + "px";
  obj.style.top = "0px";
  gameContainer.appendChild(obj);
  objects.push(obj);
}

// Game loop
let lastSpawn = 0;
function gameLoop(timestamp) {
  if (!gameRunning) return;

  if (!lastSpawn) lastSpawn = timestamp;
  if (timestamp - lastSpawn > Math.max(300, 1000 - score * 20)) {
    createObject();
    lastSpawn = timestamp;
  }

  const speed = 5 + Math.floor(score / 5);

  objects.forEach((obj, index) => {
    const objTop = parseInt(obj.style.top);
    obj.style.top = objTop + speed + "px";

    const objRect = obj.getBoundingClientRect();
    const basketRect = basket.getBoundingClientRect();

    if (
      objRect.bottom >= basketRect.top &&
      objRect.left < basketRect.right &&
      objRect.right > basketRect.left &&
      objRect.top < basketRect.bottom
    ) {
      if (obj.src.includes("object1.png")) {
        score++;
        if (soundUnlocked) catchSound.play();
      } else if (obj.src.includes("object2.png")) {
        lives--;
        if (soundUnlocked) missSound.play();
        updateHearts();
      } else if (obj.src.includes("object3.png")) {
        score += 3;
        lives = Math.min(lives + 1, 3);
        if (soundUnlocked) bonusSound.play();
        updateHearts();
        createSparkles(objRect.left + objRect.width / 2, objRect.top + objRect.height / 2);
      }

      obj.remove();
      objects.splice(index, 1);
      updateLevel();
      scoreDisplay.textContent = `Score: ${score} | High Score: ${highScore} | Level: ${level}`;
      if (lives <= 0) endGame();
    } else if (objTop > gameContainer.offsetHeight) {
      if (obj.src.includes("object1.png") || obj.src.includes("object3.png")) {
        lives--;
        if (soundUnlocked) missSound.play();
        updateHearts();
        if (lives <= 0) endGame();
      }
      obj.remove();
      objects.splice(index, 1);
    }
  });

  requestAnimationFrame(gameLoop);
}

// End game
function endGame() {
  gameRunning = false;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
  }
  finalScore.textContent = score;
  gameOverScreen.classList.remove("hidden");
}

// Restart game
restartBtn.addEventListener("click", () => {
  score = 0;
  lives = 3;
  level = 1;
  objects.forEach((obj) => obj.remove());
  objects = [];
  updateHearts();
  scoreDisplay.textContent = `Score: ${score} | High Score: ${highScore} | Level: ${level}`;
  gameOverScreen.classList.add("hidden");
  gameRunning = true;
  lastSpawn = 0;
  gameLoop();
});

// Start game
updateHearts();
scoreDisplay.textContent = `Score: ${score} | High Score: ${highScore} | Level: ${level}`;
gameLoop();
