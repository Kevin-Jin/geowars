var gridWidth = 100, gridHeight = 100;
var LEGAL = 0;
var ILL_BLOCKED = 1;
var ILL_DIAGONAL = 2;
var ILL_DIRECTION = 3;
var ILL_MIN = 4;
var ILL_OOB = 5;

var DIR_INVALID = -2;
var DIR_NONE = -1;
var DIR_VERTICAL = 0;
var DIR_HORIZONTAL = 1;
var DIR_RDIAGONAL = 2;
var DIR_LDIAGONAL = 3;

var Model = function() {
	// Min for continuing line.
	this.CONT_MIN = 10;
	this.DIAG_MAX = 2;
	this.TIME_LIMIT = 120;

	this.reset();
	// Create a dead game.
	this.turn = -(this.states.length + 1);
	this.states = [ [], [], ];

	// Initialize Player Mode.
	this.bot = [ false, false ];
};

Model.prototype.gameOver = function() {
	return this.turn < 0;
};

Model.prototype.saveScore = function() {
	// Save Winner.
	if (!this.bot[-this.turn - 1]) {
		/* UNCOMMENT IN PRODUCTION
		$.ajax({
			url: 'http://cims.nyu.edu/~by653/hps/dbman/saveScore.php',
			type: 'get',
			data: { gamename: 'Geowar', UserID: names[-this.turn - 1], score: 'WIN' },
			error: function(xhr) {
				console.log(xhr);
			}
		});*/
	}

	// Save Loser.
	if (!this.bot[this.turn + 2]) {
		/* UNCOMMENT IN PRODUCTION
		$.ajax({
			url: 'http://cims.nyu.edu/~by653/hps/dbman/saveScore.php',
			type: 'get',
			data: { gamename: 'Geowar', UserID: names[this.turn + 2], score: 'LOSE' },
			error: function(xhr) {
				console.log(xhr);
			}
		});*/
	}
};

Model.prototype.reset = function() {
	this.states = [ [ [ Math.floor(gridWidth / 2), Math.floor(gridHeight / 2) - 1] ], [ [ Math.floor(gridWidth / 2), Math.floor(gridHeight / 2)] ] ];
	this.turn = 0;
	this.candidate = null;
	this.diagonals = [ 0, 0 ];
	this.direction = [ DIR_NONE, DIR_NONE ];
	this.time = [ this.TIME_LIMIT, this.TIME_LIMIT ];
	this.lastTick = new Date().getTime();
	this.grid = [ ];
	for (var i = 0; i < gridHeight; i++) {
		this.grid[i] = [ ];
		for (var j = 0; j < gridWidth; j++)
			this.grid[i][j] = -1;
	}
	this.grid[this.states[0][0][1]][this.states[0][0][0]] = 0;
	this.grid[this.states[1][0][1]][this.states[1][0][0]] = 1;
};

Model.prototype.updateTime = function(t) {
	this.time[this.turn] -= (t - this.lastTick) / 1000;
	this.lastTick = t;

	// End game if time reaches 0.
	if (this.time[this.turn] <= 0) {
		this.time[this.turn] = 0;

		// Ajax query to save score.
		this.turn = -((this.turn + 1) % this.states.length + 1);
		this.saveScore();
	}
};

Model.prototype.getTime = function(p) {
	if (typeof p === 'undefined')
		p = this.turn;

	var remaining = Math.round(this.time[p]);
	return '0' + Math.floor(remaining / 60) + ':' + (remaining % 60 < 10 ? '0':'') + (remaining % 60);
};

Model.prototype.getPlayerLastMove = function(p) {
	if (typeof p === 'undefined')
		p = this.turn;

	return this.states[p].slice(-1)[0];
};

Model.prototype.getRayDirection = function(last, now) {
	last = last || this.getPlayerLastMove();
	now = now || this.candidate;
	if (now[0] == last[0] && now[1] == last[1])
		return DIR_NONE;
	else if (now[0] == last[0])
		return DIR_VERTICAL;
	else if (now[1] == last[1])
		return DIR_HORIZONTAL;
	else if (now[0] - last[0] == now[1] - last[1])
		return DIR_RDIAGONAL;
	else if (now[0] - last[0] == -(now[1] - last[1]))
		return DIR_LDIAGONAL;
	else
		return DIR_INVALID;
};

Model.prototype.getRayLength = function(last, now) {
	last = last || this.getPlayerLastMove();
	now = now || this.candidate;
	return Math.max(Math.abs(now[0] - last[0]), Math.abs(now[1] - last[1]));
};

Model.prototype.checkLegality = function() {
	if (this.gameOver())
		return false;

	var last = this.getPlayerLastMove();
	var now = this.candidate;
	var dir = this.getRayDirection(last, now);

	// Check if out of bounds for AI.
	if (now[0] < 0 || now[0] >= gridWidth || now[1] < 0 || now[1] >= gridHeight)
		return ILL_OOB;

	if (dir == DIR_NONE) {
		return ILL_BLOCKED;
	} else if (dir == DIR_VERTICAL) {
		for (var j = now[1] - last[1], inc = now[1] > last[1] ? -1 : +1; j != 0; j += inc)
			if (this.grid[last[1] + j][last[0]] != -1)
				return ILL_BLOCKED;
	} else if (dir == DIR_HORIZONTAL) {
		for (var j = now[0] - last[0], inc = now[0] > last[0] ? -1 : +1; j != 0; j += inc)
			if (this.grid[last[1]][last[0] + j] != -1)
				return ILL_BLOCKED;
	} else if (dir == DIR_RDIAGONAL) {
		for (var j = now[0] - last[0], inc = now[0] > last[0] ? -1 : +1; j != 0; j += inc)
			if (this.grid[last[1] + j][last[0] + j] != -1)
				return ILL_BLOCKED;

		if (this.diagonals[this.turn] >= this.DIAG_MAX)
			return ILL_DIAGONAL;
	} else if (dir == DIR_LDIAGONAL) {
		for (var j = now[0] - last[0], inc = now[0] > last[0] ? -1 : +1; j != 0; j += inc)
			if (this.grid[last[1] - j][last[0] + j] != -1)
				return ILL_BLOCKED;

		if (this.diagonals[this.turn] >= this.DIAG_MAX)
			return ILL_DIAGONAL;
	} else {
		return ILL_DIRECTION;
	}

	// Continuing line.
	if (this.direction[this.turn] == dir && this.getRayLength(last, now) < this.CONT_MIN)
		return ILL_MIN;

	return LEGAL;
};

Model.prototype.updateCandidate = function(hoverSquare) {
	var TOLERANCE = Math.PI / 8;

	if (hoverSquare == null || this.gameOver()) {
		this.candidate = null;
		return;
	}
	if (this.candidate != null && hoverSquare[0] == this.candidate[0] && hoverSquare[1] == this.candidate[1])
		return;

	var last = this.getPlayerLastMove();
	var angle = Math.atan2(last[0] - hoverSquare[0], last[1] - hoverSquare[1]);
	// Fuzzy matching. Set candidate to the valid ray that minimizes the
	//  perpendicular distance to hoverSquare.
	var dir = DIR_INVALID;
	if ((angle > +0 * Math.PI / 1 - TOLERANCE && angle < +0 * Math.PI / 1 + TOLERANCE) || (angle > +1 * Math.PI / 1 - TOLERANCE || angle < -1 * Math.PI / 1 + TOLERANCE)) {
		dir = DIR_VERTICAL;
		this.candidate = [ last[0], hoverSquare[1] ];
	} else if ((angle > +1 * Math.PI / 2 - TOLERANCE && angle < +1 * Math.PI / 2 + TOLERANCE) || (angle > -1 * Math.PI / 2 - TOLERANCE && angle < -1 * Math.PI / 2 + TOLERANCE)) {
		dir = DIR_HORIZONTAL;
		this.candidate = [ hoverSquare[0], last[1] ];
	} else if ((angle > +1 * Math.PI / 4 - TOLERANCE && angle < +1 * Math.PI / 4 + TOLERANCE) || (angle > -3 * Math.PI / 4 - TOLERANCE && angle < -3 * Math.PI / 4 + TOLERANCE)) {
		dir = DIR_RDIAGONAL;
		// Intersection of diagonal through last and and anti-diagonal through hoverSquare.
		var hIntersectY = hoverSquare[1];
		var yDist = hIntersectY - last[1];
		var hIntersectX = last[0] + yDist;
		var legDist = Math.floor((hoverSquare[0] - hIntersectX) / 2);
		// hIntersectX + legDist >= 0 && hIntersectX + legDist < gridWidth
		//  && hIntersectY + legDist >= 0 && hIntersectY + legDist < gridHeight
		// <=> legDist >= 0 - hIntersectX && legDist >= 0 - hIntersectY
		//  && legDist <= gridWidth - hIntersectX - 1
		//  && legDist <= gridHeight - hIntersectY - 1
		legDist = Math.max(legDist, 0 - hIntersectX, 0 - hIntersectY);
		legDist = Math.min(legDist, gridWidth - hIntersectX - 1, gridHeight - hIntersectY - 1);
		this.candidate = [ hIntersectX + legDist, hIntersectY + legDist ];
	} else if ((angle > -1 * Math.PI / 4 - TOLERANCE && angle < -1 * Math.PI / 4 + TOLERANCE) || (angle > +3 * Math.PI / 4 - TOLERANCE && angle < +3 * Math.PI / 4 + TOLERANCE)) {
		dir = DIR_LDIAGONAL;
		// Intersection of anti-diagonal through last and diagonal through hoverSquare.
		var hIntersectY = hoverSquare[1];
		var yDist = hIntersectY - last[1];
		var hIntersectX = last[0] - yDist;
		var legDist = Math.floor((hoverSquare[0] - hIntersectX) / 2);
		// hIntersectX + legDist >= 0 && hIntersectX + legDist < gridWidth
		//  && hIntersectY - legDist >= 0 && hIntersectY - legDist < gridHeight
		// <=> legDist >= 0 - hIntersectX && legDist >= -gridHeight + hIntersectY + 1
		//  && legDist <= 0 + hIntersectY && legDist <= gridWidth - hIntersectX - 1
		legDist = Math.max(legDist, 0 - hIntersectX, -gridHeight + hIntersectY + 1);
		legDist = Math.min(legDist, 0 + hIntersectY, gridWidth - hIntersectX - 1);
		this.candidate = [ hIntersectX + legDist, hIntersectY - legDist ];
	} else {
		this.candidate = null;
		return;
	}

	if (this.getRayLength(last) != 0 && this.getRayDirection(last) != dir) {
		console.log(this.getRayDirection(last) + " " + dir);
		throw new Error('Assert failed: this.getRayDirection() != dir');
	}

	this.candidate[2] = this.checkLegality();
};

Model.prototype.selectCandidate = function() {
	function hasValidMove(model) {
		var last = model.getPlayerLastMove();
		for (var dx = -1; dx <= +1; dx++) {
			if (last[0] + dx < 0 || last[0] + dx >= gridWidth)
				continue;

			for (var dy = -1; dy <= +1; dy++) {
				if (dx == 0 && dy == 0)
					continue;
				if (last[1] + dy < 0 || last[1] + dy >= gridHeight)
					continue;

				model.candidate = [ last[0] + dx, last[1] + dy ];
				if (model.getRayDirection(last) == model.direction[model.turn]) {
					if (last[0] + dx * model.CONT_MIN < 0 || last[0] + dx * model.CONT_MIN >= gridWidth || last[1] + dy * model.CONT_MIN < 0 || last[1] + dy * model.CONT_MIN >= gridHeight)
						continue;

					model.candidate = [ last[0] + dx * model.CONT_MIN, last[1] + dy * model.CONT_MIN ];
				}
				if (model.checkLegality() == LEGAL)
					return true;
			}
		}
		return false;
	}

	if (this.candidate == null || this.candidate[2] != LEGAL || this.gameOver())
		return false;

	var last = this.getPlayerLastMove();
	var now = this.candidate;
	var dir = this.getRayDirection(last, now);
	if (dir == DIR_VERTICAL) {
		for (var j = now[1] - last[1], inc = now[1] > last[1] ? -1 : +1; j != 0; j += inc)
			this.grid[last[1] + j][last[0]] = this.turn;
	} else if (dir == DIR_HORIZONTAL) {
		for (var j = now[0] - last[0], inc = now[0] > last[0] ? -1 : +1; j != 0; j += inc)
			this.grid[last[1]][last[0] + j] = this.turn;
	} else if (dir == DIR_RDIAGONAL) {
		this.diagonals[this.turn]++;
		for (var j = now[0] - last[0], inc = now[0] > last[0] ? -1 : +1; j != 0; j += inc)
			this.grid[last[1] + j][last[0] + j] = this.turn;
	} else if (dir == DIR_LDIAGONAL) {
		this.diagonals[this.turn]++;
		for (var j = now[0] - last[0], inc = now[0] > last[0] ? -1 : +1; j != 0; j += inc)
			this.grid[last[1] - j][last[0] + j] = this.turn;
	}

	this.direction[this.turn] = dir;
	this.states[this.turn].push(this.candidate);
	this.turn = (this.turn + 1) % this.states.length;

	if (!hasValidMove(this)) {
		this.turn = -((this.turn + 1) % this.states.length + 1);
		this.saveScore();
	}
	this.candidate = null;

	return true;
};
