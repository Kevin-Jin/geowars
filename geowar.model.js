var gridWidth = 100, gridHeight = 100;
var LEGAL = 0;
var ILL_BLOCKED = 1;
var ILL_DIAGONAL = 2;
var ILL_DIRECTION = 3;

var Model = function() {
	this.reset();
};

Model.prototype.gameOver = function() {
	return this.turn < 0;
};

Model.prototype.reset = function() {
	this.states = [ [ [ Math.floor(gridWidth / 2), Math.floor(gridHeight / 2) ] ], [ [ Math.floor(gridWidth / 2), Math.floor(gridHeight / 2) + 1 ] ] ];
	this.turn = 0;
	this.candidate = null;
	this.diagonals = [ 0, 0 ];
	this.grid = [ ];
	for (var i = 0; i < gridHeight; i++) {
		this.grid[i] = [ ];
		for (var j = 0; j < gridWidth; j++)
			this.grid[i][j] = -1;
	}
	this.grid[this.states[0][0][1]][this.states[0][0][0]] = 0;
	this.grid[this.states[1][0][1]][this.states[1][0][0]] = 1;
};

Model.prototype.getPlayerLastMove = function(p) {
	return this.states[p].slice(-1)[0];
};

Model.prototype.getCurrentPlayerLastMove = function() {
	return this.getPlayerLastMove(this.turn);
};

Model.prototype.checkLegality = function() {
	if (this.gameOver())
		return false;

	var last = this.getCurrentPlayerLastMove();
	var now = this.candidate;
	if (now[0] == last[0] && now[1] == last[1]) {
		return ILL_BLOCKED;
	} else if (now[0] == last[0]) {
		// Vertical sequence of blocks.
		for (var j = now[1] - last[1], inc = now[1] > last[1] ? -1 : +1; j != 0; j += inc)
			if (this.grid[last[1] + j][last[0]] != -1)
				return ILL_BLOCKED;
	} else if (now[1] == last[1]) {
		// Horizontal sequence of blocks.
		for (var j = now[0] - last[0], inc = now[0] > last[0] ? -1 : +1; j != 0; j += inc)
			if (this.grid[last[1]][last[0] + j] != -1)
				return ILL_BLOCKED;
	} else if (now[0] - last[0] == now[1] - last[1]) {
		if (this.diagonals[this.turn] >= 2)
			return ILL_DIAGONAL;
		// Diagonal sequence of blocks.
		for (var j = now[0] - last[0], inc = now[0] > last[0] ? -1 : +1; j != 0; j += inc)
			if (this.grid[last[1] + j][last[0] + j] != -1)
				return ILL_BLOCKED;
	} else if (now[0] - last[0] == -(now[1] - last[1])) {
		if (this.diagonals[this.turn] >= 2)
			return ILL_DIAGONAL;
		// Diagonal sequence of blocks.
		for (var j = now[0] - last[0], inc = now[0] > last[0] ? -1 : +1; j != 0; j += inc)
			if (this.grid[last[1] - j][last[0] + j] != -1)
				return ILL_BLOCKED;
	} else {
		return ILL_DIRECTION;
	}
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

	var last = this.getCurrentPlayerLastMove();
	var angle = Math.atan2(last[0] - hoverSquare[0], last[1] - hoverSquare[1]);
	// Fuzzy matching. Set candidate to the valid ray that minimizes the
	//  perpendicular distance to hoverSquare.
	if ((angle > +0 * Math.PI / 1 - TOLERANCE && angle < +0 * Math.PI / 1 + TOLERANCE) || (angle > +1 * Math.PI / 1 - TOLERANCE || angle < -1 * Math.PI / 1 + TOLERANCE)) {
		// Vertical ray.
		this.candidate = [ last[0], hoverSquare[1] ];
	} else if ((angle > +1 * Math.PI / 2 - TOLERANCE && angle < +1 * Math.PI / 2 + TOLERANCE) || (angle > -1 * Math.PI / 2 - TOLERANCE && angle < -1 * Math.PI / 2 + TOLERANCE)) {
		// Horizontal ray.
		this.candidate = [ hoverSquare[0], last[1] ];
	} else if ((angle > +1 * Math.PI / 4 - TOLERANCE && angle < +1 * Math.PI / 4 + TOLERANCE) || (angle > -3 * Math.PI / 4 - TOLERANCE && angle < -3 * Math.PI / 4 + TOLERANCE)) {
		// Diagonal ray.
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
		// Anti-diagonal ray.
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

	this.candidate[2] = this.checkLegality();
};

Model.prototype.selectCandidate = function() {
	function hasValidMove(model) {
		var last = model.getCurrentPlayerLastMove();
		for (var dx = -1; dx <= +1; dx++) {
			if (last[0] + dx < 0 || last[0] + dx >= gridWidth)
				continue;

			for (var dy = -1; dy <= +1; dy++) {
				if (dx == 0 && dy == 0)
					continue;
				if (last[1] + dy < 0 || last[1] + dy >= gridHeight)
					continue;

				model.candidate = [ last[0] + dx, last[1] + dy ];
				if (model.checkLegality() == LEGAL)
					return true;
			}
		}
		return false;
	}

	if (this.candidate == null || this.candidate[2] != LEGAL || this.gameOver())
		return false;

	var last = this.getCurrentPlayerLastMove();
	var now = this.candidate;
	if (now[0] == last[0]) {
		// Vertical sequence of blocks.
		for (var j = now[1] - last[1], inc = now[1] > last[1] ? -1 : +1; j != 0; j += inc)
			this.grid[last[1] + j][last[0]] = this.turn;
	} else if (now[1] == last[1]) {
		// Horizontal sequence of blocks.
		for (var j = now[0] - last[0], inc = now[0] > last[0] ? -1 : +1; j != 0; j += inc)
			this.grid[last[1]][last[0] + j] = this.turn;
	} else if (now[0] - last[0] == now[1] - last[1]) {
		// Diagonal sequence of blocks.
		this.diagonals[this.turn]++;
		for (var j = now[0] - last[0], inc = now[0] > last[0] ? -1 : +1; j != 0; j += inc)
			this.grid[last[1] + j][last[0] + j] = this.turn;
	} else if (now[0] - last[0] == -(now[1] - last[1])) {
		// Diagonal sequence of blocks.
		this.diagonals[this.turn]++;
		for (var j = now[0] - last[0], inc = now[0] > last[0] ? -1 : +1; j != 0; j += inc)
			this.grid[last[1] - j][last[0] + j] = this.turn;
	}

	this.states[this.turn].push(this.candidate);
	this.turn = (this.turn + 1) % 2;

	if (!hasValidMove(this))
		this.turn = -((this.turn + 1) % 2 + 1);
	this.candidate = null;

	return true;
};
