let seeds = [];
let cols = 2, rows = 2, cellW, cellH;
let palette = ["#D4B483", "#48A9A6", "#E88D67"];
let thickness = 10, verticalOffset = 0, horizontalOffset = 0, logoImg = null;
let waveFrequency = 3, lineLength = 1, logoScale = 1;
let isAnimating = false;
let canvasWidth, canvasHeight;
let extraLinesCount = 0;
let linesInFront = false;
let capturer = null;
let isRecording = false;
let recordingFrames = 0;
let maxRecordingFrames = 120; // 2 secondes à 60fps

function setup() {
    calculateCanvasSize();
    let cnv = createCanvas(canvasWidth, canvasHeight);
    cnv.parent('canvas-container');
    cnv.mousePressed(handleCanvasClick);
    frameRate(60);
    
    loadImage('logo.svg', (img) => { logoImg = img; }, () => { console.log("Logo absent"); });

    cellW = width / cols;
    cellH = height / rows;
    
    setupInterface();
    setupThemeToggle();
    setupLogoUpload();
    setupExtraLines();
    setupGifExport();
    regenerate();
}

function calculateCanvasSize() {
    let container = document.getElementById('canvas-container');
    let maxWidth = container.clientWidth - 40;
    let maxHeight = window.innerHeight - 100;
    
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
                    console.log("Nouveau logo chargé");
                });
            };
            reader.readAsDataURL(file);
        }
    };
}

function setupExtraLines() {
    const slider = document.getElementById('extraLinesSlider');
    const val = document.getElementById('extraLinesSlider_val');
    const toggle = document.getElementById('linesPositionToggle');
    
    if (slider) {
        slider.oninput = (e) => {
            extraLinesCount = parseInt(e.target.value);
            val.textContent = extraLinesCount;
            regenerate();
        };
    }
    
    if (toggle) {
        toggle.onchange = (e) => {
            linesInFront = e.target.checked;
        };
    }
}

function setupGifExport() {
    const btn = document.getElementById('exportGifBtn');
    if (btn) {
        btn.onclick = startGifRecording;
    }
}

function startGifRecording() {
    if (!isAnimating) {
        alert("⚠️ Active l'animation avant d'exporter un GIF !");
        return;
    }
    
    const btn = document.getElementById('exportGifBtn');
    btn.disabled = true;
    btn.textContent = "🎬 Enregistrement...";
    
    capturer = new CCapture({
        format: 'gif',
        workersPath: 'https://cdn.jsdelivr.net/npm/ccapture.js@1.1.0/src/',
        framerate: 60,
        quality: 90,
        name: 'logo-animation'
    });
    
    isRecording = true;
    recordingFrames = 0;
    capturer.start();
}

function setupInterface() {
    const sliders = [
        {id: 'vslider', action: (v) => verticalOffset = parseInt(v)},
        {id: 'hslider', action: (v) => horizontalOffset = parseInt(v)},
        {id: 'tslider', action: (v) => thickness = parseInt(v)},
        {id: 'wslider', action: (v) => { waveFrequency = parseFloat(v); regenerate(); }},
        {id: 'lslider', action: (v) => lineLength = parseFloat(v)},
        {id: 'logoslider', action: (v) => logoScale = parseFloat(v)}
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

    document.getElementById('genbtn').onclick = regenerate;
    document.getElementById('animCheck').onchange = (e) => {
        isAnimating = e.target.checked;
    };
}

function regenerate() {
    seeds = [];
    let totalLines = 1 + extraLinesCount;
    
    for (let i = 0; i < cols * rows; i++) {
        let cellSeeds = [];
        for (let j = 0; j < totalLines; j++) {
            cellSeeds.push({
                color: random(palette),
                freq: waveFrequency,
                offset: random(1000),
                dist: random(0.8, 1.2),
                amp: random(40, 90),
                speed: random(0.02, 0.05) * (random() > 0.5 ? 1 : -1)
            });
        }
        seeds.push(cellSeeds);
    }
}

function draw() {
    background(255);
    let t = isAnimating ? (frameCount * 0.02) : 0;

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            let x = i * cellW;
            let y = j * cellH;
            let idx = i + j * cols;
            
            stroke(245); strokeWeight(1); noFill();
            rect(x, y, cellW, cellH);
            
            if (!linesInFront && seeds[idx]) {
                let pg = createGraphics(cellW, cellH);
                seeds[idx].forEach(s => drawLine(pg, cellW, cellH, s, t));
                image(pg, x, y);
                pg.remove();
            }
            
            if (logoImg) {
                let ratio = (logoImg.width > 1) ? logoImg.width / logoImg.height : 4.45;
                let wDraw = cellW * 0.4 * logoScale;
                let hDraw = wDraw / ratio;
                image(logoImg, x + (cellW - wDraw)/2, y + (cellH * 0.2), wDraw, hDraw);
            }
            
            if (linesInFront && seeds[idx]) {
                let pg = createGraphics(cellW, cellH);
                seeds[idx].forEach(s => drawLine(pg, cellW, cellH, s, t));
                image(pg, x, y);
                pg.remove();
            }
        }
    }
    
    if (isRecording && capturer) {
        capturer.capture(document.querySelector('#canvas-container canvas'));
        recordingFrames++;
        
        if (recordingFrames >= maxRecordingFrames) {
            stopGifRecording();
        }
    }
}

function stopGifRecording() {
    isRecording = false;
    capturer.stop();
    capturer.save();
    
    const btn = document.getElementById('exportGifBtn');
    btn.disabled = false;
    btn.textContent = "📹 Exporter GIF (2s)";
    
    recordingFrames = 0;
    capturer = null;
}

function drawLine(pg, w, h, s, time) {
    pg.clear(); pg.noFill(); pg.stroke(s.color); pg.strokeCap(ROUND); pg.strokeJoin(ROUND);
    let startX = w * 0.15, endX = w * 0.85;
    let adjustedEndX = startX + (endX - startX) * lineLength;
    pg.beginShape();
    for (let i = startX; i <= adjustedEndX; i += 3) {
        let n = i/w;
        let movingOffset = s.offset + (time * s.speed * 50); 
        let wave = (sin(n * s.freq * TWO_PI + movingOffset) * 0.6 + sin(n * s.freq * 0.5 * TWO_PI + movingOffset * 1.5) * 0.4);
        let y = h/2.5 + wave * s.amp;
        let th = map(Math.sin((i-startX)/(endX-startX)*Math.PI), 0, 1, 0.6, 1) * thickness;
        pg.strokeWeight(th);
        pg.curveVertex(i + horizontalOffset, y + verticalOffset + h*0.3);
    }
    pg.endShape();
}

function handleCanvasClick() {
    let col = floor(mouseX / cellW);
    let row = floor(mouseY / cellH);
    
    if (col >= 0 && col < cols && row >= 0 && row < rows) {
        let idx = col + row * cols;
        exportCellAsSVG(col, row, idx);
    }
}

function exportCellAsSVG(col, row, idx) {
    let x = col * cellW;
    let y = row * cellH;
    
    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${cellW}" height="${cellH}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <rect x="0" y="0" width="${cellW}" height="${cellH}" fill="white"/>
`;

    if (!linesInFront && seeds[idx]) {
        seeds[idx].forEach(s => {
            svgContent += generateLineSVG(cellW, cellH, s, 0);
        });
    }
    
    if (logoImg && logoImg.canvas && logoImg.canvas.toDataURL) {
        let ratio = (logoImg.width > 1) ? logoImg.width / logoImg.height : 4.45;
        let wDraw = cellW * 0.4 * logoScale;
        let hDraw = wDraw / ratio;
        let imgX = (cellW - wDraw)/2;
        let imgY = cellH * 0.2;
        svgContent += `  <image x="${imgX}" y="${imgY}" width="${wDraw}" height="${hDraw}" xlink:href="${logoImg.canvas.toDataURL()}"/>\n`;
    }
    
    if (linesInFront && seeds[idx]) {
        seeds[idx].forEach(s => {
            svgContent += generateLineSVG(cellW, cellH, s, 0);
        });
    }
    
    svgContent += `</svg>`;
    
    downloadSVG(svgContent, `variation_${col}_${row}.svg`);
}

function generateLineSVG(w, h, s, time) {
    let startX = w * 0.15, endX = w * 0.85;
    let adjustedEndX = startX + (endX - startX) * lineLength;
    let points = [];
    
    for (let i = startX; i <= adjustedEndX; i += 3) {
        let n = i/w;
        let movingOffset = s.offset + (time * s.speed * 50);
        let wave = (Math.sin(n * s.freq * TWO_PI + movingOffset) * 0.6 + Math.sin(n * s.freq * 0.5 * TWO_PI + movingOffset * 1.5) * 0.4);
        let y = h/2.5 + wave * s.amp + verticalOffset + h*0.3;
        points.push(`${i + horizontalOffset},${y}`);
    }
    
    let pathData = `M ${points.join(' L ')}`;
    return `  <path d="${pathData}" stroke="${s.color}" fill="none" stroke-width="${thickness}" stroke-linecap="round" stroke-linejoin="round"/>\n`;
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
