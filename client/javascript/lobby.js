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
            <div id="lobby-${lobby.id}-queue">${lobby.players}</div>    
        </div>`;
    });
});

function joinlobby(id){
    var lobby = id;
    sock.emit("change-lobby", lobby);

}