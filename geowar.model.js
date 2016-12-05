var gridWidth = 100, gridHeight = 100;
var LEGAL = 0;
var ILL_BLOCKED = 1;
var ILL_DIAGONAL = 2;
var ILL_DIRECTION = 3;
var ILL_MIN = 4;

//Only used by AI
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
		this.turn = -((this.turn + 1) % this.states.length + 1);
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
	
	//Check if out of bounds: For AI
	if(now[0] < 0 || now[0] >= gridWidth || now[1] < 0 || now[1] >= gridHeight)
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

	if (!hasValidMove(this))
		this.turn = -((this.turn + 1) % this.states.length + 1);
	this.candidate = null;

	return true;
};

//Hyper-Aggressive AI
Model.prototype.botTurn = function() {
	
	//Last Position
	var last = this.getPlayerLastMove();
	
	//If first move of the game, move 1 direction right
	if(this.states[0].length == 1 && this.states[1].length == 1) {
		this.candidate = [ last[0] + 1, last[1], LEGAL ];
		return this.candidate;
	}
	
	var directions = [[1,0],[0,1],[-1,0],[0,-1]];
	
	//Consider diagonals
	if (this.diagonals[(this.turn + 1) % 2] < this.DIAG_MAX) {
		directions = directions.concat([[1,1],[-1,1],[1,-1],[-1,-1]]);
	}
	
	//Find all Valid moves of opponent
	var opponentMoves = {};
	
	var lastOpp = this.getPlayerLastMove((this.turn + 1) % 2);

	for(var dirInd in directions) {
		var direction = directions[dirInd];
		var tempPos = [lastOpp[0] + direction[0], lastOpp[1] + direction[1]];
		
		//Go in each direction
		while( tempPos[0] > 0 && tempPos[0] < gridWidth && tempPos[1] > 0 && tempPos[1] < gridHeight && this.grid[tempPos[1]][tempPos[0]] == -1) { //Free Space
			
			//Simple Hash
			opponentMoves[tempPos[0] + '-' + tempPos[1]] = true;
			
			//Update In direction
			tempPos[0] += direction[0];
			tempPos[1] += direction[1];
		}
	}
	
	//Readjust to my directions
	if(this.diagonals[this.turn] >= this.DIAG_MAX) 
		directions = [[1,0],[0,1],[-1,0],[0,-1]];
	
	//Shuffle Directions
	var shuffle = function(array) {
	  var currentIndex = array.length, temporaryValue, randomIndex;

	  //While there remain elements to shuffle...
	  while (0 !== currentIndex) {
		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	  }

	  return array;
	}
	
	directions = shuffle(directions);
	
	var mostBlocked = -1;
	var best = [];
	var bestDist = gridHeight + 1; //Unreachable Value
	
	//Go over my directions
	for(var dirInd in directions) {
		var direction = directions[dirInd];
		
		this.candidate = [last[0] + direction[0], last[1] + direction[1]];
		
		if(this.checkLegality() == ILL_MIN) // If Continuing Line, jump by min dist
			this.candidate = [last[0] + this.CONT_MIN * direction[0], last[1] + this.CONT_MIN * direction[1]]; 
		
		var blocked = 0;
		
		//Go in each direction
		while( this.checkLegality() == LEGAL) { //IF LEGAL
		
			var moveHash = this.candidate[0] + '-' + this.candidate[1];
			
			if(moveHash in opponentMoves) {
				blocked += 1;
			}
			
			var a = this.candidate[0] - lastOpp[0];
			var b = this.candidate[1] - lastOpp[1];

			var distance = Math.sqrt( a*a + b*b );
							
			//prioritize moves that block the most
			if(blocked > mostBlocked) {
				best = [this.candidate[0], this.candidate[1]];
				mostBlocked = blocked;
				bestDist = distance;

			} else if(blocked == mostBlocked) {
				if(distance < bestDist) {
					best = [this.candidate[0], this.candidate[1]];
					bestDist = distance;
				}
			}
			
			//Update In direction
			this.candidate[0] += direction[0];
			this.candidate[1] += direction[1];
		}
	}
	
	//Check size of position you will make
	var myMoves = 0;
	
	this.states[this.turn].push(best);
	for(var dirInd in directions) {
		var direction = directions[dirInd];
		
		this.candidate = [best[0] + direction[0], best[1] + direction[1]];
		
		if(this.checkLegality() == ILL_MIN) // If Continuing Line, jump by min dist
			this.candidate = [best[0] + this.CONT_MIN * direction[0], best[1] + this.CONT_MIN * direction[1]]; 
		
		//Go in each direction
		while(this.checkLegality() == LEGAL) { //IF LEGAL		
			
			//Update In direction
			this.candidate[0] += direction[0];
			this.candidate[1] += direction[1];
			
			myMoves += 1;
		}
	}
	this.states[this.turn].pop();
	
	//Check updated num of position they can make
	var theirMoves = 0;
	
	this.states[this.turn].push(lastOpp);
	for(var dirInd in directions) {
		var direction = directions[dirInd];
		
		this.candidate = [lastOpp[0] + direction[0], lastOpp[1] + direction[1]];
		
		if(this.checkLegality() == ILL_MIN) // If Continuing Line, jump by min dist
			this.candidate = [lastOpp[0] + this.CONT_MIN * direction[0], lastOpp[1] + this.CONT_MIN * direction[1]]; 
		
		//Go in each direction
		while(this.checkLegality() == LEGAL && this.candidate[0] != best[0] && this.candidate[1] != best[1]) { //IF LEGAL		
			
			//Update In direction
			this.candidate[0] += direction[0];
			this.candidate[1] += direction[1];
			
			theirMoves += 1;
		}
	}
	this.states[this.turn].pop();
	
	//If you are more constrained, than run away with min distance
	if(theirMoves > myMoves) {
		best = [];
		bestDist = -1;
		for(var dirInd in directions) {
			var direction = directions[dirInd];
			
			this.candidate = [last[0] + direction[0], last[1] + direction[1]];
			
			if(this.checkLegality() == ILL_MIN) // If Continuing Line, jump by min dist
				this.candidate = [last[0] + this.CONT_MIN * direction[0], last[1] + this.CONT_MIN * direction[1]]; 
			
			//Go in each direction
			if(this.checkLegality() == LEGAL) { //IF LEGAL
				var a = this.candidate[0] - lastOpp[0];
				var b = this.candidate[1] - lastOpp[1];

				var distance = Math.sqrt( a*a + b*b );
				if(distance > bestDist) {
					best = [this.candidate[0], this.candidate[1]];
					bestDist = distance;
				}
			}
		}
	}		

	//Ensured that my move was legal
	this.candidate = [best[0], best[1], LEGAL]; 

	return this.candidate;
};
