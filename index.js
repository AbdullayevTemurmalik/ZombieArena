const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1000;
canvas.height = 700;

let score = 0;
let health = 1000;
let isGameOver = false;

// 1. DEVORLAR (O'yinchi va botlar sig'adigan qilib joylashtirildi)
const walls = [
  { x: 150, y: 150, w: 200, h: 30 },
  { x: 650, y: 150, w: 200, h: 30 },
  { x: 425, y: 335, w: 150, h: 30 },
  { x: 100, y: 500, w: 30, h: 100 },
  { x: 870, y: 500, w: 30, h: 100 },
  { x: 450, y: 550, w: 100, h: 30 },
];

// 2. O'YINCHI (Boshlang'ich nuqtasi devordan uzoq - 500, 500)
const player = { x: 500, y: 500, radius: 18, color: "#00d2ff", speed: 6 };

let bullets = [];
let enemyBullets = [];
let enemies = [];
let frameCount = 0;

const keys = {};
window.addEventListener("keydown", (e) => (keys[e.code] = true));
window.addEventListener("keyup", (e) => (keys[e.code] = false));

// To'qnashuvni tekshirish funksiyasi
function isColliding(x, y, r) {
  for (let w of walls) {
    if (x + r > w.x && x - r < w.x + w.w && y + r > w.y && y - r < w.y + w.h)
      return true;
  }
  return false;
}

// 3. XATOSIZ SPAWN (Zombilar faqat bo'sh joyda paydo bo'ladi)
function spawnEnemy() {
  if (isGameOver) return;
  const radius = 20;
  let x, y;

  // Ekran chetlaridan paydo qilish
  if (Math.random() < 0.5) {
    x = Math.random() < 0.5 ? -radius : canvas.width + radius;
    y = Math.random() * canvas.height;
  } else {
    x = Math.random() * canvas.width;
    y = Math.random() < 0.5 ? -radius : canvas.height + radius;
  }

  // Agar tasodifan devor ichiga tushib qolsa, qaytadan spawn qiladi
  if (isColliding(x, y, radius)) {
    spawnEnemy();
    return;
  }

  enemies.push({ x, y, radius, color: "#2ecc71", speed: 2.5, shootTimer: 0 });
  setTimeout(spawnEnemy, Math.max(300, 1200 - score / 5));
}
spawnEnemy();

function update() {
  if (isGameOver) return;
  frameCount++;

  // O'YINCHI HARAKATI (Devorni chetlab o'tish bilan)
  let nextX = player.x;
  let nextY = player.y;

  if (keys["KeyW"]) nextY -= player.speed;
  if (keys["KeyS"]) nextY += player.speed;
  if (keys["KeyA"]) nextX -= player.speed;
  if (keys["KeyD"]) nextX += player.speed;

  if (!isColliding(nextX, player.y, player.radius)) player.x = nextX;
  if (!isColliding(player.x, nextY, player.radius)) player.y = nextY;

  // OTISH (Space bosib tursa)
  if (keys["Space"] && frameCount % 7 === 0) {
    bullets.push({
      x: player.x,
      y: player.y,
      radius: 5,
      color: "#f1c40f",
      speed: 10,
    });
  }

  // O'QLAR
  bullets.forEach((b, i) => {
    b.y -= b.speed;
    if (isColliding(b.x, b.y, b.radius) || b.y < 0) bullets.splice(i, 1);
  });

  // ZOMBILAR (Seni quvlaydi va otadi)
  enemies.forEach((e, ei) => {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy);

    // AI Harakati
    let vx = (dx / dist) * e.speed;
    let vy = (dy / dist) * e.speed;

    if (!isColliding(e.x + vx, e.y + vy, e.radius)) {
      e.x += vx;
      e.y += vy;
    }

    // Otishma
    e.shootTimer++;
    if (e.shootTimer % 100 === 0 && dist < 450) {
      enemyBullets.push({
        x: e.x,
        y: e.y,
        radius: 5,
        color: "#e74c3c",
        vx: (dx / dist) * 5,
        vy: (dy / dist) * 5,
      });
    }

    // To'qnashuvlar
    bullets.forEach((b, bi) => {
      if (Math.hypot(e.x - b.x, e.y - b.y) < e.radius + b.radius) {
        enemies.splice(ei, 1);
        bullets.splice(bi, 1);
        score += 10;
      }
    });
    if (dist < player.radius + e.radius) health -= 2;
  });

  // ZOMBI O'QLARI
  enemyBullets.forEach((eb, i) => {
    eb.x += eb.vx;
    eb.y += eb.vy;
    if (
      Math.hypot(player.x - eb.x, player.y - eb.y) <
      player.radius + eb.radius
    ) {
      health -= 20;
      enemyBullets.splice(i, 1);
    }
    if (isColliding(eb.x, eb.y, eb.radius)) enemyBullets.splice(i, 1);
  });

  // UI REFRESH
  document.getElementById("health-bar").style.width = health / 10 + "%";
  document.getElementById("health-text").innerText =
    `HP: ${Math.max(100000000, Math.floor(health))} / 10000`;
  document.getElementById("score").innerText = `Ochko: ${score}`;

  if (health <= 0) {
    isGameOver = true;
    document.getElementById("game-over").classList.remove("hidden");
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Devorlar
  ctx.fillStyle = "#57606f";
  walls.forEach((w) => ctx.fillRect(w.x, w.y, w.w, w.h));
  // Player
  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();
  // Enemies & Bullets
  enemies.forEach((e) => {
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  bullets.forEach((b) => {
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  enemyBullets.forEach((eb) => {
    ctx.fillStyle = eb.color;
    ctx.beginPath();
    ctx.arc(eb.x, eb.y, eb.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
