(function() {
    const canvas = document.getElementById('glCanvas4');
    const gl = canvas.getContext('webgl');

    if (!gl) {
        console.error('WebGL não é suportado no canvas do catavento.');
        return;
    }

    const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec4 aVertexColor;
        varying lowp vec4 vColor;
        void main(void) {
            gl_Position = aVertexPosition; 
            vColor = aVertexColor;
        }
    `;

    const fsSource = `
        varying lowp vec4 vColor;
        void main(void) {
            gl_FragColor = vColor;
        }
    `;

    function initShaderProgram(gl, vsSource, fsSource) {
        const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.error('Não foi possível inicializar o programa de shader: ' + gl.getProgramInfoLog(shaderProgram));
            return null;
        }
        return shaderProgram;
    }

    function loadShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Ocorreu um erro ao compilar os shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
        },
    };

function initBuffers(gl) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const pinwheelPositions = [
         0.0,  0.0, 0.0,  0.8,  0.15, 0.0,  0.15, 0.8,  0.0,
         0.0,  0.0, 0.0, -0.15, 0.8,  0.0, -0.8,  0.15, 0.0,
         0.0,  0.0, 0.0, -0.8, -0.15, 0.0, -0.15, -0.8, 0.0,
         0.0,  0.0, 0.0,  0.15, -0.8, 0.0,  0.8, -0.15, 0.0,
    ].map(val => val * 0.6); 

    const stemPositions = [
        -0.05,  0.0,  0.0,   0.05,  0.0,  0.0,  -0.05, -0.8,  0.0,
        -0.05, -0.8,  0.0,   0.05,  0.0,  0.0,   0.05, -0.8,  0.0,
    ];
    
    const positions = [...stemPositions, ...pinwheelPositions];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    
    const pinwheelColors = [
        1.0, 0.2, 0.2, 1.0,  1.0, 0.2, 0.2, 1.0,  1.0, 0.2, 0.2, 1.0,
        0.2, 1.0, 0.2, 1.0,  0.2, 1.0, 0.2, 1.0,  0.2, 1.0, 0.2, 1.0,
        0.2, 0.2, 1.0, 1.0,  0.2, 0.2, 1.0, 1.0,  0.2, 0.2, 1.0, 1.0,
        1.0, 1.0, 0.2, 1.0,  1.0, 1.0, 0.2, 1.0,  1.0, 1.0, 0.2, 1.0,
    ];
    
    const stemColors = [
        1.0, 1.0, 1.0, 1.0,   1.0, 1.0, 1.0, 1.0,   1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,   1.0, 1.0, 1.0, 1.0,   1.0, 1.0, 1.0, 1.0,
    ];

    const colors = [...stemColors, ...pinwheelColors];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    return { position: positionBuffer, color: colorBuffer };
}

    function drawScene(gl, programInfo, buffers) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // Bind da posição
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

        // Bind da cor
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);

        gl.useProgram(programInfo.program);

        const vertexCount = 18;
        gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
    }

    const buffers = initBuffers(gl);
    drawScene(gl, programInfo, buffers);

})();