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
io.on('connection', (sock) => {
    console.log("client verbonden met de server.");
    //creeër een nieuw object waarin de eigenschappen van de speler komen te staan gedurende het spel.
    var id = sock.id;
    this[id] = {
        id: id
    }
    //voeg het object toe aan de globale spelerlijst.
    Players.push(this[id])
    console.log(Players);

    //client verlaat de server
    sock.on("disconnect", () => {
        var currentUser = this[sock.id];
        //verwijder de client uit de spelerlijst
        Players.splice( Players.indexOf(currentUser), 1 );
        io.emit("lobby-queue-update", Players);
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
                io.emit("lobby-queue-update", Players);
            } else {
                sock.emit('server-alert','Je opgegeven gebruikersnaam is al ingebruik, kies een andere.');
            }
        }
    })

    //game
})