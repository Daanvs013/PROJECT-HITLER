sock.on("login-request-accepted", (username) => {
    document.getElementById("test").innerHTML += ` ${username}`;
})

//lobby
sock.on("get-active-lobbies", (Lobbies) => {
    document.getElementById("main-lobby").innerHTML = '';
    Lobbies.forEach((lobby) => {
        //console.log(lobby);
        document.getElementById("main-lobby").innerHTML += `
        <div class="lobby-wrapper">
            <div id="lobby-${lobby.id}-amount">${lobby.players.length}/${lobby.playercap} spelers in de lobby.</div>
            <button id="${lobby.id}" onclick="joinlobby(this.id)">Join lobby</button>  
        </div>`;
    });
});

function joinlobby(id){
    var lobby = id;
    sock.emit("join-lobby", lobby);
}

function leavelobby(){
    sock.emit("leave-lobby", true);
}

function ready(){
    sock.emit("ready-status-lobby", true);
}

sock.on("join-lobby-succes", (lobby) => {
    //console.log(lobby)
    document.getElementById("lobbymenu").classList.remove("verdwijnen");
    document.getElementById("lobbymenu").classList.add("verschijnen");
    document.getElementById("main-lobby").classList.remove("verschijnen");
    document.getElementById("main-lobby").classList.add("verdwijnen");
    document.getElementById("lobbyinfo").innerHTML = `Aantal spelers: ${lobby.players.length}/${lobby.playercap}`;
    document.getElementById("spelers").innerHTML = '';
    lobby.players.forEach((player) => {
        document.getElementById("spelers").innerHTML += `
        <div class="invspelers">
            ${player.username}
            <div class="readycirkel" style='background-color:${player.status}; border: 2px solid ${player.status}'></div>
        </div>
        `;
    })
});

sock.on("leave-lobby-succes", () => {
    //console.log(lobby)
    document.getElementById("lobbymenu").classList.remove("verschijnen");
    document.getElementById("lobbymenu").classList.add("verdwijnen");
    document.getElementById("main-lobby").classList.remove("verdwijnen");
    document.getElementById("main-lobby").classList.add("verschijnen");
});