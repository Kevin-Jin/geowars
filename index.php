<!DOCTYPE html>
<html>
<head>
    <?php $base = "../../" ?>
    <base href="../../">
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
    <?php include $base."header.php"; ?>
    <nav>
        <ul>
        <li><a href="">Home</a></li>
        </ul>
        <li><a href="games/empty">Empty Template</a></li>
	<li><a href="games/multiplayer-snake/">Snake</a></li>
        <!--?php include $base."leftMenuGame.php"; ?-->
    </nav>
    <article>
        <h1 id="gameName">Geowars</h1>
        <h3 id="groupName">Play and Pray</h3>
        <h3>Instruction:</h3>
        <div id="gameDesc" class="jumbotron">
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
        <h3>Play the Game!</h3>
        <form id="gameSettings" class="well">
        </form>
    </article>
    <?php include $base."footer.php"; ?>
</div>
<script type="text/javascript">
    newWindowBtn(850,850,"games/geowars/geowar.html", []);
</script>
</body>
</html>
