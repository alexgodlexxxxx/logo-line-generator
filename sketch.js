let seeds = [];
let cols = 2, rows = 2, cellW, cellH;
let palette = ["#D4B483", "#48A9A6", "#E88D67"];
let thickness = 10, verticalOffset = 0, horizontalOffset = 0, logoImg = null;
let waveFrequency = 3, lineLength = 1, logoScale = 1;
let isAnimating = false;
let canvasWidth, canvasHeight;

function setup() {
    // Canvas responsive
    calculateCanvasSize();
    let cnv = createCanvas(canvasWidth, canvasHeight);
    cnv.parent('canvas-container');
    
    loadImage('logo.svg', (img) => { logoImg = img; }, () => { console.log("Logo absent"); });

    cellW = width / cols;
    cellH = height / rows;
    
    setupInterface();
    setupThemeToggle();
    setupLogoUpload();
    regenerate();
}

function calculateCanvasSize() {
    let container = document.getElementById('canvas-container');
    let maxWidth = container.clientWidth - 40;
    let maxHeight = window.innerHeight - 100;
    
    // Ratio 5:4
    let ratio = 5 / 4;
    
    if (window.innerWidth < 768) {
        // Mobile: canvas plus petit
        canvasWidth = Math.min(maxWidth, 600);
        canvasHeight = canvasWidth / ratio;
    } else {
        // Desktop
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
    
    // Charger le thème sauvegardé
    const savedTheme = localStorage.getItem('theme') || 'light';
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
    for (let i = 0; i < cols * rows; i++) {
        seeds.push({
            color: random(palette),
            freq: waveFrequency,
            offset: random(1000),
            dist: random(0.8, 1.2),
            amp: random(40, 90),
            speed: random(0.02, 0.05) * (random() > 0.5 ? 1 : -1)
        });
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
            
            if (seeds[idx]) {
                let pg = createGraphics(cellW, cellH);
                drawLine(pg, cellW, cellH, seeds[idx], t);
                image(pg, x, y);
                pg.remove(); 
            }
            
            if (logoImg) {
                let ratio = (logoImg.width > 1) ? logoImg.width / logoImg.height : 4.45;
                let wDraw = cellW * 0.4 * logoScale;
                let hDraw = wDraw / ratio;
                image(logoImg, x + (cellW - wDraw)/2, y + (cellH * 0.2), wDraw, hDraw);
            }
        }
    }
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
