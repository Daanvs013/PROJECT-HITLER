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
	//echo "Connected Successfully";
	

	function alert($msg) {
    echo "<script type='text/javascript'>alert('$msg');</script>";
	}

	// $name = 'Cas';
	// $errortype = 1;
	// $error = 'php werkt niet';
	$name = mysqli_real_escape_string($conn, $_REQUEST['name']);
	$errortype = mysqli_real_escape_string($conn, $_REQUEST['errortype']);
	$error = mysqli_real_escape_string($conn, $_REQUEST['error']);
	$sql1 = "INSERT INTO Errordb (Name, Errortype, Error, Solved) 
		VALUES ('$name', '$errortype', '$error',0)";
	if( $name != "..." && $error != "..." ){
	if ($conn->query($sql1) === TRUE) {
 		//echo "New record created successfully";
	 } else {
 	    //echo "Error: " . $sql1 . "<br>" . $conn->error;
	 }}
	else {alert("Vul de informatie in s.v.p.");}
	

	CloseCon($conn);
	?>
	<div id='formdiv'>
	<form action="error.php" method="post">
		Name: <input type="text" name="name" value="..."><br>
		<select name="errortype">
	  		<option value="1">Ik ben gekicked</option>
	  		<option value="2">Het spel loopt vast</option>
	  		<option value="3">Fouten in het design</option>
	  		<option value="4">Een functie deed niet wat hij hoort te doen</option>
	  		<option value="5">Anders</option>
		</select> 
		Error: <input type="text" name="error" value="..."><br>

		<input type="submit" value="Verzenden">
	</form>
</body>

</html> 