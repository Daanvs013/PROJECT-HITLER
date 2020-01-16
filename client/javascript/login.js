//login
document.getElementById("login-form").addEventListener("submit", (e) => {
    //'preventDefault' => zorgt ervoor dat de pagina niet wordt herladen.
    e.preventDefault()
    var username = document.getElementById("login-form-username").value;
    console.log(`Ingevulde naam: ${username}`);
    sock.emit("login-request", username);
    document.getElementById("login-form-username").value = "";
});
//
