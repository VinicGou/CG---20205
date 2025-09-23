(function() {
    const canvas = document.getElementById('glCanvas2');
    const gl = canvas.getContext('webgl');

    if (!gl) {
        console.error('WebGL não é suportado no canvas do carro.');
        return;
    }

    const vsSource = `
        attribute vec4 a_position;
        attribute vec4 a_color;
        varying vec4 v_color;
        void main() {
            gl_Position = a_position;
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
            gl.deleteShader(shader);
            return null;
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
            gl.deleteProgram(program);
            return null;
        }
        return program;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const program = createProgram(gl, vertexShader, fragmentShader);

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const colorAttributeLocation = gl.getAttribLocation(program, "a_color");

    const positionBuffer = gl.createBuffer();
    const colorBuffer = gl.createBuffer();

    gl.useProgram(program);

    function createCircleVertices(xPosition, yPosition, radius, numSides = 30) {
        const vertices = [];
        vertices.push(xPosition, yPosition); 
        for (let i = 0; i <= numSides; i++) {
            const angle = i * 2 * Math.PI / numSides;
            vertices.push(xPosition + radius * Math.cos(angle), yPosition + radius * Math.sin(angle));
        }
        return new Float32Array(vertices);
    }




    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    function drawShape(positions, colors, mode) {
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(colorAttributeLocation);
        gl.vertexAttribPointer(colorAttributeLocation, 3, gl.FLOAT, false, 0, 0);

        gl.drawArrays(mode, 0, positions.length / 2);
    }

    const wheelY = -0.4;
    const wheelRadius = 0.2;
    const wheelSides = 30;
    const wheelColor = new Float32Array(Array(wheelSides + 2).fill([0.1, 0.1, 0.1]).flat());

    const leftWheelPositions = createCircleVertices(-0.5, wheelY, wheelRadius, wheelSides);
    drawShape(leftWheelPositions, wheelColor, gl.TRIANGLE_FAN);

    const rightWheelPositions = createCircleVertices(0.5, wheelY, wheelRadius, wheelSides);
    drawShape(rightWheelPositions, wheelColor, gl.TRIANGLE_FAN);
    
    const bodyPositions = new Float32Array([
        -0.8, -0.4,   0.8, -0.4,  -0.8, 0.0,
        -0.8, 0.0,    0.8, -0.4,   0.8, 0.0
    ]);
    const bodyColors = new Float32Array(Array(6).fill([1.0, 0.2, 0.2]).flat());
    drawShape(bodyPositions, bodyColors, gl.TRIANGLES);

    const cabinPositions = new Float32Array([
        -0.6, 0.0,   0.5, 0.0,  -0.4, 0.4,
        -0.4, 0.4,   0.5, 0.0,   0.3, 0.4
    ]);
    const cabinColors = new Float32Array(Array(6).fill([0.5, 0.8, 1.0]).flat());
    drawShape(cabinPositions, cabinColors, gl.TRIANGLES);

    const hubcapRadius = 0.08;
    const hubcapColor = new Float32Array(Array(wheelSides + 2).fill([0.8, 0.8, 0.8]).flat());

    const leftHubcapPositions = createCircleVertices(-0.5, wheelY, hubcapRadius, wheelSides);
    drawShape(leftHubcapPositions, hubcapColor, gl.TRIANGLE_FAN);

    const rightHubcapPositions = createCircleVertices(0.5, wheelY, hubcapRadius, wheelSides);
    drawShape(rightHubcapPositions, hubcapColor, gl.TRIANGLE_FAN);

})();