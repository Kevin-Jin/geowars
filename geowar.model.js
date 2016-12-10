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
	// Minimum length of continuing line, in squares.
	this.CONT_MIN = 10;
	// Maximum number of diagonal rays each player can draw.
	this.DIAG_MAX = 2;
	// Countdown clock timeout, in seconds.
	this.TIME_LIMIT = 120;

	this.reset();
	// Initialize the game to the untouched state.
	this.turn = -(this.states.length + 1);
	// Candidate should benull whenever the game is inactive.
	this.candidate = null;
	// Don't fill in any squares for an untouched game.
	this.states = [ [], [], ];
	// Initialize player mode out of reset() so that New Game keeps the setting.
	this.bot = [ false, false ];
};

Model.prototype.gameOver = function() {
	// If this.turn is negative, then -(this.turn + 1) is the winning player.
	return this.turn < 0;
};

Model.prototype.isUntouched = function() {
	// Sentinel value that is not a valid winning player.
	return this.turn == -(this.states.length + 1);
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
	// Start the two players in the middle of the grid.
	this.states = [ [ [ Math.floor(gridWidth / 2), Math.floor(gridHeight / 2) - 1] ], [ [ Math.floor(gridWidth / 2), Math.floor(gridHeight / 2)] ] ];
	this.turn = 0;
	// Candidate should never be null while game is in play. Default it to the
	//  previous move made by the player at the start of every turn but be sure
	//  to copy rather than alias the move to avoid corrupting this.states.
	this.candidate = this.getPlayerLastMove().slice(0, 2);
	// Initialize the number of diagonal rays drawn for each player.
	this.diagonals = [ 0, 0 ];
	// Initialize the continuing ray state.
	this.direction = [ DIR_NONE, DIR_NONE ];
	// Initialize the countdown clock for each player.
	this.time = [ this.TIME_LIMIT, this.TIME_LIMIT ];
	this.lastTick = new Date().getTime();
	// Initialize an empty grid and set the starting positions of each player.
	this.grid = [ ];
	for (var i = 0; i < gridHeight; i++) {
		this.grid[i] = [ ];
		for (var j = 0; j < gridWidth; j++)
			this.grid[i][j] = -1;
	}
	this.grid[this.states[0][0][1]][this.states[0][0][0]] = 0;
	this.grid[this.states[1][0][1]][this.states[1][0][0]] = 1;
};

Model.prototype.playerLost = function() {
	// Set this.turn = -1 if this.turn == 0.
	// Set this.turn = -2 if this.turn == -1.
	this.turn = -((this.turn + 1) % this.states.length + 1);
	// Candidate should be null whenever the game is inactive.
	this.candidate = null;
	this.saveScore();
};

Model.prototype.updateTime = function(t) {
	// Remaining time is in seconds, t and this.lastTick is in milliseconds.
	this.time[this.turn] -= (t - this.lastTick) / 1000;
	this.lastTick = t;

	// End game if time reaches 0.
	if (this.time[this.turn] <= 0) {
		this.time[this.turn] = 0;
		this.playerLost();
	}
};

Model.prototype.getTime = function(p) {
	// Default p to this.turn if calling this.getTime() with no arguments.
	if (typeof p === 'undefined')
		p = this.turn;

	// Format countdown clock in mm:ss, padded by zeros and with no fraction.
	var remaining = Math.round(this.time[p]);
	return '0' + Math.floor(remaining / 60) + ':' + (remaining % 60 < 10 ? '0':'') + (remaining % 60);
};

Model.prototype.getPlayerLastMove = function(p) {
	// Default p to this.turn if calling this.getPlayerLastMove() with no arguments.
	if (typeof p === 'undefined')
		p = this.turn;

	return this.states[p].slice(-1)[0];
};

Model.prototype.getRayDirection = function(last, now) {
	// Default last to this.getPlayerLastMove() if calling this.getRayDirection() with no arguments.
	last = last || this.getPlayerLastMove();
	// Default now to this.candidate() if calling this.getRayDirection() with fewer than 2 arguments.
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
	// Default last to this.getPlayerLastMove() if calling this.getRayLength() with no arguments.
	last = last || this.getPlayerLastMove();
	// Default now to this.candidate() if calling this.getRayLength() with fewer than 2 arguments.
	now = now || this.candidate;
	// Under a legal move, either both are equal to each other or one is 0.
	return Math.max(Math.abs(now[0] - last[0]), Math.abs(now[1] - last[1]));
};

Model.prototype.checkLegality = function() {
	if (this.gameOver())
		return false;

	var last = this.getPlayerLastMove();
	var now = this.candidate;
	var dir = this.getRayDirection(last, now);

	// Check if candidate is out of bounds.
	if (now[0] < 0 || now[0] >= gridWidth || now[1] < 0 || now[1] >= gridHeight)
		return ILL_OOB;

	// Check if candidate violates the ray intersection restriction.
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

		// Check if candidate violates the diagonal ray restriction.
		if (this.diagonals[this.turn] >= this.DIAG_MAX)
			return ILL_DIAGONAL;
	} else if (dir == DIR_LDIAGONAL) {
		for (var j = now[0] - last[0], inc = now[0] > last[0] ? -1 : +1; j != 0; j += inc)
			if (this.grid[last[1] - j][last[0] + j] != -1)
				return ILL_BLOCKED;

		// Check if candidate violates the diagonal ray restriction.
		if (this.diagonals[this.turn] >= this.DIAG_MAX)
			return ILL_DIAGONAL;
	} else {
		return ILL_DIRECTION;
	}

	// Check if candidate violates the continuing ray restriction.
	if (this.direction[this.turn] == dir && this.getRayLength(last, now) < this.CONT_MIN)
		return ILL_MIN;

	return LEGAL;
};

Model.prototype.updateCandidate = function(hoverSquare) {
	var TOLERANCE = Math.PI / 8;

	if (this.gameOver()) {
		this.candidate = null;
		return;
	}
	// If mouse has not been moved, no need to perform any calculations.
	if (hoverSquare[0] == this.candidate[0] && hoverSquare[1] == this.candidate[1])
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

	// Make sure all our logic is consistent.
	if (this.getRayLength(last) != 0 && this.getRayDirection(last) != dir) {
		console.log(this.getRayDirection(last) + " " + dir);
		throw new Error('Assert failed: this.getRayDirection() != dir');
	}

	// this.selectCandidate() will check the legality flag on the candidate
	//  before it draws a ray.
	this.candidate[2] = this.checkLegality();
};

Model.prototype.selectCandidate = function() {
	// Helper method that returns false if the current player has lost.
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

	// Refuse to select the candidate if it is not a legal move.
	if (this.gameOver() || this.candidate[2] != LEGAL)
		return false;

	// Keep track of grid so we can check for ray intersections without having
	//  to rebuild the grid from this.states every time.
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

	// Save the direction made in this ray draw to check for continuing rays.
	this.direction[this.turn] = dir;
	this.states[this.turn].push(this.candidate);
	this.turn = (this.turn + 1) % this.states.length;

	// End the game or reset the candidate for the next player.
	if (!hasValidMove(this))
		this.playerLost();
	else
		this.candidate = this.getPlayerLastMove().slice(0, 2);

	return true;
};
