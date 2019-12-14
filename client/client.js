//socket.io module.
var sock = io();
//

//sessie
var url = window.location.href;
var data = sessionStorage.getItem('sessionID');
console.log(`Sessie ID:${data}, Sessie path:${url}`);
sock.emit("new-session", {ID:data, path:url});

sock.on("sessionID", (ID) => {
    //sla het ID op als sessieopslag
    sessionStorage.setItem('sessionID', ID);
});

//test
console.log("javascript is gelinkt");
//

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
})//

//debug
sock.on("server-alert", (message) => {
    alert(message);
});
//

//lobby
sock.on("get-active-lobbies", (Lobbies) => {
    document.getElementById("main-lobby").innerHTML = '';
    Lobbies.forEach((lobby) => {
        //console.log(lobby);
        document.getElementById("main-lobby").innerHTML += `
        <div class="lobby-wrapper">
            <div id="lobby-${lobby.id}-amount">${lobby.players.length}/${lobby.playercap} spelers in de lobby.</div>
            <button id="${lobby.id}" onclick="joinlobby(this.id)">Join lobby</button>
            <div id="lobby-${lobby.id}-queue">${lobby.players}</div>    
        </div>`;
    });
});

function joinlobby(id){
    var lobby = id;
    sock.emit("change-lobby", lobby);

}
//redirect functie
sock.on("redirect-client", (path) => {
    //console.log(path);
    window.location.replace(path);
});

//game
sock.on("game-role", (role) => {
    document.getElementById("info").innerHTML = `partyrol:${role.party} <br> geheimerole:${role.secret}`;
    console.log(`Jouw partyrol is ${role.party}, jouw geheime rol is ${role.secret}`);
    alert(`party:${role.party} en secret:${role.secret}`);
})