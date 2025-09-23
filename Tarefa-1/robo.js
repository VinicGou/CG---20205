(function() {
    const canvas = document.getElementById('glCanvas3');
    const gl = canvas.getContext('webgl');

    if (!gl) {
        console.error('WebGL não é suportado no canvas do robô.');
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

    function createRectangle(x, y, width, height) {
        const x1 = x;
        const x2 = x + width;
        const y1 = y;
        const y2 = y + height;
        return [
            x1, y1,  x2, y1,  x1, y2, 
            x1, y2,  x2, y1,  x2, y2, 
        ];
    }

    function createColor(r, g, b) {
        return [
            r, g, b,  r, g, b,  r, g, b,
            r, g, b,  r, g, b,  r, g, b,
        ];
    }

    const headPositions = createRectangle(-0.2, 0.3, 0.4, 0.4);
    const headColors = createColor(0.5, 0.5, 0.5); 

    const bodyPositions = createRectangle(-0.3, -0.4, 0.6, 0.7);
    const bodyColors = createColor(0.2, 0.2, 0.8); 

    const leftArmPositions = createRectangle(-0.5, 0.2, 0.2, -0.5);
    const leftArmColors = createColor(0.5, 0.5, 0.5); 

    const rightArmPositions = createRectangle(0.3, 0.2, 0.2, -0.5);
    const rightArmColors = createColor(0.5, 0.5, 0.5); 

    const leftLegPositions = createRectangle(-0.25, -0.4, 0.2, -0.4);
    const leftLegColors = createColor(0.3, 0.3, 0.3); 

    const rightLegPositions = createRectangle(0.05, -0.4, 0.2, -0.4);
    const rightLegColors = createColor(0.3, 0.3, 0.3); 

    const allPositions = new Float32Array([
        ...headPositions,
        ...bodyPositions,
        ...leftArmPositions,
        ...rightArmPositions,
        ...leftLegPositions,
        ...rightLegPositions,
    ]);

    const allColors = new Float32Array([
        ...headColors,
        ...bodyColors,
        ...leftArmColors,
        ...rightArmColors,
        ...leftLegColors,
        ...rightLegColors,
    ]);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, allPositions, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, allColors, gl.STATIC_DRAW);

    gl.clearColor(0.0, 0.0, 0.0, 1.0); 
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.useProgram(program);

    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(colorAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(colorAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    const vertexCount = allPositions.length / 2; 
    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);

})();