function assert(condition, message) {
    if (!condition) {
	message = message || "Assertion failed";
	if (typeof Error !== "undefined") {
	    throw new Error(message);
	}
	throw message; // fallback
    }
}

// Return a random integer between min (included) and max (excluded).
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

// Return a random float between min (included) and max (excluded).
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function mat4_inverse(matrix) {
    var a = flatten(matrix);
    var b = a;
    var c=a[0], d=a[1], e=a[2], g=a[3], f=a[4], h=a[5], i=a[6], j=a[7], k=a[8],
	l=a[9], n=a[10], o=a[11], m=a[12], p=a[13], r=a[14], s=a[15], A=c*h-d*f,
	B=c*i-e*f, t=c*j-g*f, u=d*i-e*h, v=d*j-g*h, w=e*j-g*i, x=k*p-l*m,
	y=k*r-n*m, z=k*s-o*m, C=l*r-n*p, D=l*s-o*p, E=n*s-o*r,
	q=A*E-B*D+t*C+u*z-v*y+w*x;
    if (!q) return null;
    q=1/q;
    b[0]=(h*E-i*D+j*C)*q; b[1]=(-d*E+e*D-g*C)*q; b[2]=(p*w-r*v+s*u)*q;
    b[3]=(-l*w+n*v-o*u)*q; b[4]=(-f*E+i*z-j*y)*q; b[5]=(c*E-e*z+g*y)*q;
    b[6]=(-m*w+r*t-s*B)*q; b[7]=(k*w-n*t+o*B)*q; b[8]=(f*D-h*z+j*x)*q;
    b[9]=(-c*D+d*z-g*x)*q; b[10]=(m*v-p*t+s*A)*q; b[11]=(-k*v+l*t-o*A)*q;
    b[12]=(-f*C+h*y-i*x)*q; b[13]=(c*C-d*y+e*x)*q; b[14]=(-m*u+p*B-r*A)*q;
    b[15]=(k*u-l*B+n*A)*q;
    return mat4(vec4(b[0], b[4], b[8], b[12]),
		vec4(b[1], b[5], b[9], b[13]),
		vec4(b[2], b[6], b[10], b[14]),
		vec4(b[3], b[7], b[11], b[15]));
};

function mat4_multiplyVec4(m, b) {
    var c = vec3(b);
    var a = flatten(m);
    var d=b[0], e=b[1], f=b[2], g=b[3];
    c[0]=a[0]*d+a[4]*e+a[8]*f+a[12]*g;
    c[1]=a[1]*d+a[5]*e+a[9]*f+a[13]*g;
    c[2]=a[2]*d+a[6]*e+a[10]*f+a[14]*g;
    c[3]=a[3]*d+a[7]*e+a[11]*f+a[15]*g;
    return c;
}

function displayMatrix(m) {
    var fm = flatten(m);
    for (var i = 0; i < 16; i++) {
        var e = document.getElementById('m' + i);
        e.innerHTML = fm[i].toFixed(1);
    }
}

function logMatrix(m) {
    var s = '';
    for (var i = 0; i < 4; i++) {
	for (var j = 0; j < 3; j++) {
	    s += m[i][j].toFixed(1) + ' ';
	}
	if (i == 3) {
	    s += m[i][j].toFixed(1);
	} else {
	    s += m[i][j].toFixed(1) + '\n';
	}
    }
    console.log(s);
}

function vectorsAngle(u, v) {
    var a = Math.acos(dot(normalize(u), normalize(v)));
    return a * RADIAN_TO_DEGREE;
}

function calculateNormals(vs, ind){
    var x=0; 
    var y=1;
    var z=2;
    
    var ns = [];
    for(var i=0;i<vs.length;i++){ //for each vertex, initialize normal x, normal y, normal z
        ns[i]=0.0;
    }
    
    for(var i=0;i<ind.length;i=i+3){ //we work on triads of vertices to calculate normals so i = i+3 (i = indices index)
        var v1 = [];
        var v2 = [];
        var normal = [];
        //p1 - p0
        v1[x] = vs[3*ind[i+1]+x] - vs[3*ind[i]+x];
        v1[y] = vs[3*ind[i+1]+y] - vs[3*ind[i]+y];
        v1[z] = vs[3*ind[i+1]+z] - vs[3*ind[i]+z];
        // p0 - p1
        v2[x] = vs[3*ind[i+2]+x] - vs[3*ind[i+1]+x];
        v2[y] = vs[3*ind[i+2]+y] - vs[3*ind[i+1]+y];
        v2[z] = vs[3*ind[i+2]+z] - vs[3*ind[i+1]+z];            
        //p2 - p1
        // v1[x] = vs[3*ind[i+2]+x] - vs[3*ind[i+1]+x];
        // v1[y] = vs[3*ind[i+2]+y] - vs[3*ind[i+1]+y];
        // v1[z] = vs[3*ind[i+2]+z] - vs[3*ind[i+1]+z];
        // p0 - p1
        // v2[x] = vs[3*ind[i]+x] - vs[3*ind[i+1]+x];
        // v2[y] = vs[3*ind[i]+y] - vs[3*ind[i+1]+y];
        // v2[z] = vs[3*ind[i]+z] - vs[3*ind[i+1]+z];
        //cross product by Sarrus Rule
        normal[x] = v1[y]*v2[z] - v1[z]*v2[y];
        normal[y] = v1[z]*v2[x] - v1[x]*v2[z];
        normal[z] = v1[x]*v2[y] - v1[y]*v2[x];
        
        // ns[3*ind[i]+x] += normal[x];
        // ns[3*ind[i]+y] += normal[y];
        // ns[3*ind[i]+z] += normal[z];
        for(j=0;j<3;j++){ //update the normals of that triangle: sum of vectors
            ns[3*ind[i+j]+x] =  ns[3*ind[i+j]+x] + normal[x];
            ns[3*ind[i+j]+y] =  ns[3*ind[i+j]+y] + normal[y];
            ns[3*ind[i+j]+z] =  ns[3*ind[i+j]+z] + normal[z];
        }
    }
    //normalize the result
    for(var i=0;i<vs.length;i=i+3){ //the increment here is because each vertex occurs with an offset of 3 in the array (due to x, y, z contiguous values)
        
        var nn=[];
        nn[x] = ns[i+x];
        nn[y] = ns[i+y];
        nn[z] = ns[i+z];
        
        var len = Math.sqrt((nn[x]*nn[x])+(nn[y]*nn[y])+(nn[z]*nn[z]));
        if (len == 0) len = 0.00001;
        
        nn[x] = nn[x]/len;
        nn[y] = nn[y]/len;
        nn[z] = nn[z]/len;
        
        ns[i+x] = nn[x];
        ns[i+y] = nn[y];
        ns[i+z] = nn[z];
    }
    
    return ns;
}
