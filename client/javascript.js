//socket.io module.
var sock = io();

console.log("javascript is gelinkt");


//login
document.getElementById("login-form").addEventListener("submit", (e) => {
    //'preventDefault' => zorgt ervoor dat de pagina niet wordt herladen.
    e.preventDefault()
    var username = document.getElementById("login-form-username").value;
    console.log(`Ingevulde naam: ${username}`);
    sock.emit("login-request", username);
    document.getElementById("login-form-username").value = "";
});

sock.on("login-request-accepted", (username) => {
    document.getElementById("login-wrapper").style.display = "none";
    document.getElementById("main-wrapper").style.display = "block";
    document.getElementById("test").innerHTML += ` ${username}`;
})
//

//debug
sock.on("server-alert", (message) => {
    alert(message);
});
//

//lobby
sock.on("lobby-status-update", (status) => {
    document.getElementById("test2").innerHTML += ` ${status}`;
});

sock.on("lobby-queue-update", (Players) => {
    document.getElementById("main-lobby-amount").innerHTML = `${Players.length}/6 spelers in de lobby`;
    document.getElementById("main-lobby-queue").innerHTML = "";
    Players.forEach((player) => {
        document.getElementById("main-lobby-queue").innerHTML += `${player.username}<br>`;
    });
});
//