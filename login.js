//login
document.getElementById("login-form").addEventListener("submit", (e) => {
    //'preventDefault' => zorgt ervoor dat de pagina niet wordt herladen.
    e.preventDefault()
    //gi = gebruikersinfo
   	var gi = {														
   		username : document.getElementById("login-form-username").value,
		password : document.getElementById("login-form-password").value
   	}
    sock.emit("login-request", gi);
    document.getElementById("login-form-username").value = "";
});
//




