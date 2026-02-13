let cols = 2, rows = 2, cellW, cellH;
let palette = ["#D4B483", "#48A9A6", "#E88D67"];
let logoImg = null;
let isAnimating = false;
let canvasWidth, canvasHeight;

// Structure des lignes
let lines = [];

// Structure des cases : chaque case a une liste d'indices de lignes
let cellLines = [
    [0], // Case 1 : Ligne 1 uniquement
    [0], // Case 2 : Ligne 1 au départ
    [0], // Case 3 : Ligne 1 au départ
    [0]  // Case 4 : Ligne 1 au départ
];

let logoScale = 1;
let selectedCell = 0;
let activeLine = 0;
let capturer = null;
let isRecording = false;
let recordingCell = 0;
let recordingFrames = 0;
let maxRecordingFrames = 120;

function setup() {
    calculateCanvasSize();
    let cnv = createCanvas(canvasWidth, canvasHeight);
    cnv.parent('canvas-container');
    cnv.mousePressed(handleCanvasClick);
    frameRate(60);
    
    loadImage('logo.svg', (img) => { logoImg = img; }, () => { console.log("Logo absent"); });

    cellW = width / cols;
    cellH = height / rows;
    
    initializeLines();
    setupInterface();
    setupThemeToggle();
    setupLogoUpload();
    setupGifExport();
    updateLineDisplay();
}

function calculateCanvasSize() {
    let container = document.getElementById('canvas-container');
    let maxWidth = container.clientWidth - 48;
    let maxHeight = window.innerHeight - 120;
    
    let ratio = 5 / 4;
    
    if (window.innerWidth < 768) {
        canvasWidth = Math.min(maxWidth, 600);
        canvasHeight = canvasWidth / ratio;
    } else {
        canvasWidth = Math.min(maxWidth, 1000);
        canvasHeight = canvasWidth / ratio;
    }
}

function windowResized() {
    calculateCanvasSize();
    resizeCanvas(canvasWidth, canvasHeight);
    cellW = width / cols;
    cellH = height / rows;
}

function initializeLines() {
    lines = [];
    // Créer 4 lignes au démarrage
    for (let i = 0; i < 4; i++) {
        lines.push(createNewLine());
    }
}

function createNewLine() {
    return {
        vOffset: 0,
        hOffset: 0,
        thickness: 10,
        freq: 3,
        length: 1,
        inFront: false,
        color: random(palette),
        offset: random(1000),
        speed: random(0.02, 0.05) * (random() > 0.5 ? 1 : -1)
    };
}

function setupThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    const icon = document.getElementById('themeIcon');
    const html = document.documentElement;
    
    const savedTheme = localStorage.getItem('theme') || 'dark';
    html.setAttribute('data-theme', savedTheme);
    icon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    
    toggle.onclick = () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', newTheme);
        icon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        localStorage.setItem('theme', newTheme);
    };
}

function setupLogoUpload() {
    const upload = document.getElementById('logoUpload');
    upload.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                loadImage(event.target.result, (img) => {
                    logoImg = img;
                });
            };
            reader.readAsDataURL(file);
        }
    };
}

function updateLineDisplay() {
    const line = lines[activeLine];
    
    // Mettre à jour le titre et la couleur
    document.getElementById('lineSettingsTitle').textContent = `Ligne ${activeLine + 1}`;
    document.getElementById('lineColorDot').style.backgroundColor = line.color;
    
    // Charger les valeurs
    loadLineSettings();
}

function loadLineSettings() {
    const line = lines[activeLine];
    document.getElementById('vslider').value = line.vOffset;
    document.getElementById('vslider_val').textContent = line.vOffset;
    document.getElementById('hslider').value = line.hOffset;
    document.getElementById('hslider_val').textContent = line.hOffset;
    document.getElementById('tslider').value = line.thickness;
    document.getElementById('tslider_val').textContent = line.thickness;
    document.getElementById('wslider').value = line.freq;
    document.getElementById('wslider_val').textContent = line.freq;
    document.getElementById('lslider').value = line.length;
    document.getElementById('lslider_val').textContent = line.length;
    document.getElementById('lineInFrontToggle').checked = line.inFront;
}

function setupGifExport() {
    const btn = document.getElementById('exportGifBtn');
    if (btn) {
        btn.onclick = startAllGifRecording;
    }
}

function startAllGifRecording() {
    if (!isAnimating) {
        alert("⚠️ Active l'animation avant d'exporter les GIF !");
        return;
    }
    
    alert("⏳ Enregistrement des 4 animations en cours... (8 secondes)");
    
    const btn = document.getElementById('exportGifBtn');
    btn.disabled = true;
    btn.textContent = "Enregistrement...";
    
    isRecording = true;
    recordingCell = 0;
    recordingFrames = 0;
    
    startCellRecording(0);
}

function startCellRecording(cellIndex) {
    capturer = new CCapture({
        format: 'gif',
        workersPath: 'https://cdn.jsdelivr.net/npm/ccapture.js@1.1.0/src/',
        framerate: 60,
        quality: 90,
        name: `case-${cellIndex + 1}`
    });
    
    recordingCell = cellIndex;
    recordingFrames = 0;
    capturer.start();
}

function setupInterface() {
    const sliders = [
        {id: 'vslider', action: (v) => { lines[activeLine].vOffset = parseInt(v); }},
        {id: 'hslider', action: (v) => { lines[activeLine].hOffset = parseInt(v); }},
        {id: 'tslider', action: (v) => { lines[activeLine].thickness = parseInt(v); }},
        {id: 'wslider', action: (v) => { lines[activeLine].freq = parseFloat(v); regenerateLine(activeLine); }},
        {id: 'lslider', action: (v) => { lines[activeLine].length = parseFloat(v); }},
        {id: 'logoslider', action: (v) => { logoScale = parseFloat(v); }}
    ];

    sliders.forEach(s => {
        let slider = document.getElementById(s.id);
        if(slider) {
            slider.oninput = (e) => {
                s.actio
