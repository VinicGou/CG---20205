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
        
        uniform mat4 u_matrix; // Matriz de transformação
        
        varying vec4 v_color;
        void main() {
            gl_Position = u_matrix * a_position;
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
    
    function createRectangle(x, y, width, height) {
        const x1 = x, x2 = x + width, y1 = y, y2 = y + height;
        return new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]);
    }

    function createColor(r, g, b) {
        return new Float32Array(Array(6).fill([r,g,b]).flat());
    }


    const matrixHelper = {
        identity: () => [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1],
        translate: (m, tx, ty, tz) => {
            let m_ = [...m]; 
            m_[12] = m[0] * tx + m[4] * ty + m[8] * tz + m[12];
            m_[13] = m[1] * tx + m[5] * ty + m[9] * tz + m[13];
            m_[14] = m[2] * tx + m[6] * ty + m[10] * tz + m[14];
            return m_;
        },
        rotateZ: (m, angle) => {
            let m_ = [...m];
            const c = Math.cos(angle), s = Math.sin(angle);
            const m00 = m[0], m01 = m[1], m10 = m[4], m11 = m[5];
            m_[0] = c * m00 + s * m10; m_[1] = c * m01 + s * m11;
            m_[4] = c * m10 - s * m00; m_[5] = c * m11 - s * m01;
            return m_;
        }
    };

    const parts = {
        head:  { pos: createRectangle(-0.2, 0.3, 0.4, 0.4),   color: createColor(0.5, 0.5, 0.5) },
        body:  { pos: createRectangle(-0.3, -0.4, 0.6, 0.7),  color: createColor(0.2, 0.2, 0.8) },
        lArm:  { pos: createRectangle(-0.5, 0.2, 0.2, -0.5),  color: createColor(0.5, 0.5, 0.5), pivot: [-0.4, 0.2] },
        rArm:  { pos: createRectangle(0.3, 0.2, 0.2, -0.5),   color: createColor(0.5, 0.5, 0.5), pivot: [0.4, 0.2] },
        lLeg:  { pos: createRectangle(-0.25, -0.4, 0.2, -0.4), color: createColor(0.3, 0.3, 0.3), pivot: [-0.15, -0.4] },
        rLeg:  { pos: createRectangle(0.05, -0.4, 0.2, -0.4),  color: createColor(0.3, 0.3, 0.3), pivot: [0.15, -0.4] },
    };


    function render(time) {
        time *= 0.002; 

        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.useProgram(program);

        function drawPart(part, matrix) {
            gl.uniformMatrix4fv(locations.matrix, false, matrix);

            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, part.pos, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(locations.position);
            gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, part.color, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(locations.color);
            gl.vertexAttribPointer(locations.color, 3, gl.FLOAT, false, 0, 0);

            gl.drawArrays(gl.TRIANGLES, 0, part.pos.length / 2);
        }
        
        const swingAngle = Math.sin(time) * 0.4; // Ângulo de balanço 
        const bodyBob = Math.abs(Math.sin(time)) * 0.05; // Movimento vertical

        // Matriz base para o corpo 
        const baseMatrix = matrixHelper.translate(matrixHelper.identity(), 0, bodyBob, 0);

        // Desenha cabeça e corpo
        drawPart(parts.head, baseMatrix);
        drawPart(parts.body, baseMatrix);
        
        // Função para criar a matriz de rotação em torno de um pivô
        function createPivotRotationMatrix(pivot, angle) {
            let matrix = baseMatrix;
            matrix = matrixHelper.translate(matrix, pivot[0], pivot[1], 0);
            matrix = matrixHelper.rotateZ(matrix, angle);
            matrix = matrixHelper.translate(matrix, -pivot[0], -pivot[1], 0);
            return matrix;
        }

        // Desenha braços e pernas com rotação
        const lArmMatrix = createPivotRotationMatrix(parts.lArm.pivot, swingAngle);
        drawPart(parts.lArm, lArmMatrix);
        
        const rArmMatrix = createPivotRotationMatrix(parts.rArm.pivot, -swingAngle);
        drawPart(parts.rArm, rArmMatrix);
        
        const lLegMatrix = createPivotRotationMatrix(parts.lLeg.pivot, -swingAngle);
        drawPart(parts.lLeg, lLegMatrix);
        
        const rLegMatrix = createPivotRotationMatrix(parts.rLeg.pivot, swingAngle);
        drawPart(parts.rLeg, rLegMatrix);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

})();