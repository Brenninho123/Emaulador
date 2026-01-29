/* =========================
   EMAULADOR - CHIP-8
========================= */

const WIDTH = 64;
const HEIGHT = 32;
const SCALE = 10;

/* =========================
   CANVAS
========================= */
const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");

canvas.width = WIDTH * SCALE;
canvas.height = HEIGHT * SCALE;
ctx.scale(SCALE, SCALE);

/* =========================
   ESTADO DO CHIP-8
========================= */
let memory = new Uint8Array(4096);
let V = new Uint8Array(16);
let I = 0;
let pc = 0x200;

let gfx = new Uint8Array(WIDTH * HEIGHT);
let delayTimer = 0;
let soundTimer = 0;

let keys = new Uint8Array(16);

/* =========================
   FONTSET
========================= */
const fontset = [
0xF0,0x90,0x90,0x90,0xF0,
0x20,0x60,0x20,0x20,0x70,
0xF0,0x10,0xF0,0x80,0xF0,
0xF0,0x10,0xF0,0x10,0xF0,
0x90,0x90,0xF0,0x10,0x10,
0xF0,0x80,0xF0,0x10,0xF0,
0xF0,0x80,0xF0,0x90,0xF0,
0xF0,0x10,0x20,0x40,0x40,
0xF0,0x90,0xF0,0x90,0xF0,
0xF0,0x90,0xF0,0x10,0xF0
];

/* =========================
   RESET
========================= */
function reset() {
  memory.fill(0);
  V.fill(0);
  gfx.fill(0);
  keys.fill(0);

  pc = 0x200;
  I = 0;

  for (let i = 0; i < fontset.length; i++) {
    memory[i] = fontset[i];
  }

  draw();
}

/* =========================
   DESENHO
========================= */
function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  for (let i = 0; i < gfx.length; i++) {
    if (gfx[i]) {
      ctx.fillRect(i % WIDTH, (i / WIDTH) | 0, 1, 1);
    }
  }
}

/* =========================
   CICLO DA CPU
========================= */
function cycle() {
  let opcode = (memory[pc] << 8) | memory[pc + 1];
  pc += 2;

  let x = (opcode & 0x0F00) >> 8;
  let y = (opcode & 0x00F0) >> 4;

  switch (opcode & 0xF000) {

    case 0x0000:
      if (opcode === 0x00E0) {
        gfx.fill(0);
        draw();
      }
      break;

    case 0x1000:
      pc = opcode & 0x0FFF;
      break;

    case 0x6000:
      V[x] = opcode & 0x00FF;
      break;

    case 0x7000:
      V[x] = (V[x] + (opcode & 0x00FF)) & 0xFF;
      break;

    case 0xA000:
      I = opcode & 0x0FFF;
      break;

    case 0xD000: {
      let height = opcode & 0x000F;
      V[0xF] = 0;

      for (let row = 0; row < height; row++) {
        let sprite = memory[I + row];

        for (let col = 0; col < 8; col++) {
          if (sprite & (0x80 >> col)) {
            let px = (V[x] + col) % WIDTH;
            let py = (V[y] + row) % HEIGHT;
            let index = px + py * WIDTH;

            if (gfx[index] === 1) V[0xF] = 1;
            gfx[index] ^= 1;
          }
        }
      }
      draw();
      break;
    }
  }

  if (delayTimer > 0) delayTimer--;
  if (soundTimer > 0) soundTimer--;
}

/* =========================
   LOOP
========================= */
setInterval(cycle, 1000 / 60);

/* =========================
   LOAD ROM (BIN / CH8)
========================= */
function loadROM(arrayBuffer) {
  reset();

  const rom = new Uint8Array(arrayBuffer);

  if (rom.length > 3584) {
    alert("ROM grande demais para CHIP-8!");
    return;
  }

  for (let i = 0; i < rom.length; i++) {
    memory[0x200 + i] = rom[i];
  }

  console.log("ROM carregada:", rom.length, "bytes");
}

/* =========================
   TECLADO CHIP-8
========================= */
const keyMap = {
  "1":0x1,"2":0x2,"3":0x3,"4":0xC,
  "q":0x4,"w":0x5,"e":0x6,"r":0xD,
  "a":0x7,"s":0x8,"d":0x9,"f":0xE,
  "z":0xA,"x":0x0,"c":0xB,"v":0xF
};

window.addEventListener("keydown", e => {
  if (keyMap[e.key] !== undefined)
    keys[keyMap[e.key]] = 1;
});

window.addEventListener("keyup", e => {
  if (keyMap[e.key] !== undefined)
    keys[keyMap[e.key]] = 0;
});