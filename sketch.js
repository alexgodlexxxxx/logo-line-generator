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
                s.action(e.target.value);
                document.getElementById(s.id + '_val').textContent = e.target.value;
            };
        }
    });

    document.getElementById('genbtn').onclick = () => {
        initializeLines();
        updateLineDisplay();
    };
    
    document.getElementById('animCheck').onchange = (e) => {
        isAnimating = e.target.checked;
    };
    
    document.getElementById('lineInFrontToggle').onchange = (e) => {
        lines[activeLine].inFront = e.target.checked;
    };
}

function regenerateLine(lineIndex) {
    lines[lineIndex].color = random(palette);
    lines[lineIndex].offset = random(1000);
    lines[lineIndex].speed = random(0.02, 0.05) * (random() > 0.5 ? 1 : -1);
    updateLineDisplay();
}

function draw() {
    background(255);
    let t = isAnimating ? (frameCount * 0.02) : 0;

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            let x = i * cellW;
            let y = j * cellH;
            let cellIndex = i + j * cols;
            
            // Bordure de sélection
            if (cellIndex === selectedCell) {
                stroke('#007aff');
                strokeWeight(3);
            } else {
                stroke(240);
                strokeWeight(1);
            }
            noFill();
            rect(x, y, cellW, cellH);
            
            // Récupérer les lignes de cette case
            let currentCellLines = cellLines[cellIndex];
            
            // Lignes derrière le logo
            currentCellLines.forEach(lineIdx => {
                if (!lines[lineIdx].inFront) {
                    let pg = createGraphics(cellW, cellH);
                    drawLine(pg, cellW, cellH, lines[lineIdx], t);
                    image(pg, x, y);
                    pg.remove();
                }
            });
            
            // Logo
            if (logoImg) {
                let ratio = (logoImg.width > 1) ? logoImg.width / logoImg.height : 4.45;
                let wDraw = cellW * 0.4 * logoScale;
                let hDraw = wDraw / ratio;
                image(logoImg, x + (cellW - wDraw)/2, y + (cellH * 0.2), wDraw, hDraw);
            }
            
            // Lignes devant le logo
            currentCellLines.forEach(lineIdx => {
                if (lines[lineIdx].inFront) {
                    let pg = createGraphics(cellW, cellH);
                    drawLine(pg, cellW, cellH, lines[lineIdx], t);
                    image(pg, x, y);
                    pg.remove();
                }
            });
        }
    }
    
    // Gestion enregistrement GIF
    if (isRecording && capturer) {
        if (recordingFrames < maxRecordingFrames) {
            let tempCanvas = createGraphics(cellW, cellH);
            let col = recordingCell % cols;
            let row = floor(recordingCell / cols);
            tempCanvas.image(get(col * cellW, row * cellH, cellW, cellH), 0, 0);
            capturer.capture(tempCanvas.canvas);
            tempCanvas.remove();
            recordingFrames++;
        } else {
            capturer.stop();
            capturer.save();
            
            if (recordingCell < 3) {
                setTimeout(() => startCellRecording(recordingCell + 1), 500);
            } else {
                isRecording = false;
                const btn = document.getElementById('exportGifBtn');
                btn.disabled = false;
                btn.textContent = "Exporter 4 GIF";
                alert("✅ 4 GIF exportés !");
            }
        }
    }
}

function drawLine(pg, w, h, line, time) {
    pg.clear(); 
    pg.noFill(); 
    pg.stroke(line.color); 
    pg.strokeCap(ROUND); 
    pg.strokeJoin(ROUND);
    
    let startX = w * 0.15, endX = w * 0.85;
    let adjustedEndX = startX + (endX - startX) * line.length;
    
    pg.beginShape();
    for (let i = startX; i <= adjustedEndX; i += 3) {
        let n = i/w;
        let movingOffset = line.offset + (time * line.speed * 50); 
        let wave = (sin(n * line.freq * TWO_PI + movingOffset) * 0.6 + 
                    sin(n * line.freq * 0.5 * TWO_PI + movingOffset * 1.5) * 0.4);
        let y = h/2.5 + wave * 60;
        let th = map(Math.sin((i-startX)/(endX-startX)*Math.PI), 0, 1, 0.6, 1) * line.thickness;
        pg.strokeWeight(th);
        pg.curveVertex(i + line.hOffset, y + line.vOffset + h*0.3);
    }
    pg.endShape();
}

function handleCanvasClick() {
    let col = floor(mouseX / cellW);
    let row = floor(mouseY / cellH);
    
    if (col >= 0 && col < cols && row >= 0 && row < rows) {
        let cellIndex = col + row * cols;
        
        // Si simple clic sur une case différente
        if (cellIndex !== selectedCell) {
            selectedCell = cellIndex;
            
            // Ajouter une ligne si nécessaire
            if (cellIndex > 0 && cellLines[cellIndex].length <= cellIndex) {
                let newLineIndex = cellIndex;
                if (!cellLines[cellIndex].includes(newLineIndex)) {
                    cellLines[cellIndex].push(newLineIndex);
                }
            }
            
            // Basculer sur la dernière ligne de cette case
            let lastLineIdx = cellLines[cellIndex][cellLines[cellIndex].length - 1];
            activeLine = lastLineIdx;
            updateLineDisplay();
        }
        
        // Double-clic = export SVG
        if (event.detail === 2) {
            exportCellAsSVG(cellIndex);
        }
    }
}

function exportCellAsSVG(cellIndex) {
    let col = cellIndex % cols;
    let row = floor(cellIndex / cols);
    let currentCellLines = cellLines[cellIndex];
    
    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${cellW}" height="${cellH}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <rect x="0" y="0" width="${cellW}" height="${cellH}" fill="white"/>
`;

    // Lignes derrière
    currentCellLines.forEach(lineIdx => {
        if (!lines[lineIdx].inFront) {
            svgContent += generateLineSVG(cellW, cellH, lines[lineIdx]);
        }
    });
    
    // Logo
    if (logoImg && logoImg.canvas && logoImg.canvas.toDataURL) {
        let ratio = (logoImg.width > 1) ? logoImg.width / logoImg.height : 4.45;
        let wDraw = cellW * 0.4 * logoScale;
        let hDraw = wDraw / ratio;
        let imgX = (cellW - wDraw)/2;
        let imgY = cellH * 0.2;
        svgContent += `  <image x="${imgX}" y="${imgY}" width="${wDraw}" height="${hDraw}" xlink:href="${logoImg.canvas.toDataURL()}"/>\n`;
    }
    
    // Lignes devant
    currentCellLines.forEach(lineIdx => {
        if (lines[lineIdx].inFront) {
            svgContent += generateLineSVG(cellW, cellH, lines[lineIdx]);
        }
    });
    
    svgContent += `</svg>`;
    
    downloadSVG(svgContent, `case-${cellIndex + 1}.svg`);
}

function generateLineSVG(w, h, line) {
    let startX = w * 0.15, endX = w * 0.85;
    let adjustedEndX = startX + (endX - startX) * line.length;
    let points = [];
    
    for (let i = startX; i <= adjustedEndX; i += 3) {
        let n = i/w;
        let wave = (Math.sin(n * line.freq * TWO_PI + line.offset) * 0.6 + 
                    Math.sin(n * line.freq * 0.5 * TWO_PI + line.offset * 1.5) * 0.4);
        let y = h/2.5 + wave * 60 + line.vOffset + h*0.3;
        points.push(`${i + line.hOffset},${y}`);
    }
    
    let pathData = `M ${points.join(' L ')}`;
    return `  <path d="${pathData}" stroke="${line.color}" fill="none" stroke-width="${line.thickness}" stroke-linecap="round" stroke-linejoin="round"/>\n`;
}

function downloadSVG(content, filename) {
    let blob = new Blob([content], {type: 'image/svg+xml'});
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
