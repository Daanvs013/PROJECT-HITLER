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
server.on('error',(error) => {
	console.error("Server fout: ", error);
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
        //path is nu een array
        var path = data.path.split("/");
        //als data null is, is het een nieuwe client.
        if (data.ID == null){
            //creeër een nieuw object waarin de eigenschappen van de speler komen te staan gedurende het spel.
            var id = sock.id;
            var d = new Date();
            this[id] = {
                id: id,
                joined: [d.toLocaleDateString(), d.toLocaleTimeString()],
                connected: true,
                lobby: undefined,
                username: undefined,
            }
            //voeg het object toe aan de globale spelerlijst.
            Clients.push(this[id])
            //stuur sessieID naar de client
            sock.emit("sessionID", sock.id);
            //als de client vanuit een andere pagina dan index.html verbindt met de client, terwijl data==null is, redirect naar de inlog pagina.
            if (path[3] != "index.html"){
                sock.emit("redirect-client", `../index.html`);
            } else {
                return;
            }
        } else { //als data niet null is, dan is het een bestaande client
            var t;
            sock.emit("game-session-status", 'playing');
            Clients.forEach((client) => {
                if (client.id == data.ID){
                    t = "True";
                    client.id = sock.id;
                    sock.emit("sessionID", sock.id);
                    client.connected = true;
                    if (path[3] == "Gameboards" && client.status == 'playing'){
                        Game.reconnect(io,Lobbies,client);
                    } else {
                        if (client.lobby == undefined){
                            sock.emit("login-request-accepted", client.username);
                            sock.emit("get-active-lobbies", Lobbies);
                        } else {
                            sock.emit("login-request-accepted", client.username);
                            sock.emit("join-lobby-succes", Lobbies[client.lobby]);
                        }
                    }
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
                    username: undefined,
                }
                //voeg het object toe aan de globale spelerlijst.
                Clients.push(this[id])
                //stuur sessieID naar de client
                sock.emit("sessionID", sock.id);
                //als de client vanuit een andere pagina dan index.html verbindt met de client, terwijl de sessieID niet tussen de Clientlijst staat, redirect naar de inlog pagina.
                if (path[3] != "index.html"){
                    sock.emit("redirect-client", `../index.html`);
                } else {
                    return;
                }
            }
        }
        //console.log(Clients);
    });

    //client heeft een beforeunload event getriggered, dus de client veranderd van pagina of sluit het tabblad.
    sock.on("beforeunload", (data) => {
        //console.log(data);
        var currentUser = Clients.filter(function(client){
            return client.id == sock.id;
        })[0];
        if (currentUser == undefined){
            sock.emit("redirect-client", `../index.html`);
        } else {
            currentUser.connected = false;
            //als de client binnen 10s niet terug is gekomen, wordt dit event gezien als een disconnect ipv redirect
            setTimeout(function(){ 
                if (currentUser.connected == true){
                    //console.log(`client weer terug verbonden.`);
                } else {
                    console.log(`client ${currentUser.id} heeft de server verlaten.`);
                    //verwijder de client uit zijn lobby, mits de client in een lobby zit.
                    if (currentUser.lobby != undefined){
                        //als de client in een actief spel zat, reset het spel en breng de andere clients terug naar de lobby
                        if (Lobbies[currentUser.lobby].status == 'active'){
                            Game.reset(io,Clients,Lobbies[currentUser.lobby],currentUser.username);
                        } else {
                            var entry = Lobbies[currentUser.lobby].players.filter(function(player){
                                return player.username == currentUser.username
                            })[0];
                            Lobbies[currentUser.lobby].players.splice( Lobbies[currentUser.lobby].players.indexOf(entry), 1 );
                        }
                        io.emit("get-active-lobbies", Lobbies);
                    } else {
                        return;
                    }
                    //verwijder de client uit de spelerlijst.
                    Clients.splice( Clients.indexOf(currentUser), 1 );
                }
            }, 10000);
        }
    });

    //login
    sock.on("login-request", (username) => {
        //validatie van de ingevoerde gebruikersnaam
        //maak een karakterset aan met regex
        var regex = /^[a-zA-Z0-9 ]+$/;
        //check of de ingevoerde gebruikersnaam voldoet aan de karakterset
        if (regex.test(username)){
            //check lengte
            if (username.length < 1){
                sock.emit("server-alert", "Je opgegeven gebruikersnaam is te kort, kies een andere.")
            } 
            //check lengte
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
                    if (currentUser == undefined){
                        return;
                    } else {
                        currentUser.username = username;
                        //console.log(Clients);
                        sock.emit("redirect-client", "lobby.html");
                        sock.emit("login-request-accepted", currentUser.username);
                        sock.emit("get-active-lobbies", Lobbies);
                    }
                } else {
                    sock.emit('server-alert','Je opgegeven gebruikersnaam is al ingebruik, kies een andere.');
                }
            }
        } else {
            sock.emit("server-alert", `Gebruik alleen letters en cijfers.`);
        }
    })

    //lobby
    sock.on("join-lobby", (lobby) => {
        var currentUser = Clients.filter(function(client){
            return client.id == sock.id;
        })[0];
        //check for ghost gebruikers
        if (currentUser == undefined){
            sock.emit("redirect-client", `../index.html`);
        } else {
            //valideer client input
            if (Lobbies[lobby] == undefined){
                sock.emit("server-alert", "Server Fout, probeer het opnieuw.")
            } else {
                //check of de lobby nog niet vol zit.
                if (Lobbies[lobby].playercap == Lobbies[lobby].players.length || Lobbies[lobby].status == 'active'){
                    sock.emit("server-alert", "Deze lobby zit al vol, kies een andere.");
                } else {
                    var obj = {
                        username: currentUser.username,
                        status: 'red'
                    }
                    Lobbies[lobby].players.push(obj);
                    currentUser.lobby = lobby;
                    Clients.forEach((client) => {
                        if (client.lobby == currentUser.lobby){
                            io.to(client.id).emit("join-lobby-succes", Lobbies[currentUser.lobby]);
                        } else {
                            return
                        }
                    });
                    io.emit("get-active-lobbies", Lobbies);
                }
            }
        }
    });

    sock.on("leave-lobby", () => {
        var currentUser = Clients.filter(function(client){
            return client.id == sock.id;
        })[0];
        //check for ghost gebruikers
        if (currentUser == undefined){
            sock.emit("redirect-client", `../index.html`);
        } else {
            if (currentUser.lobby == undefined){
                return
            } else {
                var x = currentUser.lobby;
                //verwijder de speler uit zijn lobby
                var entry = Lobbies[currentUser.lobby].players.filter(function(player){
                    return player.username == currentUser.username
                })[0];
                Lobbies[currentUser.lobby].players.splice( Lobbies[currentUser.lobby].players.indexOf(entry), 1 );
                sock.emit("leave-lobby-succes", true);
                io.emit("get-active-lobbies", Lobbies);
            }
        }
    });

    sock.on("ready-status-lobby", () => {
        var currentUser = Clients.filter(function(client){
            return client.id == sock.id;
        })[0];
        //check for ghost gebruikers
        if (currentUser == undefined){
            sock.emit("redirect-client", `../index.html`);
        } else {
            if (currentUser.lobby == undefined){
                return
            } else {
                var lobby = currentUser.lobby
                var x = Lobbies[lobby].players.filter(function(player){
                    return player.username == currentUser.username;
                })[0];
                if (x.status == 'green'){
                    x.status = 'red';
                } else {
                    x.status = 'green';
                }
                
                Clients.forEach((client) => {
                    if (client.lobby == lobby){
                        io.to(client.id).emit("join-lobby-succes", Lobbies[lobby]);
                    } else {
                        return
                    }
                });
                //als de lobby vol is, start het spel
                var x = Lobbies[lobby].players.filter(function(player){
                    return player.status == 'green';
                });
                if (Lobbies[lobby].playercap == x.length){
                    Game.init(io,Clients,Lobbies[lobby]);
                } else {
                    return;
                }
            }
        }
    });

    //DEBUG
    sock.on("debug-request", (data) => {
        var pack;
        if (data == 'clients'){
            pack = Clients;
        } else if (data == 'lobbies'){
            pack = Lobbies;
        } else {
            pack = 'debug';
        }
        sock.emit("debug-request-accepted", pack);
    });

    //chat
    sock.on("chat-message-request", (message) => {
        var currentUser = Clients.filter(function(client){
            return client.id == sock.id;
        })[0];
        //check voor ghost clients
        if (currentUser == undefined){
            sock.emit("redirect-client", `../index.html`);
        } else {
            Chat.chat(io,Clients,currentUser,message);
        }
    });

    //game
    sock.on("game-redirect-succes", () => {
        var currentUser = Clients.filter(function(client){
            return client.id == sock.id;
        })[0];
        //check voor ghost clients
        if (currentUser == undefined){
            sock.emit("redirect-client", `../index.html`);
        } else {
            if (currentUser.lobby == undefined){
                sock.emit("redirect-client", `../lobby.html`);
            } else {
                if (Lobbies[currentUser.lobby].status == 'active' && currentUser.status != 'playing'){
                    Game.setup(io,Clients,Lobbies[currentUser.lobby],currentUser);
                } else {
                    return;
                }
            }
        }
    })

    sock.on("game-chancellor-choice", (choice) => {
        //console.log(choice);
        var currentUser = Clients.filter(function(client){
            return client.id == sock.id;
        })[0];
        //check voor ghost clients
        if (currentUser == undefined){
            sock.emit("redirect-client", `../index.html`);
        } else {
            Game.chancellorRequest(io,Clients,Lobbies[currentUser.lobby],currentUser,choice);
        }
    });

    sock.on("game-chancellor-vote-choice", (choice) => {
        //console.log(choice);
        var currentUser = Clients.filter(function(client){
            return client.id == sock.id;
        })[0];
        //check voor ghost clients
        if (currentUser == undefined){
            sock.emit("redirect-client", `../index.html`);
        } else {
            Game.chancellorVote(io,Clients,Lobbies,currentUser,choice);
        }
    });

    sock.on("game-chosen-cards-president", (choice) => {
        //console.log(choice);
        var currentUser = Clients.filter(function(client){
            return client.id == sock.id;
        })[0];
        //check voor ghost clients
        if (currentUser == undefined){
            sock.emit("redirect-client", `../index.html`);
        } else {
            Game.resolveCardsPresident(io,Clients,Lobbies[currentUser.lobby],choice);
        }
    });

    sock.on("game-chosen-cards-chancellor", (choice) => {
        //console.log(choice);
        var currentUser = Clients.filter(function(client){
            return client.id == sock.id;
        })[0];
        //check voor ghost clients
        if (currentUser == undefined){
            sock.emit("redirect-client", `../index.html`);
        } else {
            Game.resolveCardsChancellor(io,Clients,Lobbies[currentUser.lobby],choice);
        }
    });

    sock.on("game-seen-top-policy", () => {
        var currentUser = Clients.filter(function(client){
            return client.id == sock.id;
        })[0];
        //check voor ghost clients
        if (currentUser == undefined){
            sock.emit("redirect-client", `../index.html`);
        } else {
            Game.nextPresident(io,Clients,Lobbies[currentUser.lobby]);
        }
    });

    sock.on("game-chosen-to-kill", (choice) => {
        var currentUser = Clients.filter(function(client){
            return client.id == sock.id;
        })[0];
        //check voor ghost clients
        if (currentUser == undefined){
            sock.emit("redirect-client", `../index.html`);
        } else {
            Game.kill(io,Clients,lobby,choice);
        }
    });
})

//lobby object constructor
//is omslachtig, maar was om te kijken hoe een constructer werkt.
function lobby(id,playercap){
    this.id = id,
    this.playercap = playercap,
    this.players = [],
    this.status = 'inactive',
    this.president = '',
    this.lastpresident = '',
    this.chancellor = '',
    this.lastchancellor = '',
    this.faillures = 0,
    this.played_facist_policies = [],
    this.played_liberal_policies = [],
    this.drawpile = [],
    this.discardpile = [],
    this.loaded = 0,
    this.phase = 'inactive',
    this.votes = [],
    this.presidentcards = [],
    this.chancellorcards = [],
    this.round = 0,
    this.lastround = [],
    this.hitler = ''
}