const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    alert('WebGL não é suportado ou está desabilitado. Tente usar um navegador diferente.');
}

const vsSource = `
    attribute vec4 aVertexPosition;
    uniform vec2 uResolution;
    void main() {
        vec2 zeroToOne = aVertexPosition.xy / uResolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;
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

function loadShader(gl, type, source) { const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader); if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { console.error('Erro ao compilar shader:', gl.getShaderInfoLog(shader)); gl.deleteShader(shader); return null; } return shader; }
const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
const shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);
gl.linkProgram(shaderProgram);
if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { console.error('Erro ao inicializar o shader program:', gl.getProgramInfoLog(shaderProgram)); }
gl.useProgram(shaderProgram);
const programInfo = { program: shaderProgram, attribLocations: { vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'), }, uniformLocations: { resolution: gl.getUniformLocation(shaderProgram, 'uResolution'), color: gl.getUniformLocation(shaderProgram, 'uColor'), }, };
gl.uniform2f(programInfo.uniformLocations.resolution, gl.canvas.width, gl.canvas.height);
const positionBuffer = gl.createBuffer();


let clicks = [];
const currentColor = [1.0, 0.0, 0.0, 1.0]; 
const currentThickness = 2; 
const actionSpan = document.getElementById('current-action');


function addCirclePoints(centerX, centerY, x, y, points) {
    points.push({ x: centerX + x, y: centerY + y });
    points.push({ x: centerX - x, y: centerY + y });
    points.push({ x: centerX + x, y: centerY - y });
    points.push({ x: centerX - x, y: centerY - y });
    points.push({ x: centerX + y, y: centerY + x });
    points.push({ x: centerX - y, y: centerY + x });
    points.push({ x: centerX + y, y: centerY - x });
    points.push({ x: centerX - y, y: centerY - x });
}

/**
 * Algoritmo de Bresenham (Ponto Médio) para gerar os pontos de uma circunferência.
 * @returns {Array<{x: number, y: number}>} Uma lista de pontos da borda.
 */
function bresenhamCircle(centerX, centerY, radius) {
    const points = [];
    let x = 0;
    let y = radius;
    let d = 3 - 2 * radius; 

    addCirclePoints(centerX, centerY, x, y, points);

    while (y >= x) {
        x++;
        if (d > 0) {
            y--;
            d = d + 4 * (x - y) + 10;
        } else {
            d = d + 4 * x + 6;
        }
        addCirclePoints(centerX, centerY, x, y, points);
    }
    return points;
}


function drawCircle(center, radius, color, thickness) {
    const circlePoints = bresenhamCircle(center.x, center.y, Math.round(radius));
    let vertices = [];

    const halfThick = Math.floor(thickness / 2);

    circlePoints.forEach(p => {
        const x1 = p.x - halfThick;
        const y1 = p.y - halfThick;
        const x2 = p.x + halfThick + (thickness % 2); 
        const y2 = p.y + halfThick + (thickness % 2);

        vertices.push(x1, y1, x2, y1, x1, y2);
        vertices.push(x1, y2, x2, y1, x2, y2);
    });
    
    render(vertices, color);
}


function render(vertices, color) {
    gl.clearColor(1.0, 1.0, 1.0, 1.0); 
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (!vertices || vertices.length === 0) return;

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        2, gl.FLOAT, false, 0, 0
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

    gl.uniform4fv(programInfo.uniformLocations.color, color);

    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
}


function updateActionDisplay() {
    if (clicks.length === 0) {
        actionSpan.textContent = "Aguardando 1º clique (centro)";
    } else {
        actionSpan.textContent = "Aguardando 2º clique (raio)";
    }
}

canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    clicks.push({ x: Math.round(x), y: Math.round(y) });
    updateActionDisplay();
    
    if (clicks.length === 2) {
        const center = clicks[0];
        const pointOnEdge = clicks[1];

        const dx = pointOnEdge.x - center.x;
        const dy = pointOnEdge.y - center.y;
        const radius = Math.sqrt(dx * dx + dy * dy);

        drawCircle(center, radius, currentColor, currentThickness);
        
        clicks = []; 
        updateActionDisplay();
    }
});

render([], currentColor); 
updateActionDisplay();