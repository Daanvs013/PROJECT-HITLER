//importeer modules.
var http = require('http');
var express = require('express');
var socketio = require('socket.io');

//initialiseer de server
var app = express();
//een client(browser) mag alleen toegang hebben tot de client map.
var clientPath = `${__dirname}/client`;
app.use(express.static(clientPath));
var server = http.createServer(app);
var io = socketio(server);
var port = 8080;

//error handeling voor het opstarten van de server.
server.on('error',(err) => {
	console.error("Server fout: ", err);
});

//opstarten van de server.
//'process.env.PORT' is voor Heroku, port is voor lokale server.
server.listen(process.env.PORT || port, () => {
	console.log(`Server gestart op poort ${port}.`);
});

//client verbonden met de server.
//met een instantie van sock(et) wordt ook wel de client bedoeld.
var Players = [];
var Lobbies = [ new lobby(0,5), new lobby(1,6), new lobby(2,7), new lobby(3,8), new lobby(4,9), new lobby(5,10)];
io.on('connection', (sock) => {
    console.log("client verbonden met de server.");
    //creeër een nieuw object waarin de eigenschappen van de speler komen te staan gedurende het spel.
    var id = sock.id;
    var d = new Date();
    this[id] = {
        id: id,
        joined: [d.toLocaleDateString(), d.toLocaleTimeString()],
        lobby: undefined
    }
    //voeg het object toe aan de globale spelerlijst.
    Players.push(this[id])
    console.log(Players);

    //client verlaat de server
    sock.on("disconnect", () => {
        var currentUser = this[sock.id];
        //verwijder de client uit de spelerlijst
        Players.splice( Players.indexOf(currentUser), 1 );
        //verwijder de client zijn lobby
        if (Lobbies[currentUser.lobby] == undefined){
            return;
        } else {
            Lobbies[currentUser.lobby].players.splice( Lobbies[currentUser.lobby].players.indexOf(currentUser), 1 );
        }
        io.emit("get-active-lobbies", Lobbies);
    });

    /////
    //voorbeeld functies
    //sock.emit => een verzoek vesturen naar de client.
    sock.emit("Send-Name", id);

    //io.emit => een verzoek vesturen naar alle clients.
    io.emit("Send-Name", id);

    //sock.on => wachten op een verzoek van de client.
    sock.on("Receive-Name", (parameters) => {
        console.log(parameters);
    })
    /////

    //login
    sock.on("login-request", (username) => {
        //validatie van de ingevoerde gebruikersnaam
        if (username.length < 1){
            sock.emit("server-alert", "Je opgegeven gebruikersnaam is te kort, kies een andere.")
        } 
        else if (username.length > 32){
            sock.emit("server-alert", "Je opgegeven gebruikersnaam is te lang, kies een andere.")
        } else {
            //filter door de spelerlijst en voeg spelers toe aan een array 'x' die dezelfde gebruikersnaam hebben als de opgegeven gebruikersnaam.
            var x = Players.filter((player) => {
                return player.username == username;
            });
            if (x[0] == undefined){
                var currentUser = this[sock.id];
                currentUser.username = username;
                console.log(Players);
                sock.emit("login-request-accepted", currentUser.username);
                sock.emit("get-active-lobbies", Lobbies);
            } else {
                sock.emit('server-alert','Je opgegeven gebruikersnaam is al ingebruik, kies een andere.');
            }
        }
    })

    //lobby
    sock.on("change-lobby", (lobby) => {
        var currentUser = this[sock.id];
        //valideer client input
        if (Lobbies[lobby] == undefined){
            sock.emit("server-alert", "Server Fout, probeer het opnieuw.")
        } else {
            //check of de client al in de opgegeven lobby zit.
            if (currentUser.lobby == lobby){
                return;
            } else {
                //check of de lobby nog niet vol zit.
                if (Lobbies[lobby].playercap == Lobbies[lobby].players.length){
                    sock.emit("server-alert", "Deze lobby zit al vol, kies een andere.");
                } else {
                    if (currentUser.lobby != undefined){
                        Lobbies[currentUser.lobby].players.splice( Lobbies[currentUser.lobby].players.indexOf(currentUser), 1 );
                    }
                    Lobbies[lobby].players.push(currentUser.username);
                    currentUser.lobby = lobby;
                    io.emit("get-active-lobbies", Lobbies);
                }
            }
        }
    });
})

//lobby object constructor
//is omslachtig, maar was om te kijken hoe een constructer werkt.
function lobby(id,playercap){
    this.id = id,
    this.playercap = playercap,
    this.players = []
}

