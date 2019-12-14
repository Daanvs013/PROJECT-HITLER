//importeer modules.
var http = require('http');
var express = require('express');
var socketio = require('socket.io');
var Chat = require("./chat");
var Game = require("./game");

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
var Clients = [];
var Lobbies = [ new lobby(0,5), new lobby(1,6), new lobby(2,7), new lobby(3,8), new lobby(4,9), new lobby(5,10)];
io.on('connection', (sock) => {
    sock.on("new-session", (data) => {
        console.log(`client ${sock.id} verbonden met de server.`);
        //path
        var path = data.path.split("/");
        console.log(path)
        //als data null is, is het een nieuwe client.
        if (data.ID == null){
            //creeër een nieuw object waarin de eigenschappen van de speler komen te staan gedurende het spel.
            var id = sock.id;
            var d = new Date();
            this[id] = {
                id: id,
                joined: [d.toLocaleDateString(), d.toLocaleTimeString()],
                lobby: undefined,
                username: undefined
            }
            //voeg het object toe aan de globale spelerlijst.
            Clients.push(this[id])
            //stuur sessieID naar de client
            sock.emit("sessionID", sock.id);
        } else { //als data niet null is, dan is het een bestaande client
            var t;
            Clients.forEach((client) => {
                if (client.id == data.ID){
                    client.id = sock.id;
                    sock.emit("sessionID", sock.id);
                    sock.emit("login-request-accepted", client.username);
                    sock.emit("get-active-lobbies", Lobbies);
                    t = "True";
                } else {
                    return;
                }
            });
            if (t != "True"){
                //creeër een nieuw object waarin de eigenschappen van de speler komen te staan gedurende het spel.
                var id = sock.id;
                var d = new Date();
                this[id] = {
                    id: id,
                    joined: [d.toLocaleDateString(), d.toLocaleTimeString()],
                    lobby: undefined,
                    username: undefined
                }
                //voeg het object toe aan de globale spelerlijst.
                Clients.push(this[id])
                //stuur sessieID naar de client
                sock.emit("sessionID", sock.id);
            }
        }
        console.log(Clients);
    });

    //client verlaat de server
    sock.on("disconnect", () => {
        /*
        var currentUser = Clients.filter(function(client){
            return client.id == sock.id;
        })[0];
        console.log(`client ${sock.id} is weg gegaan.`);
        //verwijder de client uit zijn lobby
        if (Lobbies[currentUser.lobby] == undefined){
            return;
        } else {
            if (Lobbies[currentUser.lobby].status == 'active'){
                return;
            } else {
                Lobbies[currentUser.lobby].players.splice( Lobbies[currentUser.lobby].players.indexOf(currentUser), 1 );
            }
        }
        //verwijder de client uit de spelerlijst
        Clients.splice( Clients.indexOf(currentUser), 1 );
        io.emit("get-active-lobbies", Lobbies); */
    });

    //login
    sock.on("login-request", (username) => {
        //validatie van de ingevoerde gebruikersnaam
        if (username.length < 1){
            sock.emit("server-alert", "Je opgegeven gebruikersnaam is te kort, kies een andere.")
        } 
        else if (username.length > 32){
            sock.emit("server-alert", "Je opgegeven gebruikersnaam is te lang, kies een andere.")
        } else {
            //filter door de clientlijst en voeg spelers toe aan een array 'x' die dezelfde gebruikersnaam hebben als de opgegeven gebruikersnaam.
            var x = Clients.filter((player) => {
                return player.username == username;
            });
            //als de array 'x' geen entries heeft, is de ingevulde naam beschikbaar.
            if (x[0] == undefined){
                var currentUser = Clients.filter(function(client){
                    return client.id == sock.id;
                })[0];
                currentUser.username = username;
                //console.log(Clients);
                sock.emit("login-request-accepted", currentUser.username);
                sock.emit("get-active-lobbies", Lobbies);
            } else {
                sock.emit('server-alert','Je opgegeven gebruikersnaam is al ingebruik, kies een andere.');
            }
        }
    })

    //lobby
    sock.on("change-lobby", (lobby) => {
        var currentUser = Clients.filter(function(client){
            return client.id == sock.id;
        })[0];
        //check for ghost gebruikers
        if (currentUser == undefined){
            return;
        } else {
            //valideer client input
            if (Lobbies[lobby] == undefined){
                sock.emit("server-alert", "Server Fout, probeer het opnieuw.")
            } else {
                //check of de client al in de opgegeven lobby zit.
                if (currentUser.lobby == lobby){
                    return;
                } else {
                    //check of de lobby nog niet vol zit.
                    if (Lobbies[lobby].playercap == Lobbies[lobby].players.length || Lobbies[lobby].status == 'active'){
                        sock.emit("server-alert", "Deze lobby zit al vol, kies een andere.");
                    } else {
                        if (currentUser.lobby != undefined){
                            Lobbies[currentUser.lobby].players.splice( Lobbies[currentUser.lobby].players.indexOf(currentUser), 1 );
                        }
                        Lobbies[lobby].players.push(currentUser.username);
                        currentUser.lobby = lobby;
                        io.emit("get-active-lobbies", Lobbies);
                        //als de lobby vol is, start het spel
                        if (Lobbies[lobby].playercap == Lobbies[lobby].players.length){
                            Game.run(io,Clients,Lobbies[lobby]);
                        }
                    }
                }
            }
        }
    });

    //chat
    sock.on("chat-message-request", (message) => {
        var currentUser = Clients.filter(function(client){
            return client.id == sock.id;
        })[0];
        Chat.chat(io,currentUser,message);
    });

    //game
    sock.on("redirect-succes", (url) => {
        
    })
})

//lobby object constructor
//is omslachtig, maar was om te kijken hoe een constructer werkt.
function lobby(id,playercap){
    this.id = id,
    this.playercap = playercap,
    this.players = [],
    this.status = 'inactive'
}

