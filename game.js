module.exports = {
    init: function(io,Clients,lobby){
        lobby.status = 'active';
        //clone de spelerslijst in de lobby
        playersclone = [];
        lobby.players.forEach((player) => {
            playersclone.push(player);
        })
        Clients.forEach((client) => {
            if (client.lobby == lobby.id){
                io.to(client.id).emit("redirect-client", `/Gameboards/Gameboard${lobby.playercap}p.html`);
            } else {
                return;
            }
        })
        //genereer array met de beleidskaarten
        function policy(type){
            this.type = type,
            this.played = 'false',
            this.path = 'images/card.png';
        }
        var Policies = [new policy('Liberal'), new policy('Liberal'), new policy('Liberal'), new policy('Liberal'), new policy('Liberal'), new policy('Liberal'), new policy('Fascist'),
        new policy('Fascist'),new policy('Fascist'),new policy('Fascist'),new policy('Fascist'),new policy('Fascist'),new policy('Fascist'),new policy('Fascist'),new policy('Fascist'),
        new policy('Fascist'),new policy('Fascist'),];
        //'schut' de beleidskaarten array
        Policies.sort(() => Math.random() - 0.5);
        lobby.drawpile = Policies;
        //Functies voor de rolverdeling
        var Hitler = lobby.players[Math.floor(Math.random() * lobby.players.length)];
        lobby.players.splice( lobby.players.indexOf(Hitler), 1 );
        Clients.forEach((client) => {
            if (client.username == Hitler){
                client.partyrole = `Fascist`;
                client.secretrole = `Hitler`;
                //verstuur de client de rol
                io.to(client.id).emit("game-role", {party: client.partyrole, secret:client.secretrole})
            } else {
                return;
            }
        })
        if (lobby.playercap == 5){
            selectFascists(1);
        } else if (lobby.playercap == 7){
            selectFascists(2);
        } else if (lobby.playercap == 9){
            selectFascists(3);
        } else {
            return;
        }
        function selectFascists(amount){
            for (i = 0; i < amount; i++){
                var Fascist = lobby.players[Math.floor(Math.random() * lobby.players.length)];
                lobby.players.splice( lobby.players.indexOf(Fascist), 1 );
                Clients.forEach((client) => {
                    if (client.username == Fascist){
                        client.partyrole = `Fascist`;
                        client.secretrole = `Fascist`;
                        //verstuur de client de rol
                        io.to(client.id).emit("game-role", {party: client.partyrole, secret:client.secretrole})
                    } else {
                        return;
                    }
                })
            }
        }
        lobby.players.forEach((lobby) => {
            Clients.forEach((client) => {
                if (client.username == lobby){
                    client.partyrole = `Liberaal`;
                    client.secretrole = `Liberaal`;
                } else {
                    return;
                }
            })
        })
        lobby.players = playersclone;
        console.log(lobby)
    }
    ,
    setup: function(io,Clients,lobby,currentUser){
        //verstuur de individuele client de rol
        var package = {
            partyrole: currentUser.partyrole,
            secretrole: currentUser.secretrole,
            username: currentUser.username
        }
        io.to(currentUser.id).emit("player-info", package)
        lobby.loaded++;

        //verstuur alle clients in de lobby de positie van de client
        //als alle clients succesvol zijn geladen, anders missen clients belangrijke informatie
        if (lobby.loaded == lobby.playercap){
            var package = [];
            lobby.players.forEach((player) => {
                var position = lobby.players.indexOf(player);
                package.push({position:position,username:player});
            })
            Clients.forEach((client) => {
                if (client.lobby == lobby.id){
                    io.to(client.id).emit("game-role", package);
                    //nooit alle data versturen naar de client, want client kan javascript manipuleren op de clientside
                    io.to(client.id).emit("game-draw-pile-update",lobby.drawpile.length)



                } else {
                    return;
                }
            })
        } else {
            return;
        }
    }
}

//Functie waarmee de President en Kanselier kan worden gekozen
//Functie waarmee gestemd kan worden en aan de hand daarvan een oordeel wordt gevormd
//Functie waarmee het beleid kan worden bepaald en weergeven
//Functie waarmee de president een rol mag inkijken
//Functie waarmee de president een speler mag vermoorden
//Functie voor vetorecht