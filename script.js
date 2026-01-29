// script.js - Emaulador - Emulador Inspirado no Emanuel
// Main emulator script for loading and running .bin ROM files

// Emulator state and configuration
const emulatorState = {
    isRunning: false,
    isPaused: false,
    romLoaded: false,
    romData: null,
    romSize: 0,
    romName: '',
    
    // Emulation loop control
    emulationInterval: null,
    frameRate: 60, // Target FPS
    frameTime: 1000 / 60, // ms per frame
    
    // Canvas context for rendering
    canvas: null,
    ctx: null,
    
    // Placeholder for CPU state (to be implemented based on specific system)
    cpu: {
        // Generic CPU registers - adjust based on your target system
        pc: 0x0000,  // Program Counter
        sp: 0x0000,  // Stack Pointer
        a: 0x00,     // Accumulator
        x: 0x00,     // X register
        y: 0x00,     // Y register
        flags: 0x00, // Status flags
        
        // Memory (64KB typical for 8-bit systems)
        memory: new Uint8Array(65536),
        
        // Cycles executed
        cycles: 0
    },
    
    // Input state
    inputState: {
        up: false,
        down: false,
        left: false,
        right: false,
        a: false,
        b: false,
        start: false,
        select: false
    },
    
    // Screen buffer (virtual screen for rendering)
    screenBuffer: null,
    screenWidth: 256,
    screenHeight: 240,
    
    // Performance tracking
    fps: 0,
    frameCount: 0,
    lastFpsUpdate: 0
};

// DOM Elements
let romFileInput, gameCanvas, canvasPlaceholder;
let statusValue, romNameValue, romSizeValue;
let romInfo, romFileName, romFileSize;
let startBtn, pauseBtn, resetBtn, stopBtn;
let screenshotBtn, fullscreenBtn, themeToggle;

// Initialize the emulator when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    initializeCanvas();
    initializeEventListeners();
    updateStatus('Pronto para carregar ROM');
});

// Initialize DOM element references
function initializeElements() {
    romFileInput = document.getElementById('romFile');
    gameCanvas = document.getElementById('gameCanvas');
    canvasPlaceholder = document.getElementById('canvasPlaceholder');
    
    statusValue = document.getElementById('statusValue');
    romNameValue = document.getElementById('romNameValue');
    romSizeValue = document.getElementById('romSizeValue');
    
    romInfo = document.getElementById('romInfo');
    romFileName = document.getElementById('romFileName');
    romFileSize = document.getElementById('romFileSize');
    
    startBtn = document.getElementById('startBtn');
    pauseBtn = document.getElementById('pauseBtn');
    resetBtn = document.getElementById('resetBtn');
    stopBtn = document.getElementById('stopBtn');
    screenshotBtn = document.getElementById('screenshotBtn');
    fullscreenBtn = document.getElementById('fullscreenBtn');
    themeToggle = document.getElementById('themeToggle');
}

// Initialize canvas and graphics context
function initializeCanvas() {
    emulatorState.canvas = gameCanvas;
    emulatorState.ctx = gameCanvas.getContext('2d');
    
    // Initialize screen buffer
    emulatorState.screenBuffer = emulatorState.ctx.createImageData(
        emulatorState.screenWidth, 
        emulatorState.screenHeight
    );
    
    // Draw placeholder pattern on canvas
    drawPlaceholderScreen();
}

// Initialize event listeners
function initializeEventListeners() {
    // Keyboard input for game controls
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Drag and drop for ROM files
    const dropArea = document.querySelector('.file-upload-area');
    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('drop', handleFileDrop);
    
    // Window resize handling
    window.addEventListener('resize', handleResize);
    
    // Fullscreen change handling
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
}

// ====================
// ROM FILE MANAGEMENT
// ====================

// Load ROM file from file input
function loadROMFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check if it's a .bin file
    if (!file.name.toLowerCase().endsWith('.bin')) {
        alert('Por favor, selecione um arquivo .bin válido');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            processROMFile(file, e.target.result);
        } catch (error) {
            console.error('Erro ao processar ROM:', error);
            updateStatus('Erro ao carregar ROM');
            alert(`Erro ao carregar ROM: ${error.message}`);
        }
    };
    
    reader.onerror = function() {
        updateStatus('Erro ao ler arquivo');
        alert('Erro ao ler o arquivo. Por favor, tente novamente.');
    };
    
    reader.readAsArrayBuffer(file);
}

// Process the loaded ROM file
function processROMFile(file, arrayBuffer) {
    // Convert to Uint8Array for easier manipulation
    emulatorState.romData = new Uint8Array(arrayBuffer);
    emulatorState.romSize = emulatorState.romData.length;
    emulatorState.romName = file.name;
    emulatorState.romLoaded = true;
    
    // Update UI with ROM info
    updateROMInfo(file);
    
    // Initialize emulator with ROM data
    initializeEmulator();
    
    // Update controls
    startBtn.disabled = false;
    resetBtn.disabled = false;
    screenshotBtn.disabled = false;
    
    // Show canvas, hide placeholder
    gameCanvas.style.display = 'block';
    canvasPlaceholder.style.display = 'none';
    
    // Draw initial screen (ROM title or first frame)
    drawROMScreen();
    
    updateStatus('ROM carregada com sucesso');
    console.log(`ROM carregada: ${file.name} (${emulatorState.romSize} bytes)`);
}

// Handle file drop from drag and drop
function handleFileDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const dropArea = event.currentTarget;
    dropArea.style.borderColor = '#4361ee';
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        
        // Create a fake event to reuse loadROMFile function
        const fakeEvent = {
            target: {
                files: [file]
            }
        };
        
        loadROMFile(fakeEvent);
    }
}

// Handle drag over for drop area
function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const dropArea = event.currentTarget;
    dropArea.style.borderColor = '#4cc9f0';
    dropArea.style.background = 'rgba(67, 97, 238, 0.15)';
}

// Update ROM info in the UI
function updateROMInfo(file) {
    const fileSizeKB = (file.size / 1024).toFixed(2);
    
    romFileName.textContent = file.name;
    romFileSize.textContent = `${fileSizeKB} KB`;
    
    romNameValue.textContent = file.name;
    romSizeValue.textContent = `${fileSizeKB} KB`;
    
    romInfo.classList.add('show');
}

// ====================
// EMULATOR CORE
// ====================

// Initialize emulator with loaded ROM
function initializeEmulator() {
    if (!emulatorState.romLoaded || !emulatorState.romData) {
        console.error('Nenhuma ROM carregada para inicializar');
        return;
    }
    
    // Reset CPU state
    resetCPU();
    
    // Load ROM into memory starting at address 0x8000 (common for many systems)
    // Adjust this based on your target system's memory map
    const loadAddress = 0x8000;
    
    // Check if ROM fits in memory
    if (loadAddress + emulatorState.romSize > emulatorState.cpu.memory.length) {
        console.warn('ROM muito grande para a memória disponível');
    }
    
    // Copy ROM data to emulator memory
    for (let i = 0; i < emulatorState.romSize; i++) {
        if (loadAddress + i < emulatorState.cpu.memory.length) {
            emulatorState.cpu.memory[loadAddress + i] = emulatorState.romData[i];
        }
    }
    
    // Set program counter to start of ROM
    emulatorState.cpu.pc = loadAddress;
    
    console.log(`ROM carregada na memória em 0x${loadAddress.toString(16).toUpperCase()}`);
    console.log(`Tamanho da ROM: ${emulatorState.romSize} bytes`);
}

// Reset CPU to initial state
function resetCPU() {
    emulatorState.cpu.pc = 0x0000;
    emulatorState.cpu.sp = 0x0000;
    emulatorState.cpu.a = 0x00;
    emulatorState.cpu.x = 0x00;
    emulatorState.cpu.y = 0x00;
    emulatorState.cpu.flags = 0x00;
    emulatorState.cpu.cycles = 0;
    
    // Clear memory
    emulatorState.cpu.memory.fill(0);
    
    console.log('CPU reinicializada');
}

// Execute one CPU cycle
function executeCycle() {
    if (!emulatorState.isRunning || emulatorState.isPaused) return;
    
    // This is a placeholder - you need to implement actual CPU emulation
    // based on the instruction set of your target system
    
    try {
        // Fetch instruction from memory
        const instruction = emulatorState.cpu.memory[emulatorState.cpu.pc];
        
        // Simple placeholder: increment PC and do nothing
        // Replace this with actual instruction decoding and execution
        emulatorState.cpu.pc = (emulatorState.cpu.pc + 1) % 65536;
        emulatorState.cpu.cycles++;
        
        // Every 1000 cycles, update something (placeholder)
        if (emulatorState.cpu.cycles % 1000 === 0) {
            // Update screen buffer or perform other periodic tasks
        }
        
    } catch (error) {
        console.error('Erro durante execução do ciclo:', error);
        stopEmulation();
        updateStatus('Erro de execução');
    }
}

// Emulation main loop
function emulationLoop() {
    if (!emulatorState.isRunning || emulatorState.isPaused) return;
    
    // Execute CPU cycles for one frame
    const cyclesPerFrame = 29780; // NTSC NES example, adjust for your system
    for (let i = 0; i < cyclesPerFrame; i++) {
        executeCycle();
    }
    
    // Update graphics
    updateScreen();
    
    // Update performance counters
    updatePerformance();
}

// Update screen with current frame
function updateScreen() {
    // This is a placeholder - implement actual graphics rendering
    // based on your target system's video hardware
    
    // For now, just draw a simple pattern
    drawSimplePattern();
    
    // Draw input state indicators (for debugging)
    drawInputIndicators();
}

// ====================
// EMULATOR CONTROLS
// ====================

// Start emulation
function startEmulation() {
    if (!emulatorState.romLoaded) {
        alert('Por favor, carregue uma ROM primeiro');
        return;
    }
    
    if (emulatorState.isRunning && !emulatorState.isPaused) {
        console.log('Emulação já em execução');
        return;
    }
    
    emulatorState.isRunning = true;
    emulatorState.isPaused = false;
    
    // Start emulation loop
    if (!emulatorState.emulationInterval) {
        emulatorState.emulationInterval = setInterval(
            emulationLoop, 
            emulatorState.frameTime
        );
    }
    
    // Update UI
    updateStatus('Emulação em execução');
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pausar';
    stopBtn.disabled = false;
    
    console.log('Emulação iniciada');
}

// Pause/resume emulation
function pauseEmulation() {
    if (!emulatorState.isRunning) return;
    
    emulatorState.isPaused = !emulatorState.isPaused;
    
    if (emulatorState.isPaused) {
        updateStatus('Emulação pausada');
        pauseBtn.innerHTML = '<i class="fas fa-play"></i> Continuar';
        console.log('Emulação pausada');
    } else {
        updateStatus('Emulação em execução');
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pausar';
        console.log('Emulação continuada');
    }
}

// Reset emulation
function resetEmulation() {
    if (!emulatorState.romLoaded) return;
    
    // Stop current emulation
    if (emulatorState.isRunning) {
        clearInterval(emulatorState.emulationInterval);
        emulatorState.emulationInterval = null;
        emulatorState.isRunning = false;
        emulatorState.isPaused = false;
    }
    
    // Reinitialize emulator
    initializeEmulator();
    
    // Redraw screen
    drawROMScreen();
    
    // Update UI
    updateStatus('Emulador reiniciado');
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
    
    console.log('Emulação reiniciada');
}

// Stop emulation
function stopEmulation() {
    emulatorState.isRunning = false;
    emulatorState.isPaused = false;
    
    // Stop emulation loop
    if (emulatorState.emulationInterval) {
        clearInterval(emulatorState.emulationInterval);
        emulatorState.emulationInterval = null;
    }
    
    // Update UI
    updateStatus('Emulação parada');
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
    
    console.log('Emulação parada');
}

// ====================
// GRAPHICS & RENDERING
// ====================

// Draw placeholder screen (when no ROM is loaded)
function drawPlaceholderScreen() {
    const ctx = emulatorState.ctx;
    const width = emulatorState.canvas.width;
    const height = emulatorState.canvas.height;
    
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid pattern
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x < width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y < height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    // Draw Emaulador text
    ctx.fillStyle = '#4cc9f0';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EMAULADOR', width / 2, height / 2 - 40);
    
    ctx.fillStyle = '#888888';
    ctx.font = '24px monospace';
    ctx.fillText('Carregue uma ROM .bin para começar', width / 2, height / 2 + 30);
}

// Draw ROM screen (initial display after loading)
function drawROMScreen() {
    const ctx = emulatorState.ctx;
    const width = emulatorState.canvas.width;
    const height = emulatorState.canvas.height;
    
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    
    // Draw ROM info
    ctx.fillStyle = '#4cc9f0';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ROM CARREGADA', width / 2, height / 2 - 60);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px monospace';
    ctx.fillText(emulatorState.romName, width / 2, height / 2 - 10);
    
    ctx.fillStyle = '#888888';
    ctx.font = '18px monospace';
    ctx.fillText(`${emulatorState.romSize} bytes`, width / 2, height / 2 + 30);
    
    ctx.fillStyle = '#4361ee';
    ctx.font = '20px monospace';
    ctx.fillText('Pressione "Iniciar" para começar a emulação', width / 2, height / 2 + 80);
}

// Draw simple pattern (placeholder for actual graphics)
function drawSimplePattern() {
    const ctx = emulatorState.ctx;
    const width = emulatorState.canvas.width;
    const height = emulatorState.canvas.height;
    
    // Clear with black
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    
    // Draw moving pattern based on CPU cycles
    const time = Date.now() / 1000;
    const cycle = emulatorState.cpu.cycles;
    
    // Draw some animated elements
    for (let i = 0; i < 50; i++) {
        const x = (Math.sin(time + i * 0.2) * 0.5 + 0.5) * width;
        const y = (Math.cos(time * 0.7 + i * 0.1) * 0.5 + 0.5) * height;
        const size = 10 + Math.sin(time * 2 + i) * 5;
        
        // Color based on input state
        let color;
        if (emulatorState.inputState.a) color = '#f72585';
        else if (emulatorState.inputState.b) color = '#4cc9f0';
        else if (emulatorState.inputState.start) color = '#7209b7';
        else color = '#4361ee';
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw CPU state info
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    const infoLines = [
        `PC: 0x${emulatorState.cpu.pc.toString(16).padStart(4, '0').toUpperCase()}`,
        `A: 0x${emulatorState.cpu.a.toString(16).padStart(2, '0').toUpperCase()}`,
        `X: 0x${emulatorState.cpu.x.toString(16).padStart(2, '0').toUpperCase()}`,
        `Y: 0x${emulatorState.cpu.y.toString(16).padStart(2, '0').toUpperCase()}`,
        `Ciclos: ${emulatorState.cpu.cycles}`,
        `FPS: ${emulatorState.fps}`
    ];
    
    infoLines.forEach((line, index) => {
        ctx.fillText(line, 10, 10 + index * 20);
    });
}

// Draw input state indicators (for debugging)
function drawInputIndicators() {
    const ctx = emulatorState.ctx;
    const width = emulatorState.canvas.width;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(width - 120, 10, 110, 100);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    
    const inputs = [
        { key: '↑', state: emulatorState.inputState.up },
        { key: '↓', state: emulatorState.inputState.down },
        { key: '←', state: emulatorState.inputState.left },
        { key: '→', state: emulatorState.inputState.right },
        { key: 'A (Z)', state: emulatorState.inputState.a },
        { key: 'B (X)', state: emulatorState.inputState.b },
        { key: 'START', state: emulatorState.inputState.start },
        { key: 'SELECT', state: emulatorState.inputState.select }
    ];
    
    inputs.forEach((input, index) => {
        ctx.fillStyle = input.state ? '#4cc9f0' : '#888888';
        ctx.fillText(input.key, width - 110, 25 + index * 12);
    });
}

// ====================
// INPUT HANDLING
// ====================

// Handle key down events
function handleKeyDown(event) {
    switch (event.key.toLowerCase()) {
        case 'arrowup':
            emulatorState.inputState.up = true;
            break;
        case 'arrowdown':
            emulatorState.inputState.down = true;
            break;
        case 'arrowleft':
            emulatorState.inputState.left = true;
            break;
        case 'arrowright':
            emulatorState.inputState.right = true;
            break;
        case 'z':
            emulatorState.inputState.a = true;
            break;
        case 'x':
            emulatorState.inputState.b = true;
            break;
        case 'enter':
            emulatorState.inputState.start = true;
            break;
        case ' ':
            emulatorState.inputState.select = true;
            break;
        case 'p':
            // Toggle pause with P key
            if (emulatorState.isRunning) {
                pauseEmulation();
            }
            break;
    }
}

// Handle key up events
function handleKeyUp(event) {
    switch (event.key.toLowerCase()) {
        case 'arrowup':
            emulatorState.inputState.up = false;
            break;
        case 'arrowdown':
            emulatorState.inputState.down = false;
            break;
        case 'arrowleft':
            emulatorState.inputState.left = false;
            break;
        case 'arrowright':
            emulatorState.inputState.right = false;
            break;
        case 'z':
            emulatorState.inputState.a = false;
            break;
        case 'x':
            emulatorState.inputState.b = false;
            break;
        case 'enter':
            emulatorState.inputState.start = false;
            break;
        case ' ':
            emulatorState.inputState.select = false;
            break;
    }
}

// ====================
// UI FUNCTIONS
// ====================

// Update status display
function updateStatus(message) {
    statusValue.textContent = message;
}

// Update performance counters
function updatePerformance() {
    emulatorState.frameCount++;
    const now = Date.now();
    
    // Update FPS every second
    if (now - emulatorState.lastFpsUpdate >= 1000) {
        emulatorState.fps = emulatorState.frameCount;
        emulatorState.frameCount = 0;
        emulatorState.lastFpsUpdate = now;
    }
}

// Toggle fullscreen mode
function toggleFullscreen() {
    if (!document.fullscreenElement && 
        !document.webkitFullscreenElement && 
        !document.mozFullScreenElement && 
        !document.msFullscreenElement) {
        // Enter fullscreen
        const container = document.querySelector('.container');
        if (container.requestFullscreen) {
            container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
            container.webkitRequestFullscreen();
        } else if (container.mozRequestFullScreen) {
            container.mozRequestFullScreen();
        } else if (container.msRequestFullscreen) {
            container.msRequestFullscreen();
        }
        fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i> Sair da Tela Cheia';
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i> Tela Cheia';
    }
}

// Handle fullscreen change
function handleFullscreenChange() {
    if (!document.fullscreenElement && 
        !document.webkitFullscreenElement && 
        !document.mozFullScreenElement && 
        !document.msFullscreenElement) {
        fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i> Tela Cheia';
    }
}

// Take screenshot of current canvas
function takeScreenshot() {
    if (!emulatorState.romLoaded) return;
    
    const canvas = emulatorState.canvas;
    const link = document.createElement('a');
    
    link.download = `emaulador_screenshot_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    console.log('Captura de tela salva');
}

// Toggle theme (light/dark mode)
function toggleTheme() {
    const body = document.body;
    const isLightMode = body.classList.contains('light-mode');
    const themeIcon = themeToggle.querySelector('i');
    
    if (isLightMode) {
        body.classList.remove('light-mode');
        themeIcon.className = 'fas fa-moon';
        console.log('Tema alterado para escuro');
    } else {
        body.classList.add('light-mode');
        themeIcon.className = 'fas fa-sun';
        console.log('Tema alterado para claro');
    }
}

// Handle window resize
function handleResize() {
    // You can add responsive canvas scaling here if needed
    console.log('Janela redimensionada');
}

// ====================
// UTILITY FUNCTIONS
// ====================

// Format bytes to human readable format
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Hex string helper
function toHex(value, digits = 2) {
    return value.toString(16).padStart(digits, '0').toUpperCase();
}

// Export functions for use in HTML (if needed)
window.loadROMFile = loadROMFile;
window.startEmulation = startEmulation;
window.pauseEmulation = pauseEmulation;
window.resetEmulation = resetEmulation;
window.stopEmulation = stopEmulation;
window.toggleFullscreen = toggleFullscreen;
window.takeScreenshot = takeScreenshot;
window.toggleTheme = toggleTheme;

console.log('Script.js do Emaulador carregado e pronto!');