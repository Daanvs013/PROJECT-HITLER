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
	<style>
	table, th, td {
 	   border: 1px solid black;
		}
</style>
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


	$sql = "SELECT Id,Name, Errortype, Error, Solved FROM Errordb";
	$result = mysqli_query($conn, $sql);

	if ($result->num_rows > 0) {
    echo "<table><tr><th>ID</th><th>Naam</th><th>Errortype</th><th>Error</th><th>Opgelost</th></tr>";
    // output data of each row
    while($row = $result->fetch_assoc()) {
        echo "<tr><td>" . $row["Id"]. "</td><td>" . $row["Name"]. "</td><td>" . $row["Errortype"]. "</td><td>" . $row["Error"]. "</td><td>" . $row["Solved"]. "</td></tr>";
    }
    echo "</table>";
} else {
    echo "0 results";
}
	$ids = mysqli_real_escape_string($conn, $_REQUEST['ids']);
	$sqlu = "UPDATE Errordb SET Solved='1' WHERE Id='$ids'";

	if ($conn->query($sqlu) === TRUE) {
 	   //echo "Record updated successfully";
	} else {
    	//echo "Error updating record: " . $conn->error;
	}
	CloseCon($conn);
	?>
	<div>
		<form  id="form" action="Select.php" method="post">
		<p id="pname">ID:</p> <input id="ids" type="text" name="ids" value="..."><br>
		<input id="submit" type="submit" value='Verzenden'>
	</form>
	<div>
		<p>
		Errortype: <br>
		1 = Ik ben gekicked <br>
		2 = Het spel loopt vast <br>
		3 = Fout in het design <br>
		4 = Functie deed niet wat het hoort te doen <br>
		5 = Anders
		</p>

	</div>

	</div>	
</body>

</html> 