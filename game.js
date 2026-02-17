const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GRAVITY = 0.9;

let gameState = "menu";

const playerImg = new Image();
playerImg.src = "player.png";

const enemyImg = new Image();
enemyImg.src = "enemy.png";

const groundImg = new Image();
groundImg.src = "ground.png";

const bulletImg = new Image();
bulletImg.src = "st.png";

let keys = {};
document.addEventListener("keydown", e => {
    keys[e.code] = true;
    if (e.code === "Escape" && gameState === "playing") pauseGame();
});
document.addEventListener("keyup", e => keys[e.code] = false);

let player, enemies, bullets, enemyBullets, cameraX, spawnTimer;

function init() {
    player = {
        x: 100,
        y: 300,
        w: 50,
        h: 85,
        vy: 0,
        health: 100,
        shootCooldown: 0
    };
    enemies = [];
    bullets = [];
    enemyBullets = [];
    cameraX = 0;
    spawnTimer = 0;
}

function startGame() {
    document.getElementById("menu").classList.add("hidden");
    init();
    gameState = "playing";
    requestAnimationFrame(gameLoop);
}

function pauseGame() {
    gameState = "pause";
    document.getElementById("pause").classList.remove("hidden");
}

function resumeGame() {
    document.getElementById("pause").classList.add("hidden");
    gameState = "playing";
    requestAnimationFrame(gameLoop);
}

function restartGame() {
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    init();
    gameState = "playing";
    requestAnimationFrame(gameLoop);
}

function quitGame() {
    location.reload();
}

function gameOver() {
    gameState = "over";
    document.getElementById("gameover").classList.remove("hidden");
}

function rectsCollide(a, b) {
    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}

function gameLoop() {
    if (gameState !== "playing") return;

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // PLAYER MOVE
    if (keys["KeyA"]) player.x -= 6;
    if (keys["KeyD"]) player.x += 6;
    if (keys["KeyW"] && player.y + player.h >= 420) player.vy = -17;

    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.h >= 420) {
        player.y = 420 - player.h;
        player.vy = 0;
    }

    cameraX = Math.max(0, player.x - 250);

    // SHOOT
    if (keys["Space"] && player.shootCooldown <= 0) {
        bullets.push({ x: player.x + player.w, y: player.y + 40, w: 18, h: 8 });
        player.shootCooldown = 10;
    }
    if (player.shootCooldown > 0) player.shootCooldown--;

    bullets.forEach(b => b.x += 14);
    bullets = bullets.filter(b => b.x < cameraX + WIDTH + 200);

    // ENEMY SPAWN
    spawnTimer++;
    if (spawnTimer > 120) {
        spawnTimer = 0;
        enemies.push({ x: cameraX + WIDTH + 200, y: 300, w: 85, h: 120, hp: 5, t: 0 });
    }

    // ENEMY AI
    enemies.forEach(e => {
        if (Math.abs(e.x - player.x) < 800) {
            e.t++;
            if (e.t > 90) {
                e.t = 0;
                enemyBullets.push({ x: e.x, y: e.y + 50, w: 35, h: 25 });
            }
        }
    });

    enemyBullets.forEach(b => b.x -= 9);

    // COLLISIONS
    bullets.forEach(b => {
        enemies.forEach(e => {
            if (rectsCollide(b, e)) {
                e.hp--;
                b.x = 99999;
            }
        });
    });

    enemies = enemies.filter(e => e.hp > 0);
    bullets = bullets.filter(b => b.x < 9000);

    enemyBullets.forEach(b => {
        if (rectsCollide(b, player)) {
            player.health -= 10;
            b.x = -999;
        }
    });
    enemyBullets = enemyBullets.filter(b => b.x > cameraX);

    if (player.health <= 0) {
        gameOver();
        return;
    }

    // DRAW GROUND
    for (let x = Math.floor(cameraX / 200) * 200; x < cameraX + WIDTH; x += 200) {
        ctx.drawImage(groundImg, x - cameraX, 420, 200, 80);
    }

    // DRAW PLAYER
    ctx.drawImage(playerImg, player.x - cameraX, player.y - 40, 68, 68);

    // DRAW ENEMIES
    enemies.forEach(e => ctx.drawImage(enemyImg, e.x - cameraX, e.y, 85, 120));

    // BULLETS
    ctx.fillStyle = "yellow";
    bullets.forEach(b => ctx.fillRect(b.x - cameraX, b.y, b.w, b.h));
    enemyBullets.forEach(b => ctx.drawImage(bulletImg, b.x - cameraX, b.y, 35, 25));

    // HEALTH BAR
    ctx.fillStyle = "red";
    ctx.fillRect(20, 20, 200, 20);
    ctx.fillStyle = "green";
    ctx.fillRect(20, 20, player.health * 2, 20);

    requestAnimationFrame(gameLoop);
}
