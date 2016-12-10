var Controller = function($canvas, model, view) {
	var controller = this;
	controller.mousePos = [ -1, -1 ];
	controller.mouseBtn = [ false, false, false ];
	controller.mouseWhl = 0;
	controller.zoom = 0;
	controller.pan = [ 0, 0 ];
	controller.lmbStart = null;
	controller.rmbStart = null;
	controller.hoverSquare = null;

	// Listen on mouse events and store the most recent states for beginFrame()
	//  to grab.
	$(document).on('mousemove', function(e) {
		var rect = $canvas[0].getBoundingClientRect();
		controller.mousePos[0] = e.clientX - rect.left - parseInt($canvas.css('border-left-width')) - parseInt($canvas.css('padding-left'));
		controller.mousePos[0] *= $canvas[0].width / $canvas.width();
		controller.mousePos[1] = e.clientY - rect.top - parseInt($canvas.css('border-top-width')) - parseInt($canvas.css('padding-top'));
		controller.mousePos[1] *= $canvas[0].height / $canvas.height();
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
	// Prevent menu from showing on right click.
	$canvas.on('contextmenu', function(e) {
		return false;
	});

	// Keyboard controls for raw drawing. Controlled radially to reduce number
	//  of keystrokes needed: W to extend ray, S to retract ray, D to rotate ray
	//  clockwise around current position, A to rotate ray counterclockwise
	//  around current position, space to select.
	$(document).on('keypress', function(e) {
		// Don't take controls if game is over or a text box/button is in focus.
		if (model.gameOver() || $('*:focus').length)
			return;

		var last = model.getPlayerLastMove();
		var dir = model.getRayDirection();
		var now = model.candidate;
		switch (e.which) {
			case 'w'.charCodeAt(0):
			case 'W'.charCodeAt(0):
				if (model.getRayLength() >= Math.max(last[0], last[1], gridWidth - 1 - last[0], gridWidth - 1 - last[1]))
					return;
				switch (dir) {
					case DIR_NONE:
						model.candidate = [ now[0], now[1] - 1 ];
						break;
					case DIR_VERTICAL:
						model.candidate = [ now[0], now[1] + Math.sign(now[1] - last[1]) ];
						break;
					case DIR_HORIZONTAL:
						model.candidate = [ now[0] + Math.sign(now[0] - last[0]), now[1] ];
						break;
					case DIR_RDIAGONAL:
					case DIR_LDIAGONAL:
						model.candidate = [ now[0] + Math.sign(now[0] - last[0]), now[1] + Math.sign(now[1] - last[1]) ];
						break;
				}
				model.candidate[2] = model.checkLegality();
				break;
			case 's'.charCodeAt(0):
			case 'S'.charCodeAt(0):
				switch (dir) {
					case DIR_NONE:
						model.candidate = [ now[0], now[1] + 1 ];
						break;
					case DIR_VERTICAL:
						model.candidate = [ now[0], now[1] - Math.sign(now[1] - last[1]) ];
						break;
					case DIR_HORIZONTAL:
						model.candidate = [ now[0] - Math.sign(now[0] - last[0]), now[1] ];
						break;
					case DIR_RDIAGONAL:
					case DIR_LDIAGONAL:
						model.candidate = [ now[0] - Math.sign(now[0] - last[0]), now[1] - Math.sign(now[1] - last[1]) ];
						break;
				}
				model.candidate[2] = model.checkLegality();
				break;
			case 'a'.charCodeAt(0):
			case 'A'.charCodeAt(0):
				switch (dir) {
					case DIR_NONE:
						model.candidate = [ now[0] - 1, now[1] ];
						break;
					case DIR_VERTICAL:
					case DIR_LDIAGONAL:
						model.candidate = [ now[0] + (now[1] - last[1]), now[1] ];
						break;
					case DIR_HORIZONTAL:
					case DIR_RDIAGONAL:
						model.candidate = [ now[0], now[1] - (now[0] - last[0]) ];
						break;
				}
				model.candidate[2] = model.checkLegality();
				break;
			case 'd'.charCodeAt(0):
			case 'D'.charCodeAt(0):
				switch (dir) {
					case DIR_NONE:
						model.candidate = [ now[0] + 1, now[1] ];
						break;
					case DIR_VERTICAL:
					case DIR_RDIAGONAL:
						model.candidate = [ now[0] - (now[1] - last[1]), now[1] ];
						break;
					case DIR_HORIZONTAL:
					case DIR_LDIAGONAL:
						model.candidate = [ now[0], now[1] + (now[0] - last[0]) ];
						break;
				}
				model.candidate[2] = model.checkLegality();
				break;
			case 'q'.charCodeAt(0):
			case 'Q'.charCodeAt(0):
				switch (dir) {
					case DIR_NONE:
						model.candidate = [ now[0] - 1, now[1] - 1 ];
						break;
				}
				model.candidate[2] = model.checkLegality();
				break;
			case 'e'.charCodeAt(0):
			case 'E'.charCodeAt(0):
				switch (dir) {
					case DIR_NONE:
						model.candidate = [ now[0] + 1, now[1] - 1 ];
						break;
				}
				model.candidate[2] = model.checkLegality();
				break;
			case 'z'.charCodeAt(0):
			case 'Z'.charCodeAt(0):
				switch (dir) {
					case DIR_NONE:
						model.candidate = [ now[0] - 1, now[1] + 1 ];
						break;
				}
				model.candidate[2] = model.checkLegality();
				break;
			case 'c'.charCodeAt(0):
			case 'C'.charCodeAt(0):
				switch (dir) {
					case DIR_NONE:
						model.candidate = [ now[0] + 1, now[1] + 1 ];
						break;
				}
				model.candidate[2] = model.checkLegality();
				break;
			case 'x'.charCodeAt(0):
			case 'X'.charCodeAt(0):
				switch (dir) {
					case DIR_NONE:
						model.candidate = [ now[0], now[1] + 1 ];
						break;
				}
				model.candidate[2] = model.checkLegality();
				break;
			case ' '.charCodeAt(0):
				model.selectCandidate();
				break;
			default:
				return;
		}
		return false;
	});

	// Handle new game workflow.
	$('#newgame').on('click', function(e) {
		// Initialize text boxes to current player names.
		for (var player = 0; player < model.states.length; player++)
			$('#enterplayername' + player).val(names[player]);
		// Play a transition.
		$('#overlay').fadeIn(200);
		// Focus on first player's name.
		$('#enterplayername0').select();
	});
	$('body').keyup(function(e) {
		// Hide the player names popup if ESC is pressed.
		if ($('#overlay').css('display') !== 'none' && e.keyCode === 27)
			$('#dimmer').trigger('click');
	});
	$('#dimmer').click(function() {
		// Hide the player names popup if the background is clicked.
		$('#overlay').fadeOut(100);
	});
	$('#nameform').on('submit', function(e) {
		// Reset the state, update player names, type out the reset countdown.
		view.reset();
		model.reset();

		for (var player = 0; player < model.states.length; player++) {
			names[player] = $('#enterplayername' + player).val();
			$('#enterplayername' + player).blur();
			view.updateDomText('#playername' + player, names[player]);
			view.updateDomText('#clock' + player, model.getTime(player));
		}

		$('#overlay').fadeOut(100);
		return false;
	});

	// Handle bot/human toggle buttons.
	$('#redplayer').on('click', function(e) {
		if (model.bot[0]) {
			model.bot[0] = false;
			$('#redplayer').val('Human');
		} else {
			model.bot[0] = true;
			$('#redplayer').val('Bot');
		}
	});
	$('#blueplayer').on('click', function(e) {
		if (model.bot[1]) {
			model.bot[1] = false;
			$('#blueplayer').val('Human');
		} else {
			model.bot[1] = true;
			$('#blueplayer').val('Bot');
		}
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
	if (this.hoverSquare == null || i != this.hoverSquare[0] || j != this.hoverSquare[1]) {
		if (i >= 0 && j >= 0 && i < gridWidth && j < gridHeight && !model.gameOver())
			model.updateCandidate([ i, j ]);
		this.hoverSquare = [ i, j ];
	}
	if (!customCursor)
		$canvas.css('cursor', 'pointer');

	// If Bot is set choose position if your turn.
	if (model.bot[model.turn])
		this.lmbStart = model.botTurn(); //model.candidate;

	// Only Consider Clicks as input if not bot's turn.
	if (this.mouseBtn[0] && !model.bot[model.turn]) {
		if (this.lmbStart == null)
			this.lmbStart = model.candidate;
	} else if (this.lmbStart != null) {
		if (model.candidate[0] == this.lmbStart[0] && model.candidate[1] == this.lmbStart[1])
			model.selectCandidate();
		this.lmbStart = null;
	}
};
