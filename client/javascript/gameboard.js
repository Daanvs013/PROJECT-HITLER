//on ready (laat de server weten dat de redirect is afgehandeld)
$( document ).ready(function() {
    var url = window.location.href
    sock.emit("game-redirect-succes", url)
});

//chat
document.getElementById("chat-form").addEventListener("submit", (e) => {
    //'preventDefault' => zorgt ervoor dat de pagina niet wordt herladen.
    e.preventDefault()
    var input = document.getElementById("chat-form-input").value;
    console.log(input)
    sock.emit("chat-message-request", input);
    document.getElementById("chat-form-input").value = "";
});

sock.on("chat-message", (message) => {
    //console.log(message)
    var chat = document.getElementById("chat");
    chat.innerHTML += message;
    chat.scrollTop = chat.scrollHeight;
});
//

//game
sock.on("player-info", (package) => {
    document.getElementById("info").innerHTML = `gebruikersnaam:${package.username} <br> partyrol:${package.partyrole} <br> geheimerole:${package.secretrole}`;
    console.log(`Jouw partyrol is ${package.partyrole}, jouw geheime rol is ${package.secretrole}`);
})

sock.on("game-role", (package) => {
    package.forEach((player) => {
        var element = `Player${player.position}`;
        document.getElementById(element).innerHTML = player.username;
    });
});