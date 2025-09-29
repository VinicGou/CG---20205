(function() {
    const canvas = document.getElementById('glCanvas2');
    const gl = canvas.getContext('webgl');

    if (!gl) {
        console.error('WebGL não é suportado no canvas do carro.');
        return;
    }

    // Adicionamos um 'uniform mat4 u_matrix' para aplicar as transformações.
    // Cada vértice será multiplicado por esta matriz para definir sua posição final.
    const vsSource = `
        attribute vec4 a_position;
        attribute vec4 a_color;

        uniform mat4 u_matrix; // Matriz de transformação

        varying vec4 v_color;
        void main() {
            // A posição final é a matriz de transformação aplicada à posição original do vértice.
            // Convertemos a_position (vec2) para vec4 para a multiplicação.
            gl_Position = u_matrix * vec4(a_position.xy, 0.0, 1.0);
            v_color = a_color;
        }
    `;

    const fsSource = `
        precision mediump float;
        varying vec4 v_color;
        void main() {
            gl_FragColor = v_color;
        }
    `;

    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Erro ao compilar shader:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader); return null;
        }
        return shader;
    }
    function createProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Erro ao ligar programa:', gl.getProgramInfoLog(program));
            gl.deleteProgram(program); return null;
        }
        return program;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const program = createProgram(gl, vertexShader, fragmentShader);

    const locations = {
        position: gl.getAttribLocation(program, "a_position"),
        color: gl.getAttribLocation(program, "a_color"),
        matrix: gl.getUniformLocation(program, "u_matrix"),
    };
    
    const positionBuffer = gl.createBuffer();
    const colorBuffer = gl.createBuffer();
    
    // Funções simples para criar matrizes de translação e rotação em Z.
    const matrixHelper = {
        identity: () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        translate: (m, tx, ty, tz) => {
            m[12] = m[0] * tx + m[4] * ty + m[8] * tz + m[12];
            m[13] = m[1] * tx + m[5] * ty + m[9] * tz + m[13];
            m[14] = m[2] * tx + m[6] * ty + m[10] * tz + m[14];
            m[15] = m[3] * tx + m[7] * ty + m[11] * tz + m[15];
            return m;
        },
        rotateZ: (m, angleInRadians) => {
            const c = Math.cos(angleInRadians);
            const s = Math.sin(angleInRadians);
            const m00 = m[0], m01 = m[1], m02 = m[2], m03 = m[3];
            const m10 = m[4], m11 = m[5], m12 = m[6], m13 = m[7];
            m[0] = c * m00 + s * m10;
            m[1] = c * m01 + s * m11;
            m[2] = c * m02 + s * m12;
            m[3] = c * m03 + s * m13;
            m[4] = c * m10 - s * m00;
            m[5] = c * m11 - s * m01;
            m[6] = c * m12 - s * m02;
            m[7] = c * m13 - s * m03;
            return m;
        }
    };

    // Para a rotação funcionar corretamente, o objeto deve ser definido em torno de seu ponto de rotação.
    function createCircleVertices(radius, numSides = 30) {
        const vertices = [0, 0]; // Centro na origem
        for (let i = 0; i <= numSides; i++) {
            const angle = i * 2 * Math.PI / numSides;
            vertices.push(radius * Math.cos(angle), radius * Math.sin(angle));
        }
        return new Float32Array(vertices);
    }

    gl.useProgram(program);
    
    // Função de desenho 
    function drawShape(positions, colors, mode) {
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(locations.position);
        gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(locations.color);
        gl.vertexAttribPointer(locations.color, 3, gl.FLOAT, false, 0, 0);

        gl.drawArrays(mode, 0, positions.length / 2);
    }

    const bodyPositions = new Float32Array([-0.8,-0.4, 0.8,-0.4, -0.8,0.0, -0.8,0.0, 0.8,-0.4, 0.8,0.0]);
    const bodyColors = new Float32Array(Array(6).fill([1.0, 0.2, 0.2]).flat());
    const cabinPositions = new Float32Array([-0.6,0.0, 0.5,0.0, -0.4,0.4, -0.4,0.4, 0.5,0.0, 0.3,0.4]);
    const cabinColors = new Float32Array(Array(6).fill([0.5, 0.8, 1.0]).flat());

    const wheelRadius = 0.2;
    const wheelSides = 30;
    const wheelPositions = createCircleVertices(wheelRadius, wheelSides);
    const wheelColor = new Float32Array(Array(wheelSides + 2).fill([0.1, 0.1, 0.1]).flat());

    const hubcapRadius = 0.08;
    const hubcapPositions = createCircleVertices(hubcapRadius, wheelSides);
    const hubcapColor = new Float32Array(Array(wheelSides + 2).fill([0.8, 0.8, 0.8]).flat());


    let carPositionX = -1.5;
    let wheelRotation = 0;
    let lastTime = 0;

    function render(time) {
        time *= 0.001; 
        const deltaTime = time - lastTime;
        lastTime = time;

        carPositionX += deltaTime * 0.5; // Velocidade do carro
        wheelRotation -= deltaTime * 2.0; // Velocidade da roda

        // Se o carro sair da tela, reseta a posição
        if (carPositionX > 2.0) {
            carPositionX = -2.0;
        }

        gl.clearColor(0.0, 0.0, 0.0, 0.0); 
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);


        let bodyMatrix = matrixHelper.identity();
        matrixHelper.translate(bodyMatrix, carPositionX, 0, 0);
        gl.uniformMatrix4fv(locations.matrix, false, bodyMatrix);
        drawShape(bodyPositions, bodyColors, gl.TRIANGLES);
        drawShape(cabinPositions, cabinColors, gl.TRIANGLES);


        let leftWheelMatrix = matrixHelper.identity();
        matrixHelper.translate(leftWheelMatrix, carPositionX, 0, 0);
        matrixHelper.translate(leftWheelMatrix, -0.5, -0.4, 0);
        matrixHelper.rotateZ(leftWheelMatrix, wheelRotation);
        gl.uniformMatrix4fv(locations.matrix, false, leftWheelMatrix);
        drawShape(wheelPositions, wheelColor, gl.TRIANGLE_FAN);
        drawShape(hubcapPositions, hubcapColor, gl.TRIANGLE_FAN);


        let rightWheelMatrix = matrixHelper.identity();
        matrixHelper.translate(rightWheelMatrix, carPositionX, 0, 0); 
        matrixHelper.translate(rightWheelMatrix, 0.5, -0.4, 0);   
        matrixHelper.rotateZ(rightWheelMatrix, wheelRotation);     
        gl.uniformMatrix4fv(locations.matrix, false, rightWheelMatrix);
        drawShape(wheelPositions, wheelColor, gl.TRIANGLE_FAN);
        drawShape(hubcapPositions, hubcapColor, gl.TRIANGLE_FAN);

        requestAnimationFrame(render);
    }
    
    requestAnimationFrame(render);

})();