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
//speler info
sock.on("player-info", (package) => {
    document.getElementById("info").innerHTML = `gebruikersnaam: ${package.username} <br> partyrol: ${package.partyrole} <br> geheimerol: ${package.secretrole}`;
    console.log(`Jouw partyrol is ${package.partyrole}, jouw geheime rol is ${package.secretrole}`);
})

sock.on("game-role", (package) => {
    package.forEach((player) => {
        document.getElementById(`player${player.position}-name`).innerHTML = player.username;
    });
});

//update borden
sock.on("game-drawpile-update", (drawpile) => {
    document.getElementById("Drawpile-amount").innerHTML += drawpile;
});

sock.on("game-discardpile-update", (drawpile) => {
    document.getElementById("Discardpile-amount").innerHTML += drawpile;
});

//update president
sock.on("game-president-update", (package) => {
    //alert(`${president} is nu de president`);
    var currentpresident = document.getElementById(`player${package.president}-president`)
    if (package.action == 'add'){
        currentpresident.classList.remove("verdwijnen");
        currentpresident.classList.add("verschijnen");
    } else if (package.action == 'remove') {
        currentpresident.classList.remove("verschijnen");
        currentpresident.classList.add("verdwijnen");
    }
});

//update kanselier
sock.on("game-chancellor-update", (package) => {
    //alert(`${chancellor} is nu de kanselier`);
    var currentchancellor = document.getElementById(`player${package.chancellor}-chancellor`)
    if (package.action == 'add'){
        currentchancellor.classList.remove("verdwijnen");
        currentchancellor.classList.add("verschijnen");
    } else if (package.action == 'remove') {
        currentchancellor.classList.remove("verschijnen");
        currentchancellor.classList.add("verdwijnen");
    }
});

//laat fascisten weten wie hitler+mede fascisten zijn
sock.on("game-nightphase", (package) => {
    console.log(package)
    alert(`Hitler: ${package.hitler}\nFascisten: ${package.fascists}`)
});

//functies waarmee de president een kanselier kan kiezen
sock.on("game-choose-chancellor", (options) => {
    console.log("jij bent deze ronde president")
    document.getElementById("Chancellor-dropdown").className = "verschijnen";
    for (var i = 0; i < options.length; i++){
        document.getElementById("Chancellor-vote").innerHTML += `<option id="option${i}" value = "${options[i]}" >${options[i]}</option>`
    }
})

document.getElementById("Chancellor-vote-form").addEventListener("submit", (e) => {
    //'preventDefault' => zorgt ervoor dat de pagina niet wordt herladen.
    e.preventDefault()
    var choice = document.getElementById("Chancellor-vote").value;
    console.log(`Je hebt ${choice} gekozen`);
    sock.emit("game-chancellor-choice", choice);
});

//functies waarmee de spelers kunnen stemmen op de gekozen kanselier
sock.on("game-vote-chancellor", (chancellor) => {
    document.getElementById("Chancellor-dropdown").className = "verdwijnen";
    document.getElementById("Ja/Nein-dropdown").className = "verschijnen";
    document.getElementById("choice").innerHTML = `Wil je dat ${chancellor} kanselier word?`;
})

document.getElementById("ja_nein_vote-form").addEventListener("submit", (e) => {
    //'preventDefault' => zorgt ervoor dat de pagina niet wordt herladen.
    e.preventDefault()
    var choice = document.getElementById("ja_nein_vote").value;
    console.log(`Je hebt ${choice} gekozen`);
    sock.emit("game-chancellor-vote-choice", choice);
    document.getElementById("Ja/Nein-dropdown").className = "verdwijnen";
});

//functie om de getrokken kaarten te laten zien aan de president
sock.on("game-give-cards-president", (package) => {
    console.log(package);
})