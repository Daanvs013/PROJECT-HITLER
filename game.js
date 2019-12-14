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
        lobby.president = lobby.players[Math.floor(Math.random() * lobby.players.length)];
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

        //als alle clients succesvol zijn geladen, anders missen clients belangrijke informatie
        if (lobby.loaded == lobby.playercap){
            //array met de positie van de client
            var package = [];
            lobby.players.forEach((player) => {
                var position = lobby.players.indexOf(player);
                package.push({position:position,username:player});
            })
            //obj met informatie over wie fascisten zijn.
            var package2 = {
                hitler: '',
                fascists: []
            }
            //loop door alle clients heen
            Clients.forEach((client) => {
                //check of de client wel in de juiste lobby zit
                if (client.lobby == lobby.id){
                    //als de geheimerol van de client hitler of fascist is, voeg ze toe aan package2
                    if (client.secretrole == "Hitler"){
                        package2.hitler = client.username;
                    }
                    if (client.secretrole == "Fascist"){
                        package2.fascists.push(client.username);
                    }
                    io.to(client.id).emit("game-role", package);
                    //nooit alle data versturen naar de client, want client kan javascript manipuleren op de clientside
                    io.to(client.id).emit("game-drawpile-update",lobby.drawpile.length);
                    io.to(client.id).emit("game-discardpile-update",lobby.discardpile.length);
                    var presidentindex = lobby.players.indexOf(lobby.president);
                    io.to(client.id).emit("game-president-update", presidentindex);
                    //check of de client de president is
                    if (client.username == lobby.president){
                        io.to(client.id).emit("game-choose-chancelor", lobby.players)
                    } else {
                        return;
                    }
                } else {
                    return;
                }
            });
            //verstuur package2 naar alle fascisten, maar niet naar hitler
            Clients.forEach((client) => {
                if (client.partyrole == "Fascist" && client.secretrole != "Hitler"){
                    io.to(client.id).emit("game-nightphase", package2);
                } else {
                    return;
                }
            })
        } else {
            return;
        }
    }
    ,
    chancelorRequest: function(io,Clients,Lobbies,currentUser,choice){
        if (currentUser.username == choice){
            io.to(currentUser.id).emit("server-alert", "Je kunt jezelf niet kiezen!");
        } else {
            Lobbies[currentUser.lobby].chancelor = choice;
            Clients.forEach((client) => {
                io.to(client.id).emit("game-vote-chancelor", choice);
            });
        }
    }
    ,
    chancelorVote: function(io, Clients, Lobbies,currentUser, choice){
        var lobby = Lobbies[currentUser.lobby];
        var username = currentUser.username;
        lobby.votes.push({username:username,vote:choice});
        //check of iedereen heeft gestemd.
        if (lobby.votes.length == lobby.playercap){
            //tel alle ja stemmen
            var ja_votes = 0;
            lobby.votes.forEach((vote) => {
                if (vote.vote == "Ja"){
                    ja_votes++;
                } else {
                    return;
                }
            });
            Clients.forEach((client) => {
                if (client.lobby == lobby.id){
                    io.to(client.id).emit("game-chancelor-vote-result", lobby.votes);
                    //als de meerderheid ja heeft gestemd, is de kanselier officieel gekozen
                    if (ja_votes < (lobby.playercap/2)){
                        lobby.chancelor = "";
                    } else {
                        var chancelorindex = lobby.players.indexOf(lobby.chancelor);
                        io.to(client.id).emit("game-chancelor-update", chancelorindex);
                    }
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
