const WIDTH = 64;
const HEIGHT = 32;
const SCALE = 10;

/* CANVAS */
const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");

canvas.width = WIDTH * SCALE;
canvas.height = HEIGHT * SCALE;
ctx.scale(SCALE, SCALE);

/* CHIP-8 STATE */
let memory = new Uint8Array(4096);
let V = new Uint8Array(16);
let gfx = new Uint8Array(WIDTH * HEIGHT);
let keys = new Uint8Array(16);

let I = 0;
let pc = 0x200;
let delayTimer = 0;

/* FONTSET */
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

/* RESET */
function reset() {
  memory.fill(0);
  V.fill(0);
  gfx.fill(0);
  keys.fill(0);
  pc = 0x200;
  I = 0;

  for (let i = 0; i < fontset.length; i++)
    memory[i] = fontset[i];

  draw();
}

/* DRAW */
function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  for (let i = 0; i < gfx.length; i++) {
    if (gfx[i])
      ctx.fillRect(i % WIDTH, (i / WIDTH) | 0, 1, 1);
  }
}

/* CPU */
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
      V[x] = opcode & 0xFF;
      break;

    case 0x7000:
      V[x] = (V[x] + (opcode & 0xFF)) & 0xFF;
      break;

    case 0xA000:
      I = opcode & 0x0FFF;
      break;

    case 0xD000:
      let h = opcode & 0x000F;
      V[0xF] = 0;

      for (let r = 0; r < h; r++) {
        let sprite = memory[I + r];
        for (let c = 0; c < 8; c++) {
          if (sprite & (0x80 >> c)) {
            let px = (V[x] + c) % WIDTH;
            let py = (V[y] + r) % HEIGHT;
            let idx = px + py * WIDTH;

            if (gfx[idx]) V[0xF] = 1;
            gfx[idx] ^= 1;
          }
        }
      }
      draw();
      break;
  }

  if (delayTimer > 0) delayTimer--;
}

setInterval(cycle, 1000 / 60);

/* LOAD ROM */
function loadROM(buffer) {
  reset();
  const rom = new Uint8Array(buffer);
  if (rom.length > 3584) {
    alert("ROM grande demais");
    return;
  }
  for (let i = 0; i < rom.length; i++)
    memory[0x200 + i] = rom[i];
}

/* TECLADO FÍSICO */
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