 <!DOCTYPE html>
<html>
<head>
<title>Project Hitler Error</title>
	<meta charset="UTF-8">
 	<meta name="description" content="Free Web tutorials">
  	<meta name="keywords" content="HTML,CSS,XML,JavaScript">
  	<meta name="author" content="John Doe">
  	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link  href="">
	<script src="error.js"></script>
</head>
<body>
<?php 
	function OpenCon() {
		$dbhost = "localhost";
		$dbuser = "zesvwo1";
		$dbpass = "Mercedes2016#";
		$db = "zesvwo";
	$conn = new mysqli($dbhost, $dbuser, $dbpass,$db) or die("Connect failed: %s\n". $conn -> error);
	return $conn;
		}
	function CloseCon($conn){
	$conn -> close();
	}

	$conn = OpenCon();
	//echo "Connected Successfully";
	
	// $name = $_POST['name'];
	// $score = $_POST['score'];
	// $time = $_POST['time'];
	// $sql1 = "INSERT INTO Leaderboard (Name, Score, Time) 
	// VALUES ('$name','$score','$time')";
	// if ($conn->query($sql1) === TRUE) {
 //   // echo "New record created successfully";
	// } else {
 //    echo "Error: " . $sql1 . "<br>" . $conn->error;
	// }


	

	
	
	CloseCon($conn);
	?>
	<div id='formdiv'>
	<form action="PHPform.php" method="post">
		Name: <input type="text" name="name"><br>
		<select name="errortype">
	  		<option value="1">1</option>
	  		<option value="2">2</option>
	  		<option value="3">3</option>
	  		<option value="4">4</option>
		</select> 
		Error: <input type="text" name="score"><br>

		<input type="submit">
	</form>
	
	</div>
	<div id='highscore'>


</body>

</html> 
