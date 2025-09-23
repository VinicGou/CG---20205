// ===== INÍCIO DA CONFIGURAÇÃO DO WEBGL =====

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    alert('WebGL não é suportado ou está desabilitado. Tente usar um navegador diferente.');
}

const vsSource = `
    attribute vec4 aVertexPosition;
    uniform vec2 uResolution;

    void main() {
        // Converte a posição de pixels para clip space (-1 a 1)
        vec2 zeroToOne = aVertexPosition.xy / uResolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;
        // Inverte o eixo Y pois o WebGL tem origem no canto inferior esquerdo
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    }
`;

const fsSource = `
    precision mediump float;
    uniform vec4 uColor;

    void main() {
        gl_FragColor = uColor;
    }
`;

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Erro ao compilar shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

const shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);
gl.linkProgram(shaderProgram);

if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error('Erro ao inicializar o shader program:', gl.getProgramInfoLog(shaderProgram));
}

gl.useProgram(shaderProgram);

const programInfo = {
    program: shaderProgram,
    attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
    },
    uniformLocations: {
        resolution: gl.getUniformLocation(shaderProgram, 'uResolution'),
        color: gl.getUniformLocation(shaderProgram, 'uColor'),
    },
};

gl.uniform2f(programInfo.uniformLocations.resolution, gl.canvas.width, gl.canvas.height);

const positionBuffer = gl.createBuffer();


let currentMode = 'r'; // 'r' = reta, 't' = triangulo, 'k' = cor, 'e' = espessura
let clicks = [];
let currentColor = [0.0, 0.0, 1.0, 1.0]; // Azul inicial
let currentThickness = 1;

// Cores indexadas de 0 a 9
const indexedColors = [
    [1.0, 0.0, 0.0, 1.0], // 0: Vermelho
    [0.0, 1.0, 0.0, 1.0], // 1: Verde
    [0.0, 0.0, 1.0, 1.0], // 2: Azul
    [1.0, 1.0, 0.0, 1.0], // 3: Amarelo
    [1.0, 0.0, 1.0, 1.0], // 4: Magenta
    [0.0, 1.0, 1.0, 1.0], // 5: Ciano
    [0.0, 0.0, 0.0, 1.0], // 6: Preto
    [1.0, 1.0, 1.0, 1.0], // 7: Branco (pode não aparecer bem no fundo branco)
    [1.0, 0.5, 0.0, 1.0], // 8: Laranja
    [0.5, 0.0, 1.0, 1.0], // 9: Roxo
];

const modeSpan = document.getElementById('current-mode');



/**
 * Algoritmo de Bresenham para gerar os pontos de uma linha.
 * @returns {Array<{x: number, y: number}>} Uma lista de pontos.
 */
function bresenham(x1, y1, x2, y2) {
    const points = [];
    let dx = Math.abs(x2 - x1);
    let dy = Math.abs(y2 - y1);
    let sx = (x1 < x2) ? 1 : -1;
    let sy = (y1 < y2) ? 1 : -1;
    let err = dx - dy;

    while (true) {
        points.push({ x: x1, y: y1 });
        if (x1 === x2 && y1 === y2) break;
        let e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x1 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y1 += sy;
        }
    }
    return points;
}

function drawThickLine(p1, p2, color, thickness) {
    const bresenhamPoints = bresenham(p1.x, p1.y, p2.x, p2.y);
    let vertices = [];

    const halfThick = Math.floor(thickness / 2);

    bresenhamPoints.forEach(p => {
        const x1 = p.x - halfThick;
        const y1 = p.y - halfThick;
        const x2 = p.x + halfThick + (thickness % 2); 
        const y2 = p.y + halfThick + (thickness % 2);

        vertices.push(x1, y1, x2, y1, x1, y2);
        vertices.push(x1, y2, x2, y1, x2, y2); 
    });
    
    draw(vertices, color);
}


function drawTriangle(p1, p2, p3, color, thickness) {
    const line1 = bresenham(p1.x, p1.y, p2.x, p2.y);
    const line2 = bresenham(p2.x, p2.y, p3.x, p3.y);
    const line3 = bresenham(p3.x, p3.y, p1.x, p1.y);
    
    const allPoints = [...line1, ...line2, ...line3];
    let vertices = [];
    const halfThick = Math.floor(thickness / 2);

    allPoints.forEach(p => {
        const x1 = p.x - halfThick;
        const y1 = p.y - halfThick;
        const x2 = p.x + halfThick + (thickness % 2);
        const y2 = p.y + halfThick + (thickness % 2);

        vertices.push(x1, y1, x2, y1, x1, y2);
        vertices.push(x1, y2, x2, y1, x2, y2);
    });

    draw(vertices, color);
}



function draw(vertices, color) {
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (!vertices || vertices.length === 0) return;

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        2, 
        gl.FLOAT,
        false,
        0,
        0
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

    gl.uniform4fv(programInfo.uniformLocations.color, color);

    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
}


function updateModeDisplay() {
    switch (currentMode) {
        case 'r':
            modeSpan.textContent = "Desenhar Reta";
            break;
        case 't':
            modeSpan.textContent = "Desenhar Triângulo";
            break;
        case 'k':
            modeSpan.textContent = "Mudar Cor (0-9)";
            break;
        case 'e':
            modeSpan.textContent = "Mudar Espessura (1-9)";
            break;
    }
}

canvas.addEventListener('mousedown', (event) => {
    if (currentMode !== 'r' && currentMode !== 't') return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    clicks.push({ x: Math.round(x), y: Math.round(y) });

    if (currentMode === 'r' && clicks.length === 2) {
        drawThickLine(clicks[0], clicks[1], currentColor, currentThickness);
        clicks = []; 
    } else if (currentMode === 't' && clicks.length === 3) {
        drawTriangle(clicks[0], clicks[1], clicks[2], currentColor, currentThickness);
        clicks = []; 
    }
});

window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();

    if (key === 'r' || key === 't' || key === 'k' || key === 'e') {
        currentMode = key;
        clicks = []; 
        updateModeDisplay();
        console.log(`Modo alterado para: ${currentMode}`);
    } else if (!isNaN(parseInt(key))) { 
        const num = parseInt(key);
        if (currentMode === 'k' && num >= 0 && num <= 9) {
            currentColor = indexedColors[num];
            console.log(`Cor alterada para o índice ${num}`);
        } else if (currentMode === 'e' && num >= 1 && num <= 9) {
            currentThickness = num;
            console.log(`Espessura alterada para ${num}`);
        }
    }
});


drawThickLine({x: 0, y: 0}, {x: 0, y: 0}, currentColor, currentThickness);
updateModeDisplay();