function Select_Chancelor() {
	document.getElementById("Chancelor-dropdown").className = "verschijnen";
}

function Select_Chancelor_End() {
	var chancelor_vote = document.getElementById("Chancelor-vote").value;
	console.log(chancelor_vote);
	document.getElementById("Chancelor-dropdown").className = "verdwijnen";
	sock.emit('chancelor_vote', chancelor_vote);
}

function Select_Ja_Nein(){
	document.getElementById("Ja/Nein-dropdown").className = "verschijnen";
}
function Select_Ja_Nein_End(){
	var ja_nein_vote = document.getElementById("ja_nein_vote").value;
	console.log(ja_nein_vote);
	document.getElementById("Ja/Nein-dropdown").className = "verdwijnen";
	sock.emit('ja_nein_vote', ja_nein_vote);
}


function Show_Role(){
	document.getElementById("Party_Role").className = "verschijnen";
	document.getElementById("Secret_Role").className = "verschijnen";
	setTimeout(function(){ document.getElementById("Secret_Role").className = "verdwijnen"; document.getElementById("Party_Role").className = "verdwijnen";}, 3000);
}

function Determine_Role(){
	if (package.partyrol == "Liberaal"){
		document.getElementById("Party_Role").src = "Liberalmember.png";
		document.getElementById("Secret_Role").src = "Liberalmember.png";
	}else if (package.partyrol == "Fascist" && secretrol == "Fascist"){
		document.getElementById("Party_Role").src = "fascist.png";
		document.getElementById("Secret_Role").src = "fascist.png";
	}else if (package.partyrol == "Fascist" && secretrol == "Hitler"){
		document.getElementById("Party_Role").src = "fascist.png";
		document.getElementById("Secret_Role").src = "Tenshi.png";
	}else{
		document.getElementById("Party_Role").src = "";
		document.getElementById("Secret_Role").src = "";
		console.log("Empty");
	}
}
