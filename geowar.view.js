var squareSize = 6;
var colors = [ 'red', 'blue' ];
var names = [ 'Player 1', 'Player 2' ];

// TODO: highlight row and column of candidate
//  for better awareness of position relative
//  to opponent.
var View = function() {
	this.domTextHashes = {};
	this.reset();
};

View.prototype.reset = function() {
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

View.prototype.updateDomText = function(selector, newHtml) {
	function stringHash(str) {
		var hash = 0, len = str.length, i;
		for (i = 0, len = str.length; i < len; i++)
			hash = (hash * 31 + str.charCodeAt(i)) | 0;
		return hash;
	}

	var newHash = stringHash(newHtml);
	if (selector in this.domTextHashes && this.domTextHashes[selector] == newHash)
		return;

	$(selector).html(newHtml);
	this.domTextHashes[selector] = newHash;
};

View.prototype.render = function($canvas, ctx, model) {
	function renderSequence(last, now) {
		var dir = model.getRayDirection(last, now);
		if (dir == DIR_VERTICAL) {
			if (now[1] > last[1])
				ctx.rect(ctx.lineWidth + last[0] * squareSize, ctx.lineWidth + (last[1] + 1) * squareSize, squareSize - ctx.lineWidth, (now[1] - last[1]) * squareSize - ctx.lineWidth);
			else
				ctx.rect(ctx.lineWidth + now[0] * squareSize, ctx.lineWidth + now[1] * squareSize, squareSize - ctx.lineWidth, (last[1] - now[1]) * squareSize - ctx.lineWidth);
		} else if (dir == DIR_HORIZONTAL) {
			if (now[0] > last[0])
				ctx.rect(ctx.lineWidth + (last[0] + 1) * squareSize, ctx.lineWidth + last[1] * squareSize, (now[0] - last[0]) * squareSize - ctx.lineWidth, squareSize - ctx.lineWidth);
			else
				ctx.rect(ctx.lineWidth + now[0] * squareSize, ctx.lineWidth + now[1] * squareSize, (last[0] - now[0]) * squareSize - ctx.lineWidth, squareSize - ctx.lineWidth);
		} else if (dir == DIR_RDIAGONAL) {
			for (var j = now[0] - last[0], inc = now[0] > last[0] ? -1 : +1; j != 0; j += inc)
				ctx.rect(ctx.lineWidth + (last[0] + j) * squareSize, ctx.lineWidth + (last[1] + j) * squareSize, squareSize - ctx.lineWidth, squareSize - ctx.lineWidth);
		} else if (dir == DIR_LDIAGONAL) {
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
	ctx.fillStyle = '#191919';
	ctx.beginPath();
	ctx.rect(topLeft[0], topLeft[1], bottomRight[0] - topLeft[0], bottomRight[1] - topLeft[1]);
	ctx.fill();

	// Draw grid background.
	ctx.lineWidth = 1;
	ctx.fillStyle = 'black';
	ctx.beginPath();
	ctx.rect(ctx.lineWidth, ctx.lineWidth, gridHeight * squareSize - ctx.lineWidth, gridWidth * squareSize - ctx.lineWidth);
	ctx.fill();

	// Color in squares.
	if (model.turn != -(model.states.length + 1)) {
		for (var player = 0; player < model.states.length; player++) {
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
	}

	var last = model.gameOver() ? null : model.getPlayerLastMove();
	var now = model.candidate;
	var t = new Date().getTime();
	if (!model.gameOver() && now != null) {
		// Frequency is in blinks per second.
		// Transparency is clipped to 0 <= minAlpha <= alpha <= maxAlpha <= 1.
		var freq = 0.8, minAlpha = 0.25, maxAlpha = 1;
		// Any continuous non-negative periodic function will do, even sin(t)+1.
		ctx.globalAlpha = Math.abs(2 * (maxAlpha - minAlpha) * (t * freq % 1000 / 1000 - 0.5)) + minAlpha;
		if (now[2] == LEGAL)
			ctx.fillStyle = colors[model.turn];
		else
			ctx.fillStyle = 'yellow';
		ctx.beginPath();
		renderSequence(last, now);
		ctx.fill();
		ctx.globalAlpha = 1;
	}

	ctx.strokeStyle = '#0c0c0c';

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

		model.updateTime(t);
		this.updateDomText('#clock' + model.turn, model.getTime());
	} else {
		var text = 'Are you ready?';
		if (model.turn != -(model.states.length + 1)) {
			ctx.strokeStyle = 'white';
			ctx.beginPath();
			renderSquare(model.getPlayerLastMove(0));
			ctx.stroke();
			ctx.beginPath();
			renderSquare(model.getPlayerLastMove(1));
			ctx.stroke();
			text = 'Game over!';
		}

		var freeze = 2000, fadeOut = 500, initAlpha = 0.5;
		if (this.gameEnd == -1)
			if (model.turn == -(model.states.length + 1))
				this.gameEnd = Infinity;
			else
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
			this.updateDomText('#tip', 'You are drawing a ray of length ' + model.getRayLength(last, now));
			break;
		case ILL_BLOCKED:
			this.updateDomText('#tip', 'You cannot intersect another ray');
			break;
		case ILL_DIAGONAL:
			this.updateDomText('#tip', 'You cannot draw more than ' + model.DIAG_MAX + ' diagonal rays');
			break;
		case ILL_MIN:
			this.updateDomText('#tip', 'You cannot draw a continuing ray shorter than ' + model.CONT_MIN + ' squares long');
			break;
		case ILL_OOB:
			this.updateDomText('#tip', 'You cannot draw a ray that leaves the grid');
			break;
		case ILL_DIRECTION:
			this.updateDomText('#tip', 'You cannot draw a ray in that direction');
			break;
		case -1:
			if (model.gameOver())
				if (model.turn == -(model.states.length + 1))
					this.updateDomText('#tip', 'Please start a new game!');
				else
					this.updateDomText('#tip', names[-model.turn - 1] + ' won the game!');
			else
				this.updateDomText('#tip', '&nbsp;');
			break;
	}
};

$(document).ready(function() {
	var $canvas = $('#game');
	var model = new Model();
	var view = new View();
	var controller = new Controller($canvas, model, view);

	for (var player = 0; player < model.states.length; player++)
		view.updateDomText('#clock' + player, model.getTime(player));

	var ctx = $canvas[0].getContext('2d');
	view.makeCameraInvertible(ctx);

	window.requestAnimationFrame = window.requestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.msRequestAnimationFrame;
	(function gameLoop() {
		controller.beginFrame($canvas, ctx, model);
		view.render($canvas, ctx, model);
		controller.endFrame();
		requestAnimationFrame(gameLoop);
	})();
});
