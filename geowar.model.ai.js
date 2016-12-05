// Hyper-Aggressive AI.
Model.prototype.botTurn = function() {
	var last = this.getPlayerLastMove();

	// If first move of the game, move 1 direction right.
	if (this.states[0].length == 1 && this.states[1].length == 1) {
		this.candidate = [ last[0] + 1, last[1], LEGAL ];
		return this.candidate;
	}

	var directions = [ [ 1, 0 ], [ 0, 1 ], [ -1, 0 ], [ 0, -1 ] ];

	// Consider diagonals.
	if (this.diagonals[(this.turn + 1) % 2] < this.DIAG_MAX)
		directions = directions.concat([ [ 1, 1 ], [ -1, 1 ], [ 1, -1 ], [ -1, -1 ] ]);

	// Find all valid moves of opponent.
	var opponentMoves = {};

	var lastOpp = this.getPlayerLastMove((this.turn + 1) % 2);

	for (var dirInd in directions) {
		var direction = directions[dirInd];
		var tempPos = [ lastOpp[0] + direction[0], lastOpp[1] + direction[1] ];

		// Go in each direction.
		while (tempPos[0] > 0 && tempPos[0] < gridWidth && tempPos[1] > 0 && tempPos[1] < gridHeight && this.grid[tempPos[1]][tempPos[0]] == -1) { // Free Space.
			// Simple Hash.
			opponentMoves[tempPos[0] + '-' + tempPos[1]] = true;

			// Update in direction.
			tempPos[0] += direction[0];
			tempPos[1] += direction[1];
		}
	}

	// Readjust to my directions.
	if (this.diagonals[this.turn] >= this.DIAG_MAX)
		directions = [ [ 1, 0 ], [ 0, 1 ], [ -1, 0 ], [ 0, -1 ] ];

	// Shuffle directions.
	var shuffle = function(array) {
	var currentIndex = array.length, temporaryValue, randomIndex;
		// While there remain elements to shuffle...
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
	var bestDist = gridHeight + 1; // Unreachable value

	// Go over my directions.
	for (var dirInd in directions) {
		var direction = directions[dirInd];

		this.candidate = [ last[0] + direction[0], last[1] + direction[1] ];

		if (this.checkLegality() == ILL_MIN) // If Continuing Line, jump by min dist.
			this.candidate = [ last[0] + this.CONT_MIN * direction[0], last[1] + this.CONT_MIN * direction[1] ];

		var blocked = 0;

		// Go in each direction.
		while (this.checkLegality() == LEGAL) {
			var moveHash = this.candidate[0] + '-' + this.candidate[1];
			if (moveHash in opponentMoves)
				blocked += 1;

			var a = this.candidate[0] - lastOpp[0];
			var b = this.candidate[1] - lastOpp[1];

			var distance = Math.sqrt( a*a + b*b );

			// Prioritize moves that block the most.
			if (blocked > mostBlocked) {
				best = [ this.candidate[0], this.candidate[1] ];
				mostBlocked = blocked;
				bestDist = distance;
			} else if (blocked == mostBlocked) {
				if (distance < bestDist) {
					best = [this.candidate[0], this.candidate[1]];
					bestDist = distance;
				}
			}

			// Update in direction.
			this.candidate[0] += direction[0];
			this.candidate[1] += direction[1];
		}
	}

	// Check size of position you will make.
	var myMoves = 0;

	this.states[this.turn].push(best);
	for (var dirInd in directions) {
		var direction = directions[dirInd];

		this.candidate = [ best[0] + direction[0], best[1] + direction[1] ];

		if (this.checkLegality() == ILL_MIN) // If Continuing Line, jump by min dist.
			this.candidate = [best[0] + this.CONT_MIN * direction[0], best[1] + this.CONT_MIN * direction[1]];

		// Go in each direction.
		while (this.checkLegality() == LEGAL) {
			// Update In direction.
			this.candidate[0] += direction[0];
			this.candidate[1] += direction[1];

			myMoves += 1;
		}
	}
	this.states[this.turn].pop();

	// Check updated num of position they can make.
	var theirMoves = 0;

	this.states[this.turn].push(lastOpp);
	for (var dirInd in directions) {
		var direction = directions[dirInd];

		this.candidate = [ lastOpp[0] + direction[0], lastOpp[1] + direction[1] ];

		if (this.checkLegality() == ILL_MIN) // If Continuing Line, jump by min dist.
			this.candidate = [lastOpp[0] + this.CONT_MIN * direction[0], lastOpp[1] + this.CONT_MIN * direction[1]];

		// Go in each direction.
		while (this.checkLegality() == LEGAL && this.candidate[0] != best[0] && this.candidate[1] != best[1]) {
			// Update In direction.
			this.candidate[0] += direction[0];
			this.candidate[1] += direction[1];

			theirMoves += 1;
		}
	}
	this.states[this.turn].pop();

	// If you are more constrained, than run away with min distance.
	if (theirMoves > myMoves) {
		best = [];
		bestDist = -1;
		for (var dirInd in directions) {
			var direction = directions[dirInd];

			this.candidate = [ last[0] + direction[0], last[1] + direction[1] ];
			if (this.checkLegality() == ILL_MIN) // If Continuing Line, jump by min dist
				this.candidate = [ last[0] + this.CONT_MIN * direction[0], last[1] + this.CONT_MIN * direction[1] ];

			// Go in each direction.
			if (this.checkLegality() == LEGAL) {
				var a = this.candidate[0] - lastOpp[0];
				var b = this.candidate[1] - lastOpp[1];

				var distance = Math.sqrt(a * a + b * b);
				if (distance > bestDist) {
					best = [ this.candidate[0], this.candidate[1] ];
					bestDist = distance;
				}
			}
		}
	}

	// Ensured that my move was legal.
	this.candidate = [ best[0], best[1], LEGAL ];

	return this.candidate;
};
