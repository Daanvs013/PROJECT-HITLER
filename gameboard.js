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
    console.log(package)
    if (package.partyrole == "Liberaal"){
        document.getElementById("Party_Role").src = "Liberalmembership.png";
        document.getElementById("Secret_Role").src = "Liberalmember.png";
    }else if (package.partyrole == "Fascist" && package.secretrole == "Fascist"){
        document.getElementById("Party_Role").src = "Fascistmembership.png";
        document.getElementById("Secret_Role").src = "fascist.png";
        document.getElementById("Fascisten_Box").innerHTML = "Paragraph changed!";
    }else if (package.partyrole == "Fascist" && package.secretrole == "Hitler"){
        document.getElementById("Party_Role").src = "Fascistmembership.png";
        document.getElementById("Secret_Role").src = "Tenshi.png";
        document.getElementById("Fascisten_Box").innerHTML = "Paragraph changed!";
    }else{
        document.getElementById("Party_Role").src = "Wenting.png";
        document.getElementById("Secret_Role").src = "photo.jpg";
        console.log("Empty");
    }
})

function Show_Role(){
    document.getElementById("Party_Role").className = "verschijnen";
    document.getElementById("Secret_Role").className = "verschijnen";
    document.getElementById("Fascisten_Box").className = "verschijnen";
    setTimeout(function(){ document.getElementById("Secret_Role").className = "verdwijnen"; document.getElementById("Party_Role").className = "verdwijnen"; document.getElementById("Fascisten_Box").className = "verdwijnen";}, 3000);
}

sock.on("game-role", (package) => {
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

//laat fascisten weten wie hitler+mede fascisten zijn
sock.on("game-nightphase", (package) => {
    console.log(package);
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

//functies om de getrokken kaarten te laten zien aan de president
sock.on("game-give-cards-president", (package) => {
    console.log(package);
    var element = document.getElementById("president-policies-popup");
    element.classList.remove("verdwijnen");
    element.classList.add("verschijnen");
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