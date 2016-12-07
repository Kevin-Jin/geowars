var Affine2d = function() {
	this.m = [
		// scale x, shear y, translate x
		[ 1, 0, 0 ],
		// shear x, scale y, translate y
		[ 0, 1, 0 ],
		// Last row of identity
		[ 0, 0, 1 ]
	];
};

Affine2d.prototype.set = function(scaleX, shearY, shearX, scaleY, translateX, translateY) {
	var m = this.m;
	m[0][0] = scaleX;
	m[0][1] = shearY;
	m[1][0] = shearX;
	m[1][1] = scaleY;
	m[0][2] = translateX;
	m[1][2] = translateY;
};

Affine2d.prototype.get = function() {
	var m = this.m;
	return [ m[0][0], m[0][1], m[1][0], m[1][1], m[0][2], m[1][2] ];
};

Affine2d.prototype.det = function() {
	// Sarrus' rule
	var a = this.m;
	return (
		+ a[0][0] * a[1][1] * a[2][2] + a[0][1] * a[1][2] * a[2][0] + a[0][2] * a[1][0] * a[2][1]
		- a[2][0] * a[1][1] * a[0][2] - a[2][1] * a[1][2] * a[1][1] - a[2][2] * a[1][0] * a[0][1]
	);
};

Affine2d.prototype.inverse = function() {
	function det2(a) {
		return a[0][0] * a[1][1] - a[0][1] * a[1][0];
	}

	var m = this.m;
	var d = this.det();

	// Inverse by adjugate matrix.
	var u = new Affine2d();
	// Transpose of cofactors of m divided by determinant of m.
	u.m[0][0] = det2([ [ m[1][1], m[1][2] ], [ m[2][1], m[2][2] ] ]) / d;
	u.m[0][1] = det2([ [ m[0][2], m[0][1] ], [ m[2][2], m[2][1] ] ]) / d;
	u.m[0][2] = det2([ [ m[0][1], m[0][2] ], [ m[1][1], m[1][2] ] ]) / d;
	u.m[1][0] = det2([ [ m[1][2], m[1][0] ], [ m[2][2], m[2][0] ] ]) / d;
	u.m[1][1] = det2([ [ m[0][0], m[0][2] ], [ m[2][0], m[2][2] ] ]) / d;
	u.m[1][2] = det2([ [ m[0][2], m[0][0] ], [ m[1][2], m[1][0] ] ]) / d;
	u.m[2][0] = det2([ [ m[1][0], m[1][1] ], [ m[2][0], m[2][1] ] ]) / d;
	u.m[2][1] = det2([ [ m[0][1], m[0][0] ], [ m[2][1], m[2][0] ] ]) / d;
	u.m[2][2] = det2([ [ m[0][0], m[0][1] ], [ m[1][0], m[1][1] ] ]) / d;

	return u;
};

Affine2d.prototype.multiply = function(x) {
	// Homogeneous coordinates.
	if (x.length == 2)
		x[2] = 1;
	else if (x.length != 3)
		throw new Error('Affine2d supports only 2D coordinates');

	var m = this.m;
	return [
		m[0][0] * x[0] + m[0][1] * x[1] + m[0][2] * x[2],
		m[1][0] * x[0] + m[1][1] * x[1] + m[1][2] * x[2],
		m[2][0] * x[0] + m[2][1] * x[1] + m[2][2] * x[2]
	];
};
