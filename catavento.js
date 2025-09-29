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
        
        uniform mat4 uModelViewMatrix;

        varying lowp vec4 vColor;

        void main(void) {
            gl_Position = uModelViewMatrix * aVertexPosition; 
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
        uniformLocations: {
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        },
    };

    function initBuffers(gl) {
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        const pinwheelPositions = [
             0.0,   0.0, 0.0,   0.8,  0.15, 0.0,   0.15,  0.8, 0.0,
             0.0,   0.0, 0.0,  -0.15,  0.8, 0.0,   -0.8,  0.15, 0.0,
             0.0,   0.0, 0.0,  -0.8, -0.15, 0.0,  -0.15, -0.8, 0.0,
             0.0,   0.0, 0.0,   0.15, -0.8, 0.0,    0.8, -0.15, 0.0,
        ].map(val => val * 0.6); 

        const stemPositions = [
            -0.05,  0.0,  0.0,    0.05,  0.0,  0.0,   -0.05, -0.8,  0.0,
            -0.05, -0.8,  0.0,    0.05,  0.0,  0.0,    0.05, -0.8,  0.0,
        ];
        
        // primeiro a haste, depois o catavento.
        const positions = [...stemPositions, ...pinwheelPositions];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        
        const pinwheelColors = [
            1.0, 0.2, 0.2, 1.0,   1.0, 0.2, 0.2, 1.0,   1.0, 0.2, 0.2, 1.0,
            0.2, 1.0, 0.2, 1.0,   0.2, 1.0, 0.2, 1.0,   0.2, 1.0, 0.2, 1.0,
            0.2, 0.2, 1.0, 1.0,   0.2, 0.2, 1.0, 1.0,   0.2, 0.2, 1.0, 1.0,
            1.0, 1.0, 0.2, 1.0,   1.0, 1.0, 0.2, 1.0,   1.0, 1.0, 0.2, 1.0,
        ];
        
        const stemColors = [
            0.4, 0.2, 0.0, 1.0,   0.4, 0.2, 0.0, 1.0,   0.4, 0.2, 0.0, 1.0,
            0.4, 0.2, 0.0, 1.0,   0.4, 0.2, 0.0, 1.0,   0.4, 0.2, 0.0, 1.0,
        ];

        const colors = [...stemColors, ...pinwheelColors];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        return { position: positionBuffer, color: colorBuffer };
    }

    // Agora aceita um parâmetro 'rotation' para animar.
    function drawScene(gl, programInfo, buffers, rotation) {
        gl.clearColor(0.0, 0.0, 0.0, 0.0); // Cor de céu
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

        // Matriz de identidade: não causa rotação, escala ou translação.
        const identityMatrix = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ];
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, identityMatrix);
        
        // A haste são os primeiros 6 vértices no buffer.
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        const c = Math.cos(rotation);
        const s = Math.sin(rotation);

        // Matriz de rotação em torno do eixo Z
        const rotationMatrix = [
            c, s, 0, 0,
           -s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ];

        // Envia a matriz de rotação para o shader.
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, rotationMatrix);

        // O catavento começa após os 6 vértices da haste e tem 12 vértices.
        gl.drawArrays(gl.TRIANGLES, 6, 12);
    }

    const buffers = initBuffers(gl);
    
    let pinwheelRotation = 0.0;
    let lastTime = 0;

    function render(now) {
        now *= 0.001;  
        const deltaTime = now - lastTime;
        lastTime = now;

        // Atualiza a rotação baseada no tempo que passou desde o último quadro.
        // O valor '2.0' controla a velocidade da rotação.
        pinwheelRotation += deltaTime * 2.0;

        drawScene(gl, programInfo, buffers, pinwheelRotation);

        // Pede ao navegador para chamar 'render' novamente no próximo quadro.
        requestAnimationFrame(render);
    }

    // Inicia o loop de animação.
    requestAnimationFrame(render);

})();