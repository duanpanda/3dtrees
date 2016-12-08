var canvas;
var gl;
var prg;
const RADIAN_TO_DEGREE = 180 / Math.PI;
const DEGREE_TO_RADIAN = Math.PI / 180;

var lightPosition = vec4(1.0, 1.5, 1.2, 1.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var coneColorPallete = [
    // vec4(0.9, 0.1, 0.1, 1.0),
    // vec4(116/255, 23/255, 1.0, 1.0),
    // vec4(0.1, 0.9, 0.1, 1.0),
    // vec4(1.0, 0.0, 144/255, 1.0),
    vec4(1.0, 112/255, 112/255, 1.0)];
var coneShininess = 100.0;
var leafColor = vec4(0.0, 0.8, 0.0, 1.0);
var leafShininess = 50.0;

var transform;
var camera;
var cameraInteractor;

const CAMERA_ORBIT_TYPE = 1;
const CAMERA_TRACKING_TYPE = 2;
var near = 0.2;
var far = 5000;
var fovy = 90;
var cameraHome = vec3(0.0, 1.0, 2.0);
var cameraHomeForest = vec3(0.0, 2.0, 4.0);

var cones = [];
var numTimesToSubdivide = 4;
var updateLightPosition = false;
var disableLighting = false;
var rootArg = {'base': [0, 0, 0, 1], 'tz': 0, 'ty': 0, 's': 1.0, 'parentR': mat4()};
var forestArgs = [
    {'base': [0, 0, 0, 1], 'tz': 0, 'ty': 0, 's': 1.9, 'parentR': mat4()},
    {'base': [0.1, 0, 1.4, 1], 'tz': 0, 'ty': 0, 's': 1.0, 'parentR': mat4()},
    {'base': [-1.0, 0, 1.3, 1], 'tz': 0, 'ty': 0, 's': 0.8, 'parentR': mat4()},
    {'base': [-1.5, 0, -1.7, 1], 'tz': 0, 'ty': 0, 's': 0.7, 'parentR': mat4()},
    {'base': [1.6, 0, 0.8, 1], 'tz': 0, 'ty': 0, 's': 0.4, 'parentR': mat4()},
    {'base': [1.8, 0, -2.0, 1], 'tz': 0, 'ty': 0, 's': 1.0, 'parentR': mat4()}
];
var branchNum = 3;
var tz = 60;
var ty = 0;
var scaleFactor = 0.6;
var isRandBranchNum = false;
var isRandTz = false;
var isRandScaling = false;
var isForest = false;
var leaves = [];
var isPolygonLeaf = false;

function configure() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    camera = new Camera(CAMERA_ORBIT_TYPE);
    camera.goHome(cameraHome);

    cameraInteractor = new CameraInteractor(camera, canvas);

    transform = new SceneTransforms(camera);
    transform.init();
}

function initProgram() {
    prg = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(prg);

    prg.aVertexNormal = gl.getAttribLocation(prg, "aVertexNormal");
    gl.enableVertexAttribArray(prg.aVertexNormal);

    prg.aVertexPosition = gl.getAttribLocation(prg, "aVertexPosition");
    gl.enableVertexAttribArray(prg.aVertexPosition);

    prg.aVertexColor = gl.getAttribLocation(prg, "aVertexColor");
    gl.enableVertexAttribArray(prg.aVertexColor);

    prg.uMVMatrix = gl.getUniformLocation(prg, "uMVMatrix");
    prg.uNMatrix = gl.getUniformLocation(prg, "uNMatrix");
    prg.uPMatrix = gl.getUniformLocation(prg, "uPMatrix");
    prg.uMaterialAmbient = gl.getUniformLocation(prg, "uMaterialAmbient");
    prg.uMaterialDiffuse = gl.getUniformLocation(prg, "uMaterialDiffuse");
    prg.uMaterialSpecular = gl.getUniformLocation(prg, "uMaterialSpecular");
    prg.uShininess = gl.getUniformLocation(prg, "uShininess");
    prg.uLightAmbient = gl.getUniformLocation(prg, "uLightAmbient");
    prg.uLightDiffuse = gl.getUniformLocation(prg, "uLightDiffuse");
    prg.uLightSpecular = gl.getUniformLocation(prg, "uLightSpecular");
    prg.uLightPosition = gl.getUniformLocation(prg, "uLightPosition");
    prg.uUpdateLight = gl.getUniformLocation(prg, "uUpdateLight");
    prg.uPerVertexColor = gl.getUniformLocation(prg, "uPerVertexColor");
    prg.uPointSize = gl.getUniformLocation(prg, "uPointSize");
}

function initLights() {
    gl.uniform4fv(prg.uLightPosition, lightPosition);
    gl.uniform4fv(prg.uLightAmbient, lightAmbient);
    gl.uniform4fv(prg.uLightDiffuse, lightDiffuse);
    gl.uniform4fv(prg.uLightSpecular, lightSpecular);
}

function initObjData() {
    cones = [];
    leaves = [];
    if (isForest) {
	camera.goHome(cameraHomeForest);
	genForest();
    } else {
	camera.goHome(cameraHome);
	genTree(rootArg, numTimesToSubdivide);
	// genLeaf(rootArg);
    }
}

function initGUIControls() {
    document.getElementById('regenerate').onclick = initObjData;
    document.getElementById('btn-light-pos').onclick = toggleLightPos;
    document.getElementById('btn-lighting').onclick = toggleLighting;

    var recursionSlider = document.getElementById('recursion-levels-slider');
    numTimesToSubdivide = recursionSlider.valueAsNumber;
    document.getElementById('rl').innerHTML = recursionSlider.valueAsNumber;
    recursionSlider.onchange = function(event) {
	numTimesToSubdivide = recursionSlider.valueAsNumber;
	document.getElementById('rl').innerHTML = recursionSlider.valueAsNumber;
	initObjData();
    };
    var branchNumSlider = document.getElementById('branch-number-slider');
    branchNum = branchNumSlider.value - 1;
    document.getElementById('bn').innerHTML = branchNumSlider.value;
    branchNumSlider.onchange = function(event) {
	branchNum = branchNumSlider.value - 1;
	document.getElementById('bn').innerHTML = branchNumSlider.value;
	initObjData();
    };
    var tzSlider = document.getElementById('tz-slider');
    tz = tzSlider.valueAsNumber;
    document.getElementById('tz').innerHTML = tzSlider.value;
    tzSlider.onchange = function(event) {
	tz = tzSlider.valueAsNumber;
	document.getElementById('tz').innerHTML = tzSlider.value;
	initObjData();
    };
    var scalingSlider = document.getElementById('scaling-slider');
    scaleFactor = scalingSlider.valueAsNumber;
    document.getElementById('sf').innerHTML = scalingSlider.value;
    scalingSlider.onchange = function(event) {
	scaleFactor = scalingSlider.valueAsNumber;
	document.getElementById('sf').innerHTML = scalingSlider.value;
	initObjData();
    };
    var bnCbox = document.getElementById('bn-cbox');
    bnCbox.onchange = function(event) {
	isRandBranchNum = bnCbox.checked;
	initObjData();
    };
    var tzCbox = document.getElementById('tz-cbox');
    tzCbox.onchange = function(event) {
	isRandTz = tzCbox.checked;
	initObjData();
    };
    var sCbox = document.getElementById('s-cbox');
    sCbox.onchange = function(event) {
	isRandScaling = sCbox.checked;
	initObjData();
    };
    var forestCbox = document.getElementById('forest-cbox');
    forestCbox.onchange = function(event) {
	isForest = forestCbox.checked;
	initObjData();
    };
    var polygonLeafCbox = document.getElementById('leaf-cbox');
    polygonLeafCbox.onchange = function(event) {
	isPolygonLeaf = polygonLeafCbox.checked;
	initObjData();
    };
}

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert( "WebGL isn't available"); }

    configure();
    initProgram();
    initLights();
    initGUIControls();
    initObjData();

    render();
};

function render() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    updateTransforms();

    gl.uniform1i(prg.uUpdateLight, updateLightPosition);
    gl.uniform1i(prg.uPerVertexColor, disableLighting);

    var newMVMatrix;
    for (var i = 0; i < cones.length; i++) {
	var cone = cones[i];
	transform.push();
	newMVMatrix = cone.calcTransformMatrix(transform.mvMatrix);
	transform.setMVMatrix(newMVMatrix);
	transform.setMatrixUniforms();
	transform.pop();
	cone.setLights();
	cone.redraw();
    }
    for (i = 0; i < leaves.length; i++) {
	var leaf = leaves[i];
	transform.push();
	newMVMatrix = leaf.calcTransformMatrix(transform.mvMatrix);
	transform.setMVMatrix(newMVMatrix);
	transform.setMatrixUniforms();
	transform.pop();
	leaf.setLights();
	leaf.redraw();
    }

    requestAnimFrame(render);
}

function updateTransforms() {
    transform.calculateModelView();
    // displayMatrix(transform.mvMatrix);
    var p = {'fovy': fovy, 'aspect': canvas.width / canvas.height,
	     'near': near, 'far': far};
    transform.calculatePerspective(p);
}

function toggleLightPos() {
    updateLightPosition = !updateLightPosition;
    document.getElementById('toggle-light-pos').innerHTML =
	updateLightPosition ? 'Updating Light Position' : 'Not Updating Light Position';
}

function toggleLighting() {
    disableLighting = !disableLighting;
    document.getElementById('toggle-lighting').innerHTML =
	disableLighting ? 'Lighting Disabled' : 'Lighting Enabled';
}

function Cone(arg) {
    this.vertices = [];
    this.normals = [];
    this.colors = [];
    this.vbo = gl.createBuffer();
    this.cbo = gl.createBuffer();
    this.nbo = gl.createBuffer();
    this.color = vec4(0.0, 0.0, 0.0, 1.0);

    this.ambient = coneColorPallete[getRandomInt(0, coneColorPallete.length)];
    this.diffuse = this.ambient;
    this.specular = this.diffuse;
    this.shininess = coneShininess;
    this.S = scale3d(arg.s, arg.s, arg.s);
    this.R = mult(rotate(arg.ty, [0, 1, 0]),
		  rotate(arg.tz, [0, 0, 1]));
    this.T = translate(arg.base[0], arg.base[1], arg.base[2]);
    this.drawMode = gl.TRIANGLE_FAN;
    this.calcNormals = function() {
	this.normals = [];
	var n;
	for (var i = 0; i < this.vertices.length; i++) {
	    var v = this.vertices[i];
	    n = vec4(v[0], v[1], v[2], 0.0);
	    this.normals.push(n);
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, this.nbo);
	gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);
    };
    this.setColor = function(c) {
	this.color = c;
	if (this.colors.length != this.vertices.length) {
	    this.colors = new Array(this.vertices.length);
	}
	for (var i = 0; i < this.colors.length; i++) {
	    this.colors[i] = c;
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, this.cbo);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(this.colors), gl.STATIC_DRAW);
    };
    this.genPoints = function() {
	this.vertices = [vec4(0, 1, 0, 1.0)];
	var x, z, p;
	for (var theta = 0; theta <= 360; theta += 10) {
	    x = 0.1 * Math.cos(theta * DEGREE_TO_RADIAN);
	    z = 0.1 * Math.sin(theta * DEGREE_TO_RADIAN);
	    p = vec4(x, 0, z, 1.0);
	    this.vertices.push(p);
	}
	this.calcNormals();

	gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vertices), gl.STATIC_DRAW);

	this.setColor(this.diffuse);
    };
    this.genPoints();
    this.setLights = function() {
	gl.uniform4fv(prg.uMaterialAmbient, this.ambient);
	gl.uniform4fv(prg.uMaterialDiffuse, this.diffuse);
	gl.uniform4fv(prg.uMaterialSpecular, this.specular);
	gl.uniform1f(prg.uShininess, this.shininess);
    };
    this.calcTransformMatrix = function(m) {
	// order of S and R does not matter, but T must be done at last
	a = mult(mult(mult(mult(m, this.T), this.S), arg.parentR), this.R);
	return a;
    };
    this.redraw = function() {
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
	gl.vertexAttribPointer(prg.aVertexPosition, 4, gl.FLOAT, false, 0, 0);
	if (disableLighting) {
	    gl.bindBuffer(gl.ARRAY_BUFFER, this.cbo);
	    gl.enableVertexAttribArray(prg.aVertexColor);
	    gl.disableVertexAttribArray(prg.aVertexNormal);
	    gl.vertexAttribPointer(prg.aVertexColor, 4, gl.FLOAT, false, 0, 0);
	} else {
	    gl.bindBuffer(gl.ARRAY_BUFFER, this.nbo);
	    gl.enableVertexAttribArray(prg.aVertexNormal);
	    gl.disableVertexAttribArray(prg.aVertexColor);
	    gl.vertexAttribPointer(prg.aVertexNormal, 4, gl.FLOAT, false, 0, 0);
	}
	gl.drawArrays(this.drawMode, 0, this.vertices.length);
    };
    this.getTipPos = function() {
	var m = mult(mult(mult(this.T, this.S), arg.parentR), this.R);
	var baseTip = vec4(rootArg.base);
	baseTip[1] = 1;
	var tip = mat4_multiplyVec4(m, baseTip);
	return tip;
    };
    this.getArg = function() {
	return arg;
    };
    this.getR = function() {
	return mult(arg.parentR, this.R);
    };
};

function genCone(arg) {
    var cone = new Cone(arg);
    cones.push(cone);
    return cone;
}

function genTree(arg, n) {
    if (n == 0) {
	if (isPolygonLeaf) {
	    genLeaf(arg);
	} else {
	    genCone(arg);
	}
    } else {
	var cone = genCone(arg);
	var coneArg = cone.getArg();
	var newArg = {'base': cone.getTipPos(),
		      'tz': 0,
		      'ty': 0,
		      's': coneArg.s * scaleFactor,
		      'parentR': cone.getR()};
	genTree(newArg, n - 1);
	var bn = isRandBranchNum ? getRandomInt(0, 6) : branchNum;
	var new_tz = isRandTz ? getRandomInt(20, 80) : tz;
	var new_sf = isRandScaling ? getRandomArbitrary(0.4, 0.7) : scaleFactor;
	for (var i = 0; i < bn; i++) {
	    newArg = {'base': cone.getTipPos(),
		      'tz': new_tz,
		      'ty': ty + i * 360 / bn,
		      's': coneArg.s * new_sf,
		      'parentR': cone.getR()};
	    genTree(newArg, n - 1);
	}
    }
}

function genForest() {
    console.log('generating forest...');
    for (var i = 0; i < forestArgs.length; i++) {
	genTree(forestArgs[i], numTimesToSubdivide);
    }
    console.log('done');
}

function Leaf(arg) {
    this.vertices = [];
    this.normals = [];
    this.colors = [];
    this.indices = [];
    this.vbo = gl.createBuffer();
    this.cbo = gl.createBuffer();
    this.nbo = gl.createBuffer();
    this.ibo = gl.createBuffer();
    this.indices = gl.createBuffer();
    this.color = leafColor;

    this.ambient = this.color;
    this.diffuse = this.ambient;
    this.specular = this.diffuse;
    this.shininess = leafShininess;
    this.S = scale3d(arg.s, arg.s * 2, arg.s);
    this.R = mult(rotate(arg.ty, [0, 1, 0]),
		  rotate(arg.tz, [0, 0, 1]));
    this.T = translate(arg.base[0], arg.base[1], arg.base[2]);
    this.drawMode = gl.TRIANGLES;
    this.calcNormals = function() {
	this.normals = new Array(this.indices.length * 3);
	this.normals = calculateNormals(flatten(this.vertices), flatten(this.indices));
	gl.bindBuffer(gl.ARRAY_BUFFER, this.nbo);
	gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

	// for (var i = 0; i < this.normals.length / 2; i++) {
	//     this.normals.push(vec4(0, 0, 1, 0));
	// }
	// for (i = 0; i < this.normals.length / 2; i++) {
	//     this.normals.push(vec4(0, 0, -1, 0));
	// }
    };
    this.setColor = function(c) {
	this.color = c;
	if (this.colors.length != this.vertices.length) {
	    this.colors = new Array(this.vertices.length);
	}
	for (var i = 0; i < this.colors.length; i++) {
	    this.colors[i] = c;
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, this.cbo);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(this.colors), gl.STATIC_DRAW);
    };
    this.genPoints = function() {
	this.vertices = [
	    vec4(-0.02, 0, 0, 1.0), vec4(0.02, 0, 0, 1.0), vec4(-0.02, 0.1, 0, 1.0),
	    vec4(0.02, 0.1, 0, 1.0), vec4(-0.15, 0.1, 0, 1.0), vec4(0.15, 0.1, 0, 1.0),
	    vec4(0.15, 0.2, 0, 1.0), vec4(-0.15, 0.2, 0, 1.0), vec4(0, 0.3, 0, 1.0),
	    vec4(-0.25, 0.25, 0, 1.0), vec4(-0.15, 0.15, 0, 1.0), vec4(-0.28, 0.08, 0, 1.0),
	    vec4(0.25, 0.25, 0, 1.0), vec4(0.15, 0.15, 0, 1.0), vec4(0.25, 0.08, 0, 1.0)];
	this.indices = [
	    0, 1, 2,    1, 2, 3,    4, 5, 7,    5, 7, 6,    6, 7, 8,    4, 9, 7,
	    4, 10, 11,    5, 12, 6,    5, 14, 13,
	    0, 1, 2,    1, 2, 3,    4, 5, 7,    5, 7, 6,    6, 7, 8,    4, 9, 7,
	    4, 10, 11,    5, 12, 6,    5, 14, 13];
	this.calcNormals();

	gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vertices), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);

	this.setColor(this.diffuse);
    };
    this.genPoints();
    this.setLights = function() {
	gl.uniform4fv(prg.uMaterialAmbient, this.ambient);
	gl.uniform4fv(prg.uMaterialDiffuse, this.diffuse);
	gl.uniform4fv(prg.uMaterialSpecular, this.specular);
	gl.uniform1f(prg.uShininess, this.shininess);
    };
    this.calcTransformMatrix = function(m) {
	// order of S and R does not matter, but T must be done at last
	a = mult(mult(mult(mult(m, this.T), this.S), arg.parentR), this.R);
	return a;
    };
    this.redraw = function() {
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
	gl.vertexAttribPointer(prg.aVertexPosition, 4, gl.FLOAT, false, 0, 0);
	if (disableLighting) {
	    gl.bindBuffer(gl.ARRAY_BUFFER, this.cbo);
	    gl.enableVertexAttribArray(prg.aVertexColor);
	    gl.disableVertexAttribArray(prg.aVertexNormal);
	    gl.vertexAttribPointer(prg.aVertexColor, 4, gl.FLOAT, false, 0, 0);
	} else {
	    gl.bindBuffer(gl.ARRAY_BUFFER, this.nbo);
	    gl.enableVertexAttribArray(prg.aVertexNormal);
	    gl.disableVertexAttribArray(prg.aVertexColor);
	    gl.vertexAttribPointer(prg.aVertexNormal, 4, gl.FLOAT, false, 0, 0);
	}
	gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    };
}

function genLeaf(arg) {
    var leaf = new Leaf(arg);
    leaves.push(leaf);
    return leaf;
}
