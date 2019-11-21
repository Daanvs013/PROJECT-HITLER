//importeer modules
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
server.listen(port, () => {
	console.log(`Server gestart op poort ${port}.`);
});

//client verbonden met de server.
//met een instantie van sock wordt ook wel de client
io.on('connection', (sock) => {
    var id = sock.id;
    console.log("client verbonden met de server.");

    //emit: een verzoek vesturen naar de client
    sock.emit("Send-Name", id);

    //on: wachten op een verzoek van de client
    sock.on("Receive-Name", (parameters) => {
        console.log(parameters);
    })
})