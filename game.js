module.exports = {
    init: function(io,Clients,lobby){
        lobby.status = 'active';
        lobby.phase = 'init';
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
        //console.log(lobby)
    }
    ,
    setup: function(io,Clients,lobby,currentUser){
        lobby.phase = 'setup';
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
                    //io.to(client.id).emit("game-president-update", presidentindex);
                    io.to(client.id).emit("chat-message", `[Server]:<i> ${lobby.president} is de president deze ronde.</i> <br>`);
                    //check of de client de president is
                    if (client.username == lobby.president){
                        io.to(client.id).emit("game-choose-chancellor", lobby.players);
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
        //console.log(lobby);
    }
    ,
    chancellorRequest: function(io,Clients,Lobbies,currentUser,choice){
        Lobbies[currentUser.lobby].phase = 'chancellor-vote';
        //controlleer of het verzoek wel legitiem is (of currentUser wel de president is).
        if (currentUser.username == Lobbies[currentUser.lobby].president){
            if (currentUser.username == choice){
                io.to(currentUser.id).emit("server-alert", "Je kunt jezelf niet kiezen!");
            } else {
                Lobbies[currentUser.lobby].chancellor = choice;
                Clients.forEach((client) => {
                    io.to(client.id).emit("game-vote-chancellor", choice);
                });
                //console.log(Lobbies[currentUser.lobby]);
            }
        } else {
            return;
        }
        
    }
    ,
    chancellorVote: function(io, Clients, Lobbies,currentUser, choice){
        var lobby = Lobbies[currentUser.lobby];
        var username = currentUser.username;
        //controleer of de stem wel legitiem is (of er wel een stemronde aan de gang is)
        if (lobby.phase == 'chancellor-vote'){
            lobby.votes.push({username:username,vote:choice});
            //check of iedereen heeft gestemd.
            if (lobby.votes.length == lobby.playercap){
                lobby.phase = 'chancellor-vote-count';
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
                        lobby.votes.forEach((vote) => {
                            io.to(client.id).emit("chat-message", `[Server]:<i> ${vote.username} heeft ${vote.vote} gestemd.</i><br>`);
                        })
                        //als de meerderheid ja heeft gestemd, is de kanselier officieel gekozen
                        if (ja_votes < (lobby.playercap/2)){
                            io.to(client.id).emit("chat-message", `[Server]:<i> ${lobby.chancellor} is niet gekozen tot kanselier.</i><br>`);
                        } else {
                            var chancellorindex = lobby.players.indexOf(lobby.chancellor);
                            //io.to(client.id).emit("game-chancellor-update", chancellorindex);
                            io.to(client.id).emit("chat-message", `[Server]:<i> ${lobby.chancellor} is de kanselier deze ronde.</i><br>`);
                        }
                    } else {
                        return;
                    }
                })
                if (ja_votes < (lobby.playercap/2)){
                    lobby.chancellor = "";
                    module.exports.nextPresident(io,Clients,lobby,currentUser);
                }
                //reset de stemmen
                lobby.votes = [];
            } else {
                return;
            }
        } else {
            return;
        }
    }
    ,
    nextPresident: function(io,Clients, lobby,currentUser){
        console.log(lobby);
        var presidentindex = lobby.players.indexOf(lobby.president);
        if (presidentindex == (lobby.playercap - 1 )){
            presidentindex = 0;
        } else {
            presidentindex++;
        }
        lobby.president = lobby.players[presidentindex];
        console.log(lobby)
        Clients.forEach((client) => {
            if (client.lobby == lobby.id && client.username == lobby.president){
                io.to(client.id).emit("game-choose-chancellor", lobby.players);
                io.to(client.id).emit("chat-message", `[Server]:<i> ${lobby.president} is de president deze ronde.</i><br>`);
            } else {
                //io.to(client.id).emit("game-president-update", presidentindex);
                io.to(client.id).emit("chat-message", `[Server]: <i>${lobby.president} is de president deze ronde.</i>br>`);
            }
        })
    }
}

//Functie waarmee de President en Kanselier kan worden gekozen
//Functie waarmee gestemd kan worden en aan de hand daarvan een oordeel wordt gevormd
//Functie waarmee het beleid kan worden bepaald en weergeven
//Functie waarmee de president een rol mag inkijken
//Functie waarmee de president een speler mag vermoorden
//Functie voor vetorecht