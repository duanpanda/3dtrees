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
    vec4(0.9, 0.1, 0.1, 1.0),
    vec4(116/255, 23/255, 1.0, 1.0),
    vec4(0.1, 0.9, 0.1, 1.0),
    vec4(1.0, 0.0, 144/255, 1.0),
    vec4(1.0, 112/255, 112/255, 1.0)];
var coneShininess = 200.0;

var transform;
var camera;
var cameraInteractor;

const CAMERA_ORBIT_TYPE = 1;
const CAMERA_TRACKING_TYPE = 2;
var near = 0.2;
var far = 5000;
var fovy = 90;
var cameraHome = vec4(0.0, 1.0, 2.0, 1.0);

var maxNumCones = 5;
var cones = [];
var numTimesToSubdivide = 5;
var updateLightPosition = false;
var disableLighting = false;

function configure() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    camera = new Camera(CAMERA_ORBIT_TYPE);
    camera.goHome([0, 1, 2]);

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
    cones.push(new Cone(genNewConeData()));
}

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert( "WebGL isn't available"); }

    configure();
    initProgram();
    initLights();
    initObjData();

    document.getElementById("Button8").onclick = toggleLightPos;
    document.getElementById("Button1").onclick = toggleLighting;

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
	cone.updateRotation();
	newMVMatrix = cone.calcTransformMatrix(transform.mvMatrix);
	transform.setMVMatrix(newMVMatrix);
	transform.setMatrixUniforms();
	transform.pop();
	cone.setLights();
	cone.redraw();
    }

    requestAnimFrame(render);
}

function updateTransforms() {
    transform.calculateModelView();
    displayMatrix(transform.mvMatrix);
    var p = {'fovy': fovy, 'aspect': canvas.width / canvas.height,
	     'near': near, 'far': far};
    transform.calculatePerspective(p);
}

function toggleLightPos() {
    updateLightPosition = !updateLightPosition;
    console.log('updateLightPosition =', updateLightPosition);
}

function toggleLighting() {
    disableLighting = !disableLighting;
    console.log('disableLighting =', disableLighting);
    document.getElementById('toggle-lighting').innerHTML =
	disableLighting ? 'Lighting Disabled' : 'Lighting Enagled';
}

function Cone(transformData) {
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
    this.scaleFactor = 1.0;
    this.tx = transformData.tx;
    this.ty = transformData.ty;
    this.S = scale3d(this.scaleFactor, this.scaleFactor, 1.0);
    this.R = mult(rotate(transformData.tx, [1, 0, 0]),
		  rotate(transformData.ty, [0, 1, 0]));
    this.drawMode = gl.TRIANGLE_FAN;
    this.calcNormals = function() {
	this.normals = [];
	var n;
	for (var i = 0; i < this.vertices.length; i++) {
	    n = vec4(this.vertices[i]);
	    n[3] = 0.0;
	    this.normals.push(n);
	}
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
	    x = 0.2 * Math.cos(theta * DEGREE_TO_RADIAN);
	    z = 0.2 * Math.sin(theta * DEGREE_TO_RADIAN);
	    p = vec4(x, 0, z, 1.0);
	    this.vertices.push(p);
	}
	this.calcNormals();

	gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vertices), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, this.nbo);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(this.normals), gl.STATIC_DRAW);

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
	var a = mat4();		// identity
	a = mult(mult(mult(a, m), this.R), this.S);
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
    this.getTransformData = function() {
	return transformData;
    };
    this.updateRotation = function() {
	var RX = rotate(transformData.tx, [1, 0, 0]);
	var RY = rotate(transformData.ty, [0, 1, 0]);
	this.R = mult(RY, RX);
    };
};

function genNewConeData() {
    // return {'tx': getRandomInt(0, 360), 'ty': getRandomInt(0, 360)};
    return {'tx': -40, 'ty': 0};
}
