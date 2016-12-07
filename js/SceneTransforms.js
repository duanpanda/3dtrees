function SceneTransforms(c) {
    this.stack = [];
    this.camera = c;
    this.mvMatrix = null;	// The Model-View matrix
    this.pMatrix = null;	// The projection matrix
    this.nMatrix = null;	// The normal matrix
    this.init();
};

SceneTransforms.prototype.setMVMatrix = function(m) {
    this.mvMatrix = mat4(m[0], m[1], m[2], m[3]);
};

SceneTransforms.prototype.calculateModelView = function() {
    this.mvMatrix = this.camera.getViewTransform();
};

SceneTransforms.prototype.calculateNormal = function() {
    var m = this.mvMatrix;
    this.nMatrix = transpose(mat4_inverse(m));
};

SceneTransforms.prototype.init = function(){
    this.mvMatrix = mat4();
    var p = {'fovy': fovy, 'aspect': canvas.width / canvas.height,
	     'near': near, 'far': far};
    this.calculatePerspective(p);
    this.calculateNormal();
};

SceneTransforms.prototype.calculatePerspective = function(p) {
    // We can resize the screen at any point so the perspective matrix should
    // be updated always.
    this.pMatrix = perspective(p.fovy, p.aspect, p.near, p.far);
};

// Maps the matrices to shader matrix uniforms
// Called once per rendering cycle.
SceneTransforms.prototype.setMatrixUniforms = function() {
    this.calculateNormal();
    gl.uniformMatrix4fv(prg.uMVMatrix, false, flatten(this.mvMatrix));
    gl.uniformMatrix4fv(prg.uPMatrix, false, flatten(this.pMatrix));
    gl.uniformMatrix4fv(prg.uNMatrix, false, flatten(this.nMatrix));
};

SceneTransforms.prototype.push = function() {
    var memento = mat4(this.mvMatrix[0], this.mvMatrix[1], this.mvMatrix[2],
		       this.mvMatrix[3]);
    this.stack.push(memento);
};

SceneTransforms.prototype.pop = function() {
    if (this.stack.length == 0) return;
    this.mvMatrix = this.stack.pop();
};
