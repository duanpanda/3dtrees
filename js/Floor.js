var Floor = {
    alias	: 'floor',
    wireframe	: true,
    perVertexColor : true,
    dim		: 50,
    lines	: 50,
    vertices	: [],
    indices	: [],
    colors	: [],
    diffuse	: vec4(0.7, 0.7, 0.7, 1.0),
    vbo	    : null,
    cbo	    : null,
    ibo	    : null,
    build : function(d, e) {
	if (d) Floor.dim = d;
	if (e) Floor.lines = 2 * Floor.dim / e;
	var inc = 2 * Floor.dim / Floor.lines;
	var v = [];
	var i = [];

	for(var l = 0; l <= Floor.lines; l++){
	    v[8*l] = -Floor.dim;
	    v[8*l+1] = 0;
	    v[8*l+2] = -Floor.dim+(l*inc);
	    v[8*l+3] = 1.0;

	    v[8*l+4] = Floor.dim;
	    v[8*l+5] = 0;
	    v[8*l+6] = -Floor.dim+(l*inc);
	    v[8*l+7] = 1.0;

	    v[8*(Floor.lines+1)+8*l] = -Floor.dim+(l*inc);
	    v[8*(Floor.lines+1)+8*l+1] = 0;
	    v[8*(Floor.lines+1)+8*l+2] = -Floor.dim;
	    v[8*(Floor.lines+1)+8*l+3] = 1.0;

	    v[8*(Floor.lines+1)+8*l+4] = -Floor.dim+(l*inc);
	    v[8*(Floor.lines+1)+8*l+5] = 0;
	    v[8*(Floor.lines+1)+8*l+6] = Floor.dim;
	    v[8*(Floor.lines+1)+8*l+7] = 1.0;

	    i[2*l] = 2*l;
	    i[2*l+1] = 2*l+1;
	    i[2*(Floor.lines+1)+2*l] = 2*(Floor.lines+1)+2*l;
	    i[2*(Floor.lines+1)+2*l+1] = 2*(Floor.lines+1)+2*l+1;
	}
	Floor.vertices = v;
	Floor.indices = i;
	for (var k = 0; k < v.length / 4; k++) {
	    Floor.colors.push(Floor.diffuse);
	}
	Floor.vbo = gl.createBuffer();
	Floor.cbo = gl.createBuffer();
	Floor.ibo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, Floor.vbo);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Floor.vertices),
		      gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Floor.ibo);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(Floor.indices),
		      gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, Floor.cbo);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(Floor.colors), gl.STATIC_DRAW);
    },
    redraw : function() {
	gl.bindBuffer(gl.ARRAY_BUFFER, Floor.vbo);
	gl.vertexAttribPointer(prg.aVertexPosition, 4, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, Floor.cbo);
	gl.enableVertexAttribArray(prg.aVertexColor);
	gl.disableVertexAttribArray(prg.aVertexNormal);
	gl.vertexAttribPointer(prg.aVertexColor, 4, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Floor.ibo);
	gl.drawElements(gl.LINES, Floor.indices.length, gl.UNSIGNED_SHORT, 0);
    }
};
