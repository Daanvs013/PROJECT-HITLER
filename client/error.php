 <!DOCTYPE html>
<html>
<head>
<title>Project Hitler Error</title>
	<meta charset="UTF-8">
 	<meta name="description" content="Free Web tutorials">
  	<meta name="keywords" content="HTML,CSS,XML,JavaScript">
  	<meta name="author" content="John Doe">
  	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link rel="stylesheet" type="text/css" href="error.css">
	<link href="https://fonts.googleapis.com/css?family=Fruktur&display=swap" rel="stylesheet">
	<script src="error.js"></script>
</head>
<body>
<?php 
	function OpenCon() {
		$dbhost = "localhost";
		$dbuser = "zesvwo1";
		$dbpass = "Mercedes2016#";
		$db = 'zesvwo1';
	$conn = new mysqli($dbhost, $dbuser, $dbpass,$db) or die("Connect failed: %s\n". $conn -> error);
	return $conn;
		}
	function CloseCon($conn){
	$conn -> close();
	}

	$conn = OpenCon();
	echo "Connected Successfully";


	// $name = 'Cas';
	// $errortype = 1;
	// $error = 'php werkt niet';
	$name = mysqli_real_escape_string($conn, $_REQUEST['name']);
	$errortype = mysqli_real_escape_string($conn, $_REQUEST['errortype']);
	$error = mysqli_real_escape_string($conn, $_REQUEST['error']);
	$sql1 = "INSERT INTO Errordb (Name, Errortype, Error, Solved) 
		VALUES ('$name', '$errortype', '$error',0)";
	if ($conn->query($sql1) === TRUE) {
 		echo "New record created successfully";
	 } else {
 	    echo "Error: " . $sql1 . "<br>" . $conn->error;
	 }
	unset($_REQUEST);
	// $sql2 = "DELETE FROM Errordb WHERE Name = 0";
	// if ($conn->query($sql2) === TRUE) {
 // 		echo "New record created successfully";
	//  } else {
 // 	    echo "Error: " . $sql2 . "<br>" . $conn->error;
	//  }

	CloseCon($conn);
	?>
	<div id='formdiv'>
	<form  id="form" action="error.php" method="post">
		<p id="pname">Name:</p> <input id="Name" type="text" name="name" value="..."><br>
		<p id="perror">Error:</p> <input id="error" type="text" name="error" value="..."><br>
		<select id="select" name="errortype">
	  		<option value="1">1</option>
	  		<option value="2">2</option>
	  		<option value="3">3</option>
	  		<option value="4">4</option>
		</select> 

		<input id="submit" type="submit" value='Verzenden'>
	</form>
</body>

</html> 