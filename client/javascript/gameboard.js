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
sock.on("game-player-info", (package) => {
    document.getElementById("Party_Role").src = package.partyrolepath;
    document.getElementById("Secret_Role").src = package.secretrolepath;
    document.getElementById("info").innerHTML = `Gebruikersnaam: ${package.username}`;
});

sock.on("game-nightphase", (package) => {
    document.getElementById("Fascisten_Box").innerHTML = `Hitler: ${package.hitler}<br>Fascisten: ${package.fascists}`;
});

function Show_Role(){
    document.getElementById("seeownrole").classList.remove("verdwijnen");
    document.getElementById("seeownrole").classList.add("verschijnen");
    setTimeout(function(){ 
        document.getElementById("seeownrole").classList.remove("verschijnen");
        document.getElementById("seeownrole").classList.add("verdwijnen");
    }, 3000);
}

sock.on("game-player-position", (package) => {
    package.forEach((player) => {
        document.getElementById(`player${player.position}-name`).innerHTML = player.username;
    });
});

//update borden
sock.on("game-drawpile-update", (drawpile) => {
    document.getElementById("Drawpile-amount").innerHTML = drawpile;
});

sock.on("game-discardpile-update", (discardpile) => {
    document.getElementById("Discardpile-amount").innerHTML = discardpile;
});

sock.on("game-liberalboard-update", (card) => {
    var element = document.getElementById("Liberalboard");
    element.innerHTML += `<div style="background-image: url(${card.path})" class="board-policies""></div>`
})

sock.on("game-fascistboard-update", (card) => {
    var element = document.getElementById("Fascistboard");
    element.innerHTML += `<div style="background-image: url(${card.path})" class="board-policies""></div>`
})

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

//functies waarmee de president een kanselier kan kiezen
sock.on("game-choose-chancellor", (options) => {
    document.getElementById("Chancellor-dropdown").classList.remove("verdwijnen");
    document.getElementById("Chancellor-dropdown").classList.add("verschijnen");
    options.forEach((option) => {
        var element = document.getElementById(`player${option}-name`);
        element.style.boxShadow = '0 0 0 5px blue';
        element.style.cursor = 'pointer';
        element.setAttribute("onclick", "PresidentChooseChancellor(this.id)");
    });
});

//verzend keuze naar server
function PresidentChooseChancellor(id){
    sock.emit("game-chancellor-choice", id);
}

//verwijder de onclick als kanselier keuze succesvol is afgerond.
sock.on("game-chooce-chancellor-succes", (options) => {
    document.getElementById("Chancellor-dropdown").classList.remove("verschijnen");
    document.getElementById("Chancellor-dropdown").classList.add("verdwijnen");
    options.forEach((option) => {
        var element = document.getElementById(`player${option}-name`);
        element.style.boxShadow = 'none';
        element.style.cursor = 'auto';
        element.removeAttribute("onclick", "PresidentChooseChancellor(this.id)");
    });
});

//functies waarmee de spelers kunnen stemmen op de gekozen kanselier
sock.on("game-vote-chancellor", (chancellor) => {
    document.getElementById("Chancellor-dropdown").className = "verdwijnen";
    document.getElementById("Ja-Nein-dropdown").className = "verschijnen";
    document.getElementById("Ja-Nein-dropdown-info").innerHTML = `Wil je dat ${chancellor} kanselier word?`;
})

function ja_nein_vote(vote){
    console.log(`Je hebt ${vote} gekozen.`);
    sock.emit("game-chancellor-vote-choice", vote);
    document.getElementById("Ja-Nein-dropdown").classList.remove("verschijnen");
    document.getElementById("Ja-Nein-dropdown").classList.add("verdwijnen");
}

//functie om aan te geven wie al heef gestemd
sock.on("game-voted", (package) => {
    var element = document.getElementById(`player${package.playerindex}-vote`);
    element.classList.remove("verdwijnen");
    element.classList.add("verschijnen");
    element.style.backgroundImage = `url('../images/${package.vote}.png')`;
});

sock.on("game-vote-resolved", (playercap) => {
    for (var i = 0; i < playercap; i++){
        var element = document.getElementById(`player${i}-vote`);
        element.classList.remove("verschijnen");
        element.classList.add("verdwijnen"); 
    }
})

//functies om de getrokken kaarten te laten zien aan de president
sock.on("game-give-cards-president", (package) => {
    console.log(package);
    var element = document.getElementById("president-policies-popup");
    element.classList.remove("verdwijnen");
    element.classList.add("verschijnen");
    element.innerHTML = 'Kies een beleidskaart die je weggooit.<br><br>';
    for (var i = 0; i < package.length; i++){
        element.innerHTML += `<div id="${i}" style="background-image: url(${package[i].path})" class="policies" onclick="ChoosePresidentPolicy(this.id)"></div>`
    }
})

function ChoosePresidentPolicy(id){
    console.log(`Beleidskaart ${id} gekozen`);
    var element = document.getElementById("president-policies-popup");
    element.classList.remove("verschijnen");
    element.classList.add("verdwijnen");
    sock.emit("game-chosen-cards-president", id);
}

//functies om de overgebleven getrokken kaarten te laten zien aan de kanselier
sock.on("game-give-cards-chancellor", (package) => {
    console.log(package);
    var element = document.getElementById("chancellor-policies-popup");
    element.classList.remove("verdwijnen");
    element.classList.add("verschijnen");
    element.innerHTML = 'Kies welk beleidskaart je wilt opleggen.<br><br>';
    for (var i = 0; i < package.length; i++){
        element.innerHTML += `<div id="${i}" style="background-image: url(${package[i].path})" class="policies" onclick="ChooseChancellorPolicy(this.id)"></div>`
    }
})

function ChooseChancellorPolicy(id){
    console.log(`Beleidskaart ${id} gekozen`);
    var element = document.getElementById("chancellor-policies-popup");
    element.classList.remove("verschijnen");
    element.classList.add("verdwijnen");
    sock.emit("game-chosen-cards-chancellor", id);
}

//functie om de bovenste drie beleidskaarten van de drawpile te bekijken
sock.on("game-see-top-policy", (package) => {
    //console.log(package);
    var element = document.getElementById("game-see-top-policy");
    element.classList.remove("verdwijnen");
    element.classList.add("verschijnen");
    element.innerHTML = `<div>De bovenste drie beleidskaartem, de linker ligt bovenop:</div>`;
    element.innerHTML += `<button onclick="seenTopPolicy()">OK</button>`;
    package.forEach((policy) => {
        element.innerHTML += `<div class="seeTopPolicy" style="background-image: url(${policy.path})"></div>`
    });
    
});

function seenTopPolicy(){
    document.getElementById("game-see-top-policy").classList.remove("verschijnen");
    document.getElementById("game-see-top-policy").classList.add("verdwijnen");
    sock.emit("game-seen-top-policy", true)
}

//functie om iemand te schieten/uit het parlement sturen
sock.on("game-kill", (options) => {
    //console.log(options);
    document.getElementById("game-kill").classList.remove("verdwijnen");
    document.getElementById("game-kill").classList.add("verschijnen");
    options.forEach((option) => {
        var element = document.getElementById(`player${option}-name`);
        element.style.cursor = 'pointer';
        element.style.boxShadow = '0 0 0 4px blue';
        element.setAttribute("onclick", "PresidentKill(this.id)");
    })
})

function PresidentKill(id){
    sock.emit("game-kill-request", id);
}

sock.on("game-kill-request-succes", (options) => {
    document.getElementById("game-kill").classList.remove("verschijnen");
    document.getElementById("game-kill").classList.add("verdwijnen");
    options.forEach((option) => {
        var element = document.getElementById(`player${option}-name`);
        element.style.cursor = 'auto';
        element.style.boxShadow = 'none';
        element.removeAttribute("onclick", "PresidentKill(this.id)");
    })
})

sock.on("game-kill-succes", (player) => {
    document.getElementById(`player${player}-container`).style.display = 'none';
})

//functie om iemand zijn rol te bekijken
sock.on("game-see-role", (options) => {
    //console.log(options);
    document.getElementById("game-see-role").classList.remove("verdwijnen");
    document.getElementById("game-see-role").classList.add("verschijnen");
    options.forEach((option) => {
        var element = document.getElementById(`player${option}-name`);
        element.style.cursor = 'pointer';
        element.style.boxShadow = '0 0 0 4px blue';
        element.setAttribute("onclick", "PresidentSeePartyRole(this.id)");
    })
});

//verzend gekozen spelercirkel naar server
function PresidentSeePartyRole(id){
    sock.emit("game-see-role-request", id);
}

sock.on("game-see-role-request-succes", (options) => {
    document.getElementById("game-see-role").classList.remove("verschijnen");
    document.getElementById("game-see-role").classList.add("verdwijnen");
    options.forEach((option) => {
        var element = document.getElementById(`player${option}-name`);
        element.style.cursor = 'auto';
        element.style.boxShadow = 'none';
        element.removeAttribute("onclick", "PresidentSeePartyRole(this.id)");
    })
})

sock.on("game-seen-role", (package) => {
    var element = document.getElementById("game-seen-role");
    element.classList.remove("verdwijnen");
    element.classList.add("verschijnen");
    element.innerHTML = `Partijrol van ${package.username}: <br> <img src="${package.partyrolepath}" alt="Partijrol">`;
    element.innerHTML += `<button onclick="seenPartyRole()">OK</button>`;
});

function seenPartyRole(){
    document.getElementById("game-seen-role").classList.remove("verschijnen");
    document.getElementById("game-seen-role").classList.add("verdwijnen");
    sock.emit("game-seen-role-request", true)
}

//functie voor winscherm
sock.on("game-win", (pack) => {
    var element = document.getElementById("game-win");
    element.classList.remove("verdwijnen");
    element.classList.add("verschijnen");
    element.innerHTML = `Het spel is afgelopen. ${pack} Je wordt nu teruggestuurd naar de lobby.<br><button onclick="gameWin()">OK</button>`;
});

function gameWin(){
    sock.emit("game-end", true);
}
