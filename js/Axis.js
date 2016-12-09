var Axis = {
    alias	    : 'axis',
    dim		    : 10,
    vertices	    : [vec4(-10,0.0,0.0,1.0), vec4(10,0.0,0.0,1.0),
		       vec4(0.0,-10/2,0.0,1.0), vec4(0.0,10/2,0.0,1.0),
		       vec4(0.0,0.0,-10,1.0), vec4(0.0,0.0,10,1.0)],
    indices	    : [0, 1,	2, 3,	4, 5],
    colors	    : [vec4(1,1,0,1),	vec4(1,1,0,1),	vec4(0,1,0,1),
		       vec4(0,1,0,1),	vec4(0,0,1,1),	vec4(0,0,1,1)],
    wireframe	    : true,
    perVertexColor  : true,
    vbo		    : null,
    cbo		    : null,
    ibo		    : null,
    build	    : function(d) {
	if (d) {
	    Axis.dim = d;
	}
	Axis.vertices = [vec4(-d,0.0,0.0,1.0), vec4(d,0.0,0.0,1.0),
			 vec4(0.0,-d/2,0.0,1.0), vec4(0.0,d/2,0.0,1.0),
			 vec4(0.0,0.0,-d,1.0), vec4(0.0,0.0,d,1.0)];
	Axis.vbo = gl.createBuffer();
	Axis.cbo = gl.createBuffer();
	Axis.ibo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, Axis.vbo);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(Axis.vertices), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Axis.ibo);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(Axis.indices),
		      gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, Axis.cbo);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(Axis.colors), gl.STATIC_DRAW);
    },
    redraw	    : function() {
	gl.bindBuffer(gl.ARRAY_BUFFER, Axis.vbo);
	gl.vertexAttribPointer(prg.aVertexPosition, 4, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, Axis.cbo);
	gl.enableVertexAttribArray(prg.aVertexColor);
	gl.disableVertexAttribArray(prg.aVertexNormal);
	gl.vertexAttribPointer(prg.aVertexColor, 4, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Axis.ibo);
	gl.drawElements(gl.LINES, Axis.indices.length, gl.UNSIGNED_SHORT, 0);	
    }
};
