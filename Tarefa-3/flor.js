const vertexShaderFlower = `
    attribute vec2 a_position; // Alterado para vec2 para corresponder aos dados
    attribute vec4 a_color;
    
    uniform mat4 u_matrix;

    varying vec4 v_color;
    void main() {
        // Multiplica a posição pela matriz de transformação
        gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);
        v_color = a_color;
    }
`;

const fragmentShaderFlower = `
    precision mediump float;
    varying vec4 v_color;
    void main() {
        gl_FragColor = v_color;
    }
`;

function createShaderFlower(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Error compiling shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgramFlower(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Error linking program:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
}

function circleVertices(xPosition, yPosition, radius, numSides) {
    const vertices = [];
    vertices.push(xPosition, yPosition); 
    for (let i = 0; i <= numSides; i++) {
        const angle = i * 2 * Math.PI / numSides;
        const x = radius * Math.cos(angle) + xPosition;
        const y = radius * Math.sin(angle) + yPosition;
        vertices.push(x, y);
    }
    return new Float32Array(vertices);
}

function circleColor(numSides, color) {
    const colors = [];
    for (let i = 0; i < numSides + 2; i++) {
        colors.push(...color);
    }
    return new Float32Array(colors);
}


function mainFlower() {
    const canvas = document.getElementById('glCanvasFlower');
    const gl = canvas.getContext('webgl');

    if (!gl) {
        console.error('WebGL not supported');
        return;
    }

    const vertexShader = createShaderFlower(gl, gl.VERTEX_SHADER, vertexShaderFlower);
    const fragmentShader = createShaderFlower(gl, gl.FRAGMENT_SHADER, fragmentShaderFlower);
    const program = createProgramFlower(gl, vertexShader, fragmentShader);
    
    const locations = {
        position: gl.getAttribLocation(program, 'a_position'),
        color: gl.getAttribLocation(program, 'a_color'),
        matrix: gl.getUniformLocation(program, 'u_matrix'),
    };

    const vertexBuffer = gl.createBuffer();
    const colorBuffer = gl.createBuffer();

    
    function drawScene(time) {
        time *= 0.001; 

        gl.clearColor(0.0, 0.0, 0.0, 0.0); 
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.useProgram(program);

        // Matriz de identidade para objetos que não se movem
        const identityMatrix = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ];

        const stemVertices = new Float32Array([
            -0.05, -0.1,  0.05, -0.1, -0.05, -0.8,
             0.05, -0.1,  0.05, -0.8, -0.05, -0.8
        ]);
        const stemColors = new Float32Array([
            0.0, 0.6, 0.2,  0.0, 0.6, 0.2, 0.0, 0.6, 0.2,
            0.0, 0.6, 0.2,  0.0, 0.6, 0.2, 0.0, 0.6, 0.2
        ]);
        
        gl.uniformMatrix4fv(locations.matrix, false, identityMatrix);

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, stemVertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(locations.position);

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, stemColors, gl.STATIC_DRAW);
        gl.vertexAttribPointer(locations.color, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(locations.color);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        const numSides = 20;
        const radius = 0.145;
        const petalPositions = [
            [ 0.2,  0.0], [-0.2,  0.0],
            [ 0.0,  0.2], [ 0.0, -0.2],
        ];
        
        // Calcula o fator de escala usando seno para oscilar suavemente
        const scale = 1.0 + Math.sin(time * 2.5) * 0.08; // 2.5 é a velocidade, 0.08 é a amplitude
        const scaleMatrix = [
            scale, 0, 0, 0,
            0, scale, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ];
        gl.uniformMatrix4fv(locations.matrix, false, scaleMatrix);

        petalPositions.forEach(pos => {
            const vertices = circleVertices(pos[0], pos[1], radius, numSides);
            const colors = circleColor(numSides, [1.0, 0.0, 0.0]); 

            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
            gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
            gl.vertexAttribPointer(locations.color, 3, gl.FLOAT, false, 0, 0);
            
            gl.drawArrays(gl.TRIANGLE_FAN, 0, numSides + 2);
        });


        gl.uniformMatrix4fv(locations.matrix, false, identityMatrix);

        const centerVertices = circleVertices(0.0, 0.0, radius, numSides);
        const centerColors = circleColor(numSides, [1.0, 1.0, 0.0]); 

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, centerVertices, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, centerColors, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(locations.color, 3, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, numSides + 2);

        requestAnimationFrame(drawScene);
    }
    
    requestAnimationFrame(drawScene);
}

window.addEventListener('load', mainFlower);