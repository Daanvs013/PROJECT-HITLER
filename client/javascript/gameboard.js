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
    //console.log(input)
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
    document.getElementById("info").innerHTML = `gebruikersnaam: ${package.username} <br> partyrol: ${package.partyrole} <br> geheimerol: ${package.secretrole}`;
    console.log(`Jouw partyrol is ${package.partyrole}, jouw geheime rol is ${package.secretrole}`);
})

sock.on("game-role", (package) => {
    package.forEach((player) => {
        var element = `Player${player.position}`;
        document.getElementById(element).innerHTML = player.username;
    });
});

sock.on("game-drawpile-update", (drawpile) => {
    document.getElementById("Drawpile-amount").innerHTML += drawpile;
});

sock.on("game-discardpile-update", (drawpile) => {
    document.getElementById("Discardpile-amount").innerHTML += drawpile;
});

sock.on("game-president-update", (president) => {
    console.log(`${president} is nu de president`);
});

sock.on("game-chancelor-update", (chancelor) => {
    console.log(`${chancelor} is nu de kanselier`);
});

sock.on("game-nightphase", (package) => {
    console.log(package)
    alert(`Hitler: ${package.hitler}\nFascisten: ${package.fascists}`)
});

sock.on("game-choose-chancelor", (options) => {
    console.log("jij bent deze ronde president")
    document.getElementById("Chancelor-dropdown").className = "verschijnen";
    for (var i = 0; i < options.length; i++){
        document.getElementById("Chancelor-vote").innerHTML += `<option id="option${i}" value = "${options[i]}" >${options[i]}</option>`
    }
})

document.getElementById("Chancelor-vote-form").addEventListener("submit", (e) => {
    //'preventDefault' => zorgt ervoor dat de pagina niet wordt herladen.
    e.preventDefault()
    var choice = document.getElementById("Chancelor-vote").value;
    console.log(`Je hebt ${choice} gekozen`);
    sock.emit("game-chancelor-choice", choice);
});

sock.on("game-vote-chancelor", (chancelor) => {
    document.getElementById("Chancelor-dropdown").className = "verdwijnen";
    document.getElementById("Ja/Nein-dropdown").className = "verschijnen";
    document.getElementById("choice").innerHTML = `Wil je dat ${chancelor} kanselier word?`;
})

document.getElementById("ja_nein_vote-form").addEventListener("submit", (e) => {
    //'preventDefault' => zorgt ervoor dat de pagina niet wordt herladen.
    e.preventDefault()
    var choice = document.getElementById("ja_nein_vote").value;
    console.log(`Je hebt ${choice} gekozen`);
    sock.emit("game-chancelor-vote-choice", choice);
    document.getElementById("Ja/Nein-dropdown").className = "verdwijnen";
});
//
