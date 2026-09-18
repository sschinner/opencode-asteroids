'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.points      = POINTS[size];
    this.explodeCount = size * 5;
    this.dropsPowerUp = true;
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estrella fugaz ────────────────────────────────────────────────────────────
class EstrellaFugaz extends Asteroid {
  constructor() {
    const edge = randInt(0, 3);
    const pos  = rand(0, 1);
    let x, y;
    if (edge === 0)      { x = pos * W;       y = -24; }
    else if (edge === 1) { x = W + 24;        y = pos * H; }
    else if (edge === 2) { x = pos * W;       y = H + 24; }
    else                 { x = -24;           y = pos * H; }

    super(x, y, 0);
    this.radius = 10;
    this.points      = 0;
    this.explodeCount = 10;
    this.dropsPowerUp = false;

    const speed = rand(140, 200);
    const ang   = Math.atan2(H / 2 - y, W / 2 - x) + rand(-0.6, 0.6);
    this.vx = Math.cos(ang) * speed;
    this.vy = Math.sin(ang) * speed;
    this.rotSpeed = 0;
    this.rotVisible = Math.atan2(this.vy, this.vx) + Math.PI;
    this.ttl = rand(5, 8);
  }

  update(dt) {
    super.update(dt);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  split() { return []; }

  draw() {
    if (this.ttl < 2 && Math.floor(this.ttl * 6) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotVisible);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Estela: trazos que van perdiendo longitud hacia atrás
    ctx.globalAlpha = 0.35;
    for (let i = 1; i <= 4; i++) {
      const len = 10 * i;
      ctx.beginPath();
      ctx.moveTo(-8 - len, -3 * i / 2);
      ctx.lineTo(-8 - len - 8, -3 * i / 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Cuerpo: elipse alargada apuntando al sentido del movimiento
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 5, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}

// ── Skins de la nave ──────────────────────────────────────────────────────────
// Cada skin define la silueta (polígono en coordenadas locales), colores y
// la posición del cañón/escape. Las teclas 1-4 la cambian en plena partida.
const SKINS = [
  {
    id: 'clasica',
    name: 'CLÁSICA',
    points: [[20, 0], [-12, -9], [-7, 0], [-12, 9]],
    color:   '#fff',
    flame:   'rgba(255, 130, 0, 0.85)',
    trail:   'rgba(255, 255, 255, 0.55)',
    nose:    21,
    flameX:  -8,
  },
  {
    id: 'aguja',
    name: 'AGUJA',
    points: [[28, 0], [-8, -5], [-16, 0], [-8, 5]],
    color:   '#5cf',
    flame:   'rgba(92, 204, 255, 0.85)',
    trail:   'rgba(92, 204, 255, 0.5)',
    nose:    29,
    flameX:  -8,
  },
  {
    id: 'pesada',
    name: 'PESADA',
    points: [[14, 0], [-2, -13], [-14, -11], [-16, -6], [-16, 6], [-14, 11], [-2, 13]],
    color:   '#8f8',
    flame:   'rgba(140, 255, 140, 0.85)',
    trail:   'rgba(140, 255, 140, 0.5)',
    nose:    15,
    flameX:  -16,
  },
  {
    id: 'interceptor',
    name: 'INTERCEPTOR',
    points: [[22, 0], [-10, -11], [-16, -9], [-8, 0], [-16, 9], [-10, 11]],
    color:   '#f8f',
    flame:   'rgba(255, 140, 255, 0.85)',
    trail:   'rgba(255, 140, 255, 0.5)',
    nose:    23,
    flameX:  -8,
  },
];

let currentSkinIndex = Math.min(Number(localStorage.getItem('asteroids-skin')) || 0, SKINS.length - 1);

// Traza el polígono de la silueta (reutilizada por la nave y el HUD)
function traceShip(points, scale = 1) {
  ctx.beginPath();
  ctx.moveTo(points[0][0] * scale, points[0][1] * scale);
  for (let i = 1; i < points.length; i++)
    ctx.lineTo(points[i][0] * scale, points[i][1] * scale);
  ctx.closePath();
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedBoost    = 0;
    this.dead          = false;
  }

  get skin() { return SKINS[currentSkinIndex]; }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedBoost    > 0) this.speedBoost    -= dt;

    const ROT   = 3.5;   // rad/s
    const THRUST = 260 * (this.speedBoost > 0 ? 2 : 1);  // px/s²
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = this.skin.nose;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    const skin = this.skin;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = skin.color;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Silueta definida por la skin
    traceShip(skin.points);
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(skin.flameX, -4);
      ctx.lineTo(skin.flameX - rand(6, 14), 0);
      ctx.lineTo(skin.flameX,  4);
      ctx.strokeStyle = skin.flame;
      ctx.stroke();
    }

    // Estelas de velocidad (power-up "Velocidad")
    if (this.speedBoost > 0) {
      ctx.strokeStyle = skin.trail;
      for (let i = 0; i < 3; i++) {
        const yy = (i - 1) * 10;
        ctx.beginPath();
        ctx.moveTo(skin.flameX - 6, yy);
        ctx.lineTo(skin.flameX - 6 - rand(18, 46), yy);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Power-Up "Velocidad" ──────────────────────────────────────────────────────
const POWERUP_RADIUS       = 14;
const POWERUP_TTL          = 8;          // segundos antes de desvanecerse
const SPEED_DROP_CHANCE    = 0.15;
const SPEED_BOOST_DURATION = 5;          // segundos de efecto

class PowerUp {
  constructor(x, y) {
    this.x       = x;
    this.y       = y;
    this.radius  = POWERUP_RADIUS;
    this.rot     = rand(0, Math.PI * 2);
    this.rotSpeed = rand(-1, 1);
    this.ttl     = POWERUP_TTL;
    this.dead    = false;
  }

  update(dt) {
    this.rot += this.rotSpeed * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo cuando está por expirar
    if (this.ttl < 2 && Math.floor(this.ttl * 6) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Doble cheurón (»)
    for (let i = 0; i < 2; i++) {
      const s = i ? 6 : 0;   // desplazamiento del cheurón interior
      ctx.beginPath();
      ctx.moveTo( s - 5, 8);
      ctx.lineTo( s + 5, 0);
      ctx.lineTo( s - 5, -8);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.stroke();

    ctx.restore();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerups;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;
let meteorTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerups  = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  meteorTimer = rand(3, 6);
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerups  = [];
  ship.reset();
  meteorTimer = rand(3, 6);
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  // Cambio de skin en plena partida (teclas 1-4)
  for (let i = 0; i < SKINS.length; i++) {
    if (pressed(`Digit${i + 1}`)) {
      currentSkinIndex = i;
      localStorage.setItem('asteroids-skin', String(i));
    }
  }

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerups.forEach(p => p.update(dt));

  // Aparición aleatoria de Estrella fugaz
  meteorTimer -= dt;
  if (meteorTimer <= 0) {
    asteroids.push(new EstrellaFugaz());
    meteorTimer = rand(5, 9);
  }

  // Nave recoge power-up
  for (const p of powerups) {
    if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
      ship.speedBoost = SPEED_BOOST_DURATION;
      p.dead = true;
      explode(p.x, p.y, 8);
    }
  }

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerups  = powerups.filter(p => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += a.points;
        explode(a.x, a.y, a.explodeCount);
        // Drop de power-up "Velocidad" (solo si no hay uno activo)
        if (a.dropsPowerUp && !powerups.some(p => !p.dead) && Math.random() < SPEED_DROP_CHANCE)
          powerups.push(new PowerUp(a.x, a.y));
        newAsteroids.push(...a.split());
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs asteroide
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        killShip();
        break;
      }
    }
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  const skin = SKINS[currentSkinIndex];
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = skin.color;
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  traceShip(skin.points, 0.45);
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'left';
  ctx.fillStyle = SKINS[currentSkinIndex].color;
  ctx.fillText(`SKIN ${SKINS[currentSkinIndex].name}`, 14, 44);
  ctx.fillStyle = '#fff';

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  if (ship.speedBoost > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(`VELOCIDAD ${Math.ceil(ship.speedBoost)}`, W / 2, 48);
    ctx.fillStyle = '#fff';
  }

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText('1-4: SKIN', W - 14, H - 12);
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  powerups.forEach(p => p.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
