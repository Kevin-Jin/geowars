var squareSize = 6;
var colors = [ 'red', 'blue' ];
var names = [ 'Red', 'Blue' ];

var Controller = function($canvas, model) {
	var controller = this;
	controller.mousePos = [ -1, -1 ];
	controller.mouseBtn = [ false, false, false ];
	controller.mouseWhl = 0;
	controller.zoom = 0;
	controller.pan = [ 0, 0 ];
	controller.lmbStart = null;
	controller.rmbStart = null;
	controller.hoverSquare = null;

	$(document).on('mousemove', function(e) {
		var rect = $canvas[0].getBoundingClientRect();
		controller.mousePos[0] = e.clientX - rect.left - parseInt($canvas.css('border-left-width')) - parseInt($canvas.css('padding-left'));
		controller.mousePos[0] *= $canvas[0].width / $canvas.width();
		controller.mousePos[1] = e.clientY - rect.top - parseInt($canvas.css('border-top-width')) - parseInt($canvas.css('padding-top'));
		controller.mousePos[1] *= $canvas[0].height / $canvas.height();
	});

	$canvas.on('contextmenu', function(e) {
		return false;
	});

	$canvas.on('mousedown', function(e) {
		controller.mouseBtn[e.which - 1] = true;
	});

	$(document).on('mouseup', function(e) {
		controller.mouseBtn[e.which - 1] = false;
	});

	var lineHeight = $('#lineheight').outerHeight();
	$canvas.on('wheel', function(e) {
		if (e.originalEvent.deltaMode == e.originalEvent.DOM_DELTA_LINE)
			controller.mouseWhl += e.originalEvent.deltaY * lineHeight;
		else if (e.originalEvent.deltaMode == e.originalEvent.DOM_DELTA_PIXEL)
			controller.mouseWhl += e.originalEvent.deltaY;
		e.preventDefault();
	});

	$('#newgame').on('click', function(e) {
		model.reset();
	});
};

Controller.prototype.endFrame = function() {
	this.mouseWhl = 0;
};

Controller.prototype.beginFrame = function($canvas, ctx, model) {
	var customCursor = false;
	if (this.mouseBtn[2]) {
		var pt = ctx.transformedPoint(this.mousePos);
		if (this.rmbStart == null) {
			this.rmbStart = pt;
		} else {
			this.pan[0] -= this.rmbStart[0] - pt[0];
			this.pan[1] -= this.rmbStart[1] - pt[1];
		}
		$canvas.css('cursor', 'grabbing');
		customCursor = true;
		ctx.setTransform(1 + this.zoom, 0, 0, 1 + this.zoom, this.pan[0], this.pan[1]);
	} else if (this.rmbStart != null) {
		var pt = ctx.transformedPoint(this.mousePos);
		this.pan[0] -= this.rmbStart[0] - pt[0];
		this.pan[1] -= this.rmbStart[1] - pt[1];
		this.rmbStart = null;
		ctx.setTransform(1 + this.zoom, 0, 0, 1 + this.zoom, this.pan[0], this.pan[1]);
	} else if (this.mouseWhl != 0) {
		var pt = ctx.transformedPoint(this.mousePos);
		var unscaledPan = [ this.pan[0] + pt[0] * this.zoom, this.pan[1] + pt[1] * this.zoom ];
		this.zoom = Math.max(Math.min(this.zoom - this.mouseWhl / 320, 2), 0);
		this.pan[0] = -this.zoom * pt[0] + unscaledPan[0];
		this.pan[1] = -this.zoom * pt[1] + unscaledPan[1];
		$canvas.css('cursor', this.mouseWhl < 0 ? 'zoom-in' : 'zoom-out');
		customCursor = true;
		ctx.setTransform(1 + this.zoom, 0, 0, 1 + this.zoom, this.pan[0], this.pan[1]);
	}

	var pt = ctx.transformedPoint(this.mousePos);
	var i = Math.floor(pt[0] / squareSize);
	var j = Math.floor(pt[1] / squareSize);
	if (i >= 0 && j >= 0 && i < gridWidth && j < gridHeight && !model.gameOver()) {
		model.updateCandidate([ i, j ]);
		this.hoverSquare = [ i, j ];
		if (!customCursor)
			$canvas.css('cursor', 'pointer');
	} else {
		model.updateCandidate(null);
		this.hoverSquare = null;
		if (!customCursor)
			$canvas.css('cursor', 'grab');
	}

	if (this.mouseBtn[0]) {
		if (this.lmbStart == null)
			this.lmbStart = model.candidate;
	} else if (this.lmbStart != null) {
		if (model.candidate[0] == this.lmbStart[0] && model.candidate[1] == this.lmbStart[1])
			model.selectCandidate();
		this.lmbStart = null;
	}
};

var View = function() {
	this.gameEnd = -1;
};

View.prototype.makeCameraInvertible = function(ctx) {
	var xform = new Affine2d();
	var saveStack = [];

	var baseSetTransform = ctx.setTransform;
	ctx.setTransform = function(a, b, c, d, e, f){
		xform.set(a, b, c, d, e, f);
		return baseSetTransform.call(ctx, a, b, c, d, e, f);
	};

	var baseSave = ctx.save;
	ctx.save = function() {
		saveStack.push(xform.get());
		baseSave.call(ctx);
	};

	var baseRestore = ctx.restore;
	ctx.restore = function() {
		baseRestore.call(ctx);
		ctx.setTransform.apply(ctx, saveStack.pop());
	};

	ctx.transformedPoint = function(p) {
		return xform.inverse().multiply(p);
	};
};

View.prototype.render = function($canvas, ctx, model, controller) {
	function renderSequence(last, now) {
		if (now[0] == last[0]) {
			// Vertical sequence of blocks.
			if (now[1] > last[1])
				ctx.rect(ctx.lineWidth + last[0] * squareSize, ctx.lineWidth + (last[1] + 1) * squareSize, squareSize - ctx.lineWidth, (now[1] - last[1]) * squareSize - ctx.lineWidth);
			else
				ctx.rect(ctx.lineWidth + now[0] * squareSize, ctx.lineWidth + now[1] * squareSize, squareSize - ctx.lineWidth, (last[1] - now[1]) * squareSize - ctx.lineWidth);
		} else if (now[1] == last[1]) {
			// Horizontal sequence of blocks.
			if (now[0] > last[0])
				ctx.rect(ctx.lineWidth + (last[0] + 1) * squareSize, ctx.lineWidth + last[1] * squareSize, (now[0] - last[0]) * squareSize - ctx.lineWidth, squareSize - ctx.lineWidth);
			else
				ctx.rect(ctx.lineWidth + now[0] * squareSize, ctx.lineWidth + now[1] * squareSize, (last[0] - now[0]) * squareSize - ctx.lineWidth, squareSize - ctx.lineWidth);
		} else if (now[0] - last[0] == now[1] - last[1]) {
			// Diagonal sequence of blocks.
			for (var j = now[0] - last[0], inc = now[0] > last[0] ? -1 : +1; j != 0; j += inc)
				ctx.rect(ctx.lineWidth + (last[0] + j) * squareSize, ctx.lineWidth + (last[1] + j) * squareSize, squareSize - ctx.lineWidth, squareSize - ctx.lineWidth);
		} else if (now[0] - last[0] == -(now[1] - last[1])) {
			// Diagonal sequence of blocks.
			for (var j = now[0] - last[0], inc = now[0] > last[0] ? -1 : +1; j != 0; j += inc)
				ctx.rect(ctx.lineWidth + (last[0] + j) * squareSize, ctx.lineWidth + (last[1] - j) * squareSize, squareSize - ctx.lineWidth, squareSize - ctx.lineWidth);
		}
	}

	function renderSquare(last) {
		ctx.moveTo(ctx.lineWidth / 2 + (last[0] + 0) * squareSize, ctx.lineWidth / 2 + (last[1] + 0) * squareSize);
		ctx.lineTo(ctx.lineWidth / 2 + (last[0] + 0) * squareSize, ctx.lineWidth / 2 + (last[1] + 1) * squareSize);
		ctx.lineTo(ctx.lineWidth / 2 + (last[0] + 1) * squareSize, ctx.lineWidth / 2 + (last[1] + 1) * squareSize);
		ctx.lineTo(ctx.lineWidth / 2 + (last[0] + 1) * squareSize, ctx.lineWidth / 2 + (last[1] + 0) * squareSize);
		ctx.lineTo(ctx.lineWidth / 2 + (last[0] + 0) * squareSize, ctx.lineWidth / 2 + (last[1] + 0) * squareSize);
	}

	// Draw dead space.
	var topLeft = ctx.transformedPoint([ 0, 0 ]);
	var bottomRight = ctx.transformedPoint([ $canvas[0].width, $canvas[0].height ]);
	ctx.fillStyle = 'black';
	ctx.beginPath();
	ctx.rect(topLeft[0], topLeft[1], bottomRight[0] - topLeft[0], bottomRight[1] - topLeft[1]);
	ctx.fill();

	// Draw grid background.
	ctx.lineWidth = 1;
	ctx.fillStyle = '#A0522D';
	ctx.beginPath();
	ctx.rect(ctx.lineWidth, ctx.lineWidth, gridHeight * squareSize - ctx.lineWidth, gridWidth * squareSize - ctx.lineWidth);
	ctx.fill();

	// Color in squares.
	for (var player = 0; player < 2; player++) {
		var history = model.states[player];
		var last = history[0];
		ctx.fillStyle = colors[player];
		ctx.beginPath();
		ctx.rect(ctx.lineWidth + last[0] * squareSize, ctx.lineWidth + last[1] * squareSize, squareSize - ctx.lineWidth, squareSize - ctx.lineWidth);
		for (var i = 1; i < history.length; i++) {
			var now = history[i];
			renderSequence(last, now);
			last = now;
		}
		ctx.fill();
	}
	var last = model.gameOver() ? null : model.getCurrentPlayerLastMove();
	var now = model.candidate;
	var t = new Date().getTime();
	if (!model.gameOver() && now != null) {
		// Frequency is in blinks per second.
		// Transparency is clipped to 0 <= minAlpha <= alpha <= maxAlpha <= 1.
		var freq = 0.8, minAlpha = 0.25, maxAlpha = 1;
		// Any continuous non-negative periodic function will do, even sin(t)+1.
		ctx.globalAlpha = Math.abs(2 * (maxAlpha - minAlpha) * (t * freq % 1000 / 1000 - 0.5)) + minAlpha;
		if (now[2] == LEGAL)
			ctx.fillStyle = 'limegreen';
		else
			ctx.fillStyle = 'yellow';
		ctx.beginPath();
		renderSequence(last, now);
		ctx.fill();
		ctx.globalAlpha = 1;
	}

	ctx.strokeStyle = '#8B4513';
	// Draw horizontal grid lines.
	for (var i = 0; i <= gridHeight; i++) {
		ctx.beginPath();
		ctx.moveTo(0, ctx.lineWidth / 2 + i * squareSize);
		ctx.lineTo(ctx.lineWidth + squareSize * gridWidth, ctx.lineWidth / 2 + i * squareSize);
		ctx.stroke();
	}
	// Draw vertical grid lines.
	for (var j = 0; j <= gridWidth; j++) {
		ctx.beginPath();
		ctx.moveTo(ctx.lineWidth / 2 + j * squareSize, 0);
		ctx.lineTo(ctx.lineWidth / 2 + j * squareSize, ctx.lineWidth + squareSize * gridHeight);
		ctx.stroke();
	}

	if (!model.gameOver()) {
		// Frequency is in blinks per second.
		// Transparency is clipped to 0 <= minAlpha <= alpha <= maxAlpha <= 1.
		var freq = 0.8, minAlpha = 0.25, maxAlpha = 1;
		// Any continuous non-negative periodic function will do, even sin(t)+1.
		ctx.globalAlpha = Math.abs(2 * (maxAlpha - minAlpha) * (t * freq % 1000 / 1000 - 0.5)) + minAlpha;
		ctx.strokeStyle = 'white';
		ctx.beginPath();
		renderSquare(last);
		ctx.stroke();
		ctx.globalAlpha = 1;
	} else {
		ctx.strokeStyle = 'white';
		ctx.beginPath();
		renderSquare(model.getPlayerLastMove(0));
		ctx.stroke();
		ctx.beginPath();
		renderSquare(model.getPlayerLastMove(1));
		ctx.stroke();

		var freeze = 2000, fadeOut = 500, initAlpha = 0.5;
		var text = 'Game over!';
		if (this.gameEnd == -1)
			this.gameEnd = t;
		if (t < this.gameEnd + freeze + fadeOut) {
			ctx.save();
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			if (t < this.gameEnd + freeze)
				ctx.globalAlpha = initAlpha;
			else
				ctx.globalAlpha = initAlpha * (fadeOut - (t - this.gameEnd - freeze)) / fadeOut;

			ctx.fillStyle = 'white';
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(0, $canvas[0].height);
			ctx.lineTo($canvas[0].width, $canvas[0].height);
			ctx.lineTo($canvas[0].width, 0);
			ctx.lineTo(0, 0);
			ctx.fill();

			ctx.font = 'bold 25px sans-serif';
			ctx.fillStyle = 'black';
			var metrics = ctx.measureText(text);
			ctx.fillText(text, ($canvas[0].width - metrics.width) / 2, ($canvas[0].height) / 2);

			ctx.globalAlpha = 1;
			ctx.restore();
		}
	}

	switch (now ? now[2] : -1) {
		case LEGAL:
			$('#tip').html('You are drawing a ray of length ' + Math.max(Math.abs(now[0] - last[0]), Math.abs(now[1] - last[1])));
			break;
		case ILL_BLOCKED:
			$('#tip').html('You cannot intersect another ray');
			break;
		case ILL_DIAGONAL:
			$('#tip').html('You cannot make more than two diagonal moves');
			break;
		case ILL_DIRECTION:
			$('#tip').html('You cannot make a move in that direction');
			break;
		case -1:
			if (model.gameOver())
				$('#tip').html(names[-model.turn - 1] + ' won the game!');
			else
				$('#tip').html('&nbsp;');
			break;
	}
};

$(document).ready(function() {
	var $canvas = $('#game');
	var model = new Model();
	var view = new View();
	var controller = new Controller($canvas, model);

	var ctx = $canvas[0].getContext('2d');
	view.makeCameraInvertible(ctx);

	window.requestAnimationFrame = window.requestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.msRequestAnimationFrame;
	(function gameLoop() {
		controller.beginFrame($canvas, ctx, model);
		view.render($canvas, ctx, model, controller);
		controller.endFrame();
		requestAnimationFrame(gameLoop);
	})();
});