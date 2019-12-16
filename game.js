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
            this.played = false,
            this.path = 'images/card.png';
        }
        var Policies = [new policy('Liberal'), new policy('Liberal'), new policy('Liberal'), new policy('Liberal'), new policy('Liberal'), new policy('Liberal'), new policy('Fascist'),
        new policy('Fascist'),new policy('Fascist'),new policy('Fascist'),new policy('Fascist'),new policy('Fascist'),new policy('Fascist'),new policy('Fascist'),new policy('Fascist'),
        new policy('Fascist'),new policy('Fascist'),];
        //'schut' de beleidskaarten array
        Policies.sort(() => Math.random() - 0.5);
        lobby.drawpile = Policies;
        //rolverdeling voor Hitler
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
        //rolverdeling voor de fascisten, exclusief Hitler
        if (lobby.playercap >= 5 && lobby.playercap < 7){
            selectFascists(1);
        } else if (lobby.playercap >= 7 && lobby.playercap < 9){
            selectFascists(2);
        } else if (lobby.playercap >= 9){
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
        //rol verdeling voor de overige spelers, dus liberalen
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
            //obj met president gerelateerde stuff
            var presidentindex = lobby.players.indexOf(lobby.president);
            var presidentpackage = {
                president: presidentindex,
                action: 'add'
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
                    io.to(client.id).emit("game-president-update", presidentpackage);
                    //io.to(client.id).emit("chat-message", `[Server]:<i> ${lobby.president} is de president deze ronde.</i> <br>`);
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
    reset: function(io, Clients, Lobbies,currentUser){
        console.log('lobby reset init');
        var lobby = Lobbies[currentUser.lobby];
        //reset de lobby eigenschappen
        lobby.status = 'inactive';
        lobby.players = [];
        lobby.president = '';
        lobby.chancellor = '';
        lobby.faillures = '';
        lobby.played_facist_policies = 0;
        lobby.played_liberal_policies = 0;
        lobby.drawpile = [];
        lobby.discardpile = [];
        lobby.loaded = 0;
        lobby.phase = 'inactive';
        lobby.votes = [];
        lobby.presidentcards = [];
        lobby.chancellorcards = [];
        //geef feedback aan de clients in de desbetreffende lobby
        Clients.forEach((client) => {
            if (client.lobby == lobby.id){
                client.partyrole = undefined;
                client.secretrole = undefined;
                client.lobby = undefined;
                io.to(client.id).emit("server-alert", `${currentUser.username} heeft het spel verlaten. Je wordt terug gestuurd naar de lobby.`);
                io.to(client.id).emit("redirect-client", `../lobby.html`);
            } else {
                return;
            }
        })
    }
    ,
    chancellorRequest: function(io,Clients,Lobbies,currentUser,choice){
        var lobby = Lobbies[currentUser.lobby]
        lobby.phase = 'chancellor-vote';
        //controlleer of het verzoek wel legitiem is (of currentUser wel de president is).
        if (currentUser.username == lobby.president){
            if (currentUser.username == choice){
                io.to(currentUser.id).emit("server-alert", "Je kunt jezelf niet kiezen!");
            } else {
                lobby.chancellor = choice;
                //obj met kanselier gerelateerde stuff
                var chancellorindex = lobby.players.indexOf(choice);
                var chancellorpackage = {
                    chancellor: chancellorindex,
                    action: 'add'
                }
                Clients.forEach((client) => {
                    io.to(client.id).emit("game-chancellor-update", chancellorpackage);
                    io.to(client.id).emit("game-vote-chancellor", choice);
                });
                //console.log(lobby);
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
                //stuur de uitslag naar de clients
                Clients.forEach((client) => {
                    if (client.lobby == lobby.id){
                        io.to(client.id).emit("chat-message", `[Server]:<i> --------</i><br>`);
                        lobby.votes.forEach((vote) => {
                            io.to(client.id).emit("chat-message", `[Server]:<i> ${vote.username} heeft ${vote.vote} gestemd.</i><br>`);
                        });
                        io.to(client.id).emit("chat-message", `[Server]:<i> --------</i><br>`);
                    } else {
                        return;
                    }
                })
                //als de verkiezing is mislukt, kies volgende president
                if (ja_votes < (lobby.playercap/2)){
                    module.exports.nextPresident(io,Clients,lobby);
                } else { //anders, ga door naar kaart onthulling
                    module.exports.giveCardsPresident(io,Clients,lobby);
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
    nextPresident: function(io,Clients, lobby){
        //console.log(lobby);
        //maak de persoon rechts(volgende in de array) van de huidige president de nieuwe president
        var presidentindex = lobby.players.indexOf(lobby.president);
        //obj met president gerelateerde stuff
        var presidentpackage = {
            president: presidentindex,
            action: 'remove'
        }
        if (presidentindex == (lobby.playercap - 1 )){
            presidentindex = 0;
        } else {
            presidentindex++;
        }
        lobby.president = lobby.players[presidentindex];
        //obj met nieuwe president gerelateerde stuff
        var newpresidentpackage = {
            president: presidentindex,
            action: 'add'
        }
        //obj met kanselier gerelateerde stuff
        var chancellorindex = lobby.players.indexOf(lobby.chancellor);
        var chancellorpackage = {
            chancellor: chancellorindex,
            action: 'remove'
        }
        lobby.chancellor = "";
        //console.log(lobby)
        Clients.forEach((client) => {
            io.to(client.id).emit("game-president-update", presidentpackage);
            io.to(client.id).emit("game-president-update", newpresidentpackage);
            io.to(client.id).emit("game-chancellor-update", chancellorpackage);
            if (client.lobby == lobby.id && client.username == lobby.president){
                io.to(client.id).emit("game-choose-chancellor", lobby.players);
            } else {
                return;
            }

        });
    }
    ,
    drawCards(lobby,amount){
        var package = [];
        //stop de eerste drie beleidskaarten in de package array
        for (var i = 0; i < amount; i++){
            var card = lobby.drawpile[i];
            package.push(card);
        }
        //console.log(package);
        return package;
    }
    ,
    giveCardsPresident(io,Clients,lobby){
        lobby.presidentcards = module.exports.drawCards(lobby,3);
        console.log(lobby)
        Clients.forEach((client) => {
            //check wie de huidige president is in de lobby
            if (client.username == lobby.president){
                //en verstuur de drie getrokken beleidskaarten
                io.to(client.id).emit("game-give-cards-president", lobby.presidentcards);
            } else {
                return;
            }
        })
    }

}

//Functie waarmee het beleid kan worden bepaald en weergeven
//Functie waarmee de president een rol mag inkijken
//Functie waarmee de president een speler mag vermoorden
//Functie voor vetorecht