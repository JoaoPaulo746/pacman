const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const TILE_SIZE = 28;

const map = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,1],
    [1,0,1,1,0,1,1,0,1,1,1,0,1,1,0,1,1,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,0,1,1,1,0,1,1,0,1,1,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// AJUSTE AUTOMÁTICO DO CANVAS
canvas.width = map[0].length * TILE_SIZE;
canvas.height = map.length * TILE_SIZE;

let score = 0;
let frightened = false; // Começa como falso
let frightenedTimer = 0;

let pacman = {
    x: 1, y: 1,
    dx: 0, dy: 0,
    nextDx: 0, nextDy: 0
};

class Ghost {
    constructor(x, y, color, type, releaseTime) {
        this.x = x; this.y = y;
        this.startX = x; this.startY = y;
        this.color = color;
        this.type = type;
        this.releaseTime = releaseTime;
        this.timer = 0;
        this.inBase = true;
    }

    move() {
        if (this.inBase) {
            if (++this.timer > this.releaseTime) this.inBase = false;
            return;
        }

        // IA Simples de perseguição
        let targetX = pacman.x;
        let targetY = pacman.y;

        // Se estiverem assustados, eles tentam ir para os cantos (fugir)
        if (frightened) {
            targetX = (this.type === "blinky") ? 0 : map[0].length;
            targetY = 0;
        }

        let dx = Math.sign(targetX - this.x);
        let dy = Math.sign(targetY - this.y);

        // Movimentação em grade (evitando paredes)
        if (dx !== 0 && map[this.y][this.x + dx] !== 1) {
            this.x += dx;
        } else if (dy !== 0 && map[this.y + dy][this.x] !== 1) {
            this.y += dy;
        }
    }

    draw() {
        // Azul se assustado, cor original se normal
        ctx.fillStyle = frightened ? "#2121ff" : this.color;
        ctx.beginPath();
        ctx.arc(this.x * TILE_SIZE + TILE_SIZE/2, this.y * TILE_SIZE + TILE_SIZE/2, 12, 0, Math.PI * 2);
        ctx.fill();
    }
}

const ghosts = [
    new Ghost(10, 3, "red", "blinky", 0),
    new Ghost(9, 3, "pink", "pinky", 40),
    new Ghost(8, 3, "cyan", "inky", 80)
];

function update() {
    // Tenta virar para a direção que o jogador pressionou (Buffer)
    if (map[pacman.y + pacman.nextDy][pacman.x + pacman.nextDx] !== 1) {
        pacman.dx = pacman.nextDx;
        pacman.dy = pacman.nextDy;
    }

    // Move se não houver parede na frente
    if (map[pacman.y + pacman.dy][pacman.x + pacman.dx] !== 1) {
        pacman.x += pacman.dx;
        pacman.y += pacman.dy;
    }

    // Lógica de comer itens
    const tileValue = map[pacman.y][pacman.x];
    if (tileValue === 0) { // Pastilha comum
        map[pacman.y][pacman.x] = 2;
        score += 10;
    } else if (tileValue === 3) { // Pastilha de poder
        map[pacman.y][pacman.x] = 2;
        score += 50;
        frightened = true;
        frightenedTimer = 50; // Duração do susto (em iterações)
    }

    if (frightened && --frightenedTimer <= 0) frightened = false;

    // Colisão com Fantasmas
    ghosts.forEach(g => {
        g.move();
        if (g.x === pacman.x && g.y === pacman.y) {
            if (frightened) {
                score += 200;
                g.x = g.startX; g.y = g.startY; g.inBase = true; g.timer = 0;
            } else {
                alert("Game Over! Pontuação: " + score);
                location.reload();
            }
        }
    });

    document.getElementById("score").innerText = score;
}

function draw() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            let px = x * TILE_SIZE;
            let py = y * TILE_SIZE;

            if (map[y][x] === 1) {
                ctx.fillStyle = "blue";
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            } else if (map[y][x] === 0) {
                ctx.fillStyle = "white";
                ctx.beginPath();
                ctx.arc(px + 14, py + 14, 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (map[y][x] === 3) {
                ctx.fillStyle = "white";
                ctx.beginPath();
                ctx.arc(px + 14, py + 14, 6, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Pac-man
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(pacman.x * TILE_SIZE + 14, pacman.y * TILE_SIZE + 14, 12, 0.2 * Math.PI, 1.8 * Math.PI);
    ctx.lineTo(pacman.x * TILE_SIZE + 14, pacman.y * TILE_SIZE + 14);
    ctx.fill();

    ghosts.forEach(g => g.draw());
}

// Loop em 150ms para uma velocidade jogável
setInterval(() => {
    update();
    draw();
}, 150);

document.addEventListener("keydown", e => {
    const moves = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1]
    };
    if (moves[e.key]) {
        [pacman.nextDx, pacman.nextDy] = moves[e.key];
    }
});
