<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8" />
	<title>Geowar - Play and Pray</title>
	<link rel="stylesheet" href="geowar.css" />
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js"></script>
	<script src="geowar.model.js"></script>
	<script src="geowar.model.ai.js"></script>
	<script src="geowar.interface.transform.js"></script>
	<script src="geowar.interface.js"></script>

    <base href="http://cims.nyu.edu/~by653/hps/">
    <script src="js/jquery-2.2.4.min.js"></script>
    <script src="js/facebox.js"></script>
    <script src="js/gameSettings.js"></script>
    <link rel="stylesheet" type="text/css" href="css/facebox.css"/>
    <link rel="stylesheet" type="text/css" href="css/main.css"/>
    <link rel="stylesheet" type="text/css" href="css/bootstrap.css"/>
    <script type="text/javascript">
        jQuery(document).ready(function($) {
            $('a[rel*=facebox]').facebox()
        })
    </script>
</head>
<body>
<div class="container">
    <?php include "../header.php"; ?>
    <nav>
        <ul>
        <li><a href="">Home</a></li>
            <li><a href="empty">Empty Template</a></li>
        </ul>
        <?php include "../leftMenuGame.php"; ?>
    </nav>
    <article>
        <div id="overlay">
			<div id="dimmer"></div>
			<form id="nameform">
				<label for="enterplayername0">Name for red player:</label>
				<input type="text" maxlength="24" id="enterplayername0" value="Player 1" />
				<label for="enterplayername1">Name for blue player:</label>
				<input type="text" maxlength="24" id="enterplayername1" value="Player 2" />
				<input type="submit" value="Start" id="start" />
			</form>
		</div>
		
		<!-- Game Header -->
		<div id="board_header" class="metallic">
			<h3 id="title">- Geowars -</h3>
		</div>
		
		<!-- Game Canvas -->
		<div id="wrapper">
			<span style="visibility:hidden;position:absolute" id="lineheight">a</span>
			<canvas id="game" width="600" height="600"></canvas>
			
			<!-- Scoreboard -->
			<div id="scoreboard" class="metallic">
				<div id="button-wrapper"><button id="newgame" class="action-button shadow animate red-button">New Game</button></div>
				<hr class ='line'>
				
				<div class="timer">
					<span class="playername" id="playername0">Player 1:</span>
					<input id="redplayer" type="button" class="player-mode small-button" value="Human"></input>
					<span id="clock0" class="display" style="clear: both">0:00</span>
				</div>
				<hr class ='line'>
				
				<div class="timer">
					<span class="playername" id="playername1">Player 2:</span>
					<input id="blueplayer" type="button" class="player-mode small-button" value="Human"></input>
					<span id="clock1" class="display" style="clear: both">0:00</span>
				</div>
				<hr class ='line'>
				
				<div id="rules">
					Game Rules:
					<ol id="rule-list">
						<li>Grid Size: 100 x 100.</li>
						<li>Players take turns to draw a line segment from the last point.</li>
						<li>Only 2 diagonal segments are permitted per player.</li>
						<li>Extending the previous line must be at least by 10 units</li>
						<li>The first player who cannot draw a segment loses.</li>
						<li>Each ray cannot intersect another colored ray.</li>
					</ol>
				</div>
			</div>
		</div>
		
		<!-- Hints Dashboard -->
		<div id ="dashboard" class="metallic">
			<div id="tip" class="display">&nbsp;</div>
		</div>
    </article>
    <?php include "../footer.php"; ?>
</div>
<script type="text/javascript">
    initInfo("TEST", "TEST GROUP", "TEST DESCRIPTION");
    newTextBox("testbox",'textBoxDemo');
    var choices = ['PvP','PvAI','AIvP'];
    newButtonGroup('mode',choices,'btnDemo');
    newSelect('anotherMode',choices,'selectDemo');
    newWindowBtn(800,800,"empty/iframe.html", ['textBoxDemo', 'btnDemo', 'selectDemo']);
</script>
</body>
<link href='http://fonts.googleapis.com/css?family=Lobster' rel='stylesheet' type='text/css'>
</html>
