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
</head>
<body>
<?php 
	function OpenCon() {
		$dbhost = "localhost";
		$dbuser = "id12400930_error";
		$dbpass = "error";
		$db = 'id12400930_error';
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
	if (!empty($_POST['$name'])){
	    $name = mysqli_real_escape_string($conn, $_REQUEST['name']);
    	$errortype = mysqli_real_escape_string($conn, $_REQUEST['errortype']);
    	$error = mysqli_real_escape_string($conn, $_REQUEST['error']);
    	$sql1 = "INSERT INTO Errordb (Name, Errortype, Error, Solved) 
    		VALUES ('$name', '$errortype', '$error',0)";
    	if( $name != "..." || $error != "..." ){
    	if ($conn->query($sql1) === TRUE) {
     		//echo "New record created successfully";
    	 } else {
     	    //echo "Error: " . $sql1 . "<br>" . $conn->error;
    	 }}
    	else {alert("Vul de informatie in s.v.p.");}
    	
    
    	CloseCon($conn);
	} else {

	}
	
	?>
	<div id='formdiv'>
	<form  id="form" action="index.php" method="post">
		<p id="pname">Naam:</p> <input id="Name" type="text" name="name" value="..."><br>
		<p id="perror">Fout:</p> <input id="error" type="text" name="error" value="..."><br>
		<select id="select" name="errortype">
	  		<option value="1">Ik ben gekicked.</option>
	  		<option value="2">Het spel loop vast.</option>
	  		<option value="3">Fout in het design.</option>
	  		<option value="4">Een functie deed niet wat hij hoort te doen.</option>
	  		<option value="5">Anders.</option>
		</select> 

		<input id="submit" type="submit" value='Verzenden'>
	</form>
	</div>
	
	<!--Error en regels-->
    <div id="links">
        <a href="Spelregels.pdf" target="_blank">-Regels</a>
        <br>
        <a href="https://project-hitler.herokuapp.com/" target="_blank">-Secret Hitler</a>
    </div>
</body>

</html> 