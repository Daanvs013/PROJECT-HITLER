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
            this.path = `../images/${type}.png`;
        }
        var Policies = [new policy('Liberal'), new policy('Liberal'), new policy('Liberal'), new policy('Liberal'), new policy('Liberal'), new policy('Liberal'), new policy('Fascist'),
        new policy('Fascist'),new policy('Fascist'),new policy('Fascist'),new policy('Fascist'),new policy('Fascist'),new policy('Fascist'),new policy('Fascist'),new policy('Fascist'),
        new policy('Fascist'),new policy('Fascist'),];
        //'schud' de beleidskaarten array
        Policies.sort(() => Math.random() - 0.5);
        lobby.drawpile = Policies;
        //rolverdeling voor Hitler
        var Hitler = lobby.players[Math.floor(Math.random() * lobby.players.length)];
        lobby.players.splice( lobby.players.indexOf(Hitler), 1 );
        Clients.forEach((client) => {
            if (client.username == Hitler){
                client.partyrole = `Fascist`;
                client.secretrole = `Hitler`;
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
        io.to(currentUser.id).emit("player-info", package);
        lobby.loaded++;
        currentUser.status = 'playing';

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

                lobby.phase = 'chancellor-vote'
            });
            //verstuur package2 naar alle fascisten, maar niet naar hitler
            Clients.forEach((client) => {
                //check of de client wel in de huidige lobby zit
                if (client.lobby == lobby.id){
                    //als er meer dan 6 spelers in het spel zitten, krijgt Hitler niet te weten wie de andere fascisten zijn.
                    if (lobby.playercap > 6){
                        if (client.partyrole == "Fascist" && client.secretrole != "Hitler" ){
                            io.to(client.id).emit("game-nightphase", package2);
                        } else {
                            return;
                        }
                    } else {
                        if (client.partyrole == 'Fascist'){
                            io.to(client.id).emit("game-nightphase", package2);
                        } else {
                            return;
                        }
                    }
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
    reset: function(io, Clients, lobby,currentUser){
        console.log('lobby reset init');
        //reset de lobby eigenschappen
        lobby.status = 'inactive';
        lobby.players.splice(0,lobby.players.length);
        lobby.president = '';
        lobby.chancellor = '';
        lobby.faillures = '';
        lobby.played_facist_policies.splice(0,lobby.played_facist_policies.length);
        lobby.played_liberal_policies.splice(0,lobby.played_liberal_policies.length);
        lobby.drawpile.splice(0,lobby.drawpile.length);
        lobby.discardpile.splice(0,lobby.discardpile.length);
        lobby.loaded = 0;
        lobby.phase = 'inactive';
        lobby.votes.splice(0,lobby.votes.length);
        lobby.presidentcards.splice(0,lobby.presidentcards.length);
        lobby.chancellorcards.splice(0,lobby.chancellorcards.length);
        //geef feedback aan de clients in de desbetreffende lobby
        Clients.forEach((client) => {
            if (client.lobby == lobby.id){
                client.partyrole = undefined;
                client.secretrole = undefined;
                client.lobby = undefined;
                client.status = 'inactive';
                io.to(client.id).emit("server-alert", `${currentUser} heeft het spel verlaten. Je wordt terug gestuurd naar de lobby.`);
                io.to(client.id).emit("redirect-client", `../lobby.html`);
            } else {
                return;
            }
        })
    }
    ,
    reconnect: function(io,Lobbies, currentUser){
        var lobby = Lobbies[currentUser.lobby];
        console.log(lobby)
        //verstuur de gamestate naar de opnieuw verbonden client.
        var infopackage = {
            username:currentUser.username,
            partyrole: currentUser.partyrole,
            secretrole: currentUser.secretrole
        }
        io.to(currentUser.id).emit("player-info", infopackage);
        var gameRolePackage = [];
        //positie
        lobby.players.forEach((player) => {
            var position = lobby.players.indexOf(player);
            gameRolePackage.push({position:position,username:player});
        })
        io.to(currentUser.id).emit("game-role", gameRolePackage);
        //beleidskaarten stapels
        io.to(currentUser.id).emit("game-drawpile-update", lobby.drawpile.length);
        io.to(currentUser.id).emit("game-discardpile-update", lobby.discardpile.length);
        //president
        var presidentindex = lobby.players.indexOf(lobby.president);
        var presidentpackage = {
            president: presidentindex,
            action: 'add'
        }
        io.to(currentUser.id).emit("game-president-update", presidentpackage);
        //kanselier
        if (lobby.chancellor != ''){
            var chancellorindex = lobby.players.indexOf(lobby.chancellor);
            var chancellorpackage = {
                chancellor: chancellorindex,
                action: 'add'
            }
            io.to(currentUser.id).emit("game-chancellor-update", chancellorpackage);
        }
        //beleidskaarten bord
        lobby.played_facist_policies.forEach((policy) => {
            io.to(currentUser.id).emit("game-fascistboard-update", policy);
        });
        lobby.played_liberal_policies.forEach((policy) => {
            io.to(currentUser.id).emit("game-liberalboard-update", policy);
        });
        if (currentUser.username == lobby.president && lobby.chancellor.length == 0){
            io.to(currentUser.id).emit("game-choose-chancellor", lobby.players);
        } 
        if (lobby.phase == 'chancellor-request' && lobby.chancellor.length != 0){
            io.to(currentUser.id).emit("game-vote-chancellor", lobby.chancellor);
        }
    }
    ,
    chancellorRequest: function(io,Clients,lobby,currentUser,choice){
        lobby.phase = 'chancellor-request';
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
                    //check of de client wel in de huidige lobby zit.
                    if (client.lobby == lobby.id){
                        io.to(client.id).emit("game-chancellor-update", chancellorpackage);
                        io.to(client.id).emit("game-vote-chancellor", choice);
                    } else {
                        return;
                    }
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
        if (lobby.phase == 'chancellor-request' && lobby.chancellor.length != 0){
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
                    //reset de stemmen
                    lobby.votes = [];
                    module.exports.nextPresident(io,Clients,lobby);
                } else { //anders, ga door naar kaart onthulling
                    //reset de stemmen
                    lobby.votes = [];
                    module.exports.giveCardsPresident(io,Clients,lobby);
                }
            } else {
                return;
            }
        } else {
            return;
        }
    }
    ,
    nextPresident: function(io,Clients, lobby){
        lobby.phase = 'chancellor-vote';
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
            if (client.lobby == lobby.id){
                io.to(client.id).emit("game-president-update", presidentpackage);
                io.to(client.id).emit("game-president-update", newpresidentpackage);
                io.to(client.id).emit("game-chancellor-update", chancellorpackage);
                if (client.username == lobby.president){
                    io.to(client.id).emit("game-choose-chancellor", lobby.players);
                } else {
                    return;
                }
            }

        });
    }
    ,
    drawCards(lobby,amount){
        lobby.phase = 'draw-cards';
        var package = [];
        //stop de eerste drie beleidskaarten in de package array
        for (var i = 0; i < amount; i++){
            var card = lobby.drawpile[i];
            lobby.drawpile.splice(lobby.drawpile.indexOf(card),1);
            package.push(card);
        }
        //console.log(package);
        return package;
    }
    ,
    giveCardsPresident(io,Clients,lobby){
        lobby.phase = 'president-policy-choice';
        //als er minder dan 3 kaarten zijn in de drawpile, stop de discardpile weer bij de drawpile
        if (lobby.drawpile.length > 2){
            lobby.presidentcards = module.exports.drawCards(lobby,3);
        } else {
             lobby.discardpile.forEach((card => {
                 lobby.drawpile.push(card);
             }))
             lobby.discardpile = [];
             //'schud' de beleidskaarten array
            lobby.drawpile.sort(() => Math.random() - 0.5);
            lobby.presidentcards = module.exports.drawCards(lobby,3);
         }
        //console.log(lobby)
        Clients.forEach((client) => {
            if (client.lobby == lobby.id){
                io.to(client.id).emit("game-drawpile-update", lobby.drawpile.length);
                io.to(client.id).emit("game-discardpile-update", lobby.discardpile.length);
            } else {
                return;
            }
            //check wie de huidige president is in de lobby
            if (client.username == lobby.president){
                //en verstuur de drie getrokken beleidskaarten
                io.to(client.id).emit("game-give-cards-president", lobby.presidentcards);
            } else {
                return;
            }
        });
    }
    ,
    resolveCardsPresident(io,Clients,lobby, choice){
        lobby.phase = 'president-policy-resolve';
        //valideer de keuze van de speler
        if (choice < 0 || choice > 2){
            return;
        } else {
            var chosenCard = lobby.presidentcards[choice];
            //stop de gekozen kaart in de discardstapel
            lobby.discardpile.push(chosenCard);
            //verwijder de gekozen kaart uit de presidentscard array
            lobby.presidentcards.splice(lobby.presidentcards.indexOf(chosenCard), 1);
            //voeg de overgebleven kaarten toe aan de chancellorcards array
            lobby.presidentcards.forEach((card) => {
                lobby.chancellorcards.push(card);
            })
            //reset de presidentcards array
            lobby.presidentcards = []
            //geef feedback aan de spelers
            Clients.forEach((client) => {
                if (client.lobby == lobby.id){
                    io.to(client.id).emit("game-discardpile-update", lobby.discardpile.length);
                } else {
                    return;
                }
            })
            module.exports.giveCardsChancellor(io, Clients, lobby);
        }
    }
    ,
    giveCardsChancellor(io,Clients,lobby){
        lobby.phase = 'chancellor-policy-choice';
        //console.log(lobby);
        Clients.forEach((client) => {
            //check wie de huidige kanselier is in de lobby
            if (client.username == lobby.chancellor && client.lobby == lobby.id){
                //en verstuur de twee overgebleven beleidskaarten
                io.to(client.id).emit("game-give-cards-chancellor", lobby.chancellorcards);
            } else {
                return;
            }
        });
    }
    ,
    resolveCardsChancellor(io, Clients, lobby, choice){
        lobby.phase = 'chancellor-policy-resolve';
        //valideer de keuze van de speler
        if (choice < 0 || choice > 1){
            return;
        } else {
            var chosenCard = lobby.chancellorcards[choice];
            //stop de gekozen kaart in de played[x]stapel
            if (chosenCard.type == 'Fascist'){
                chosenCard.played = true;
                lobby.played_facist_policies.push(chosenCard);
            } else if (chosenCard.type == 'Liberal'){
                chosenCard.played = true;
                lobby.played_liberal_policies.push(chosenCard);
            } else {
                return;
            }
            //verwijder de gekozen kaart uit de chancellorcards array
            lobby.chancellorcards.splice(lobby.chancellorcards.indexOf(chosenCard), 1);
            //voeg de overgebleven kaart toe aan de discardpile
            lobby.discardpile.push(lobby.chancellorcards[0]);
            //reset de chancellorcards array
            lobby.chancellorcards.splice(0,lobby.chancellorcards.length);
            //verstuur feedback naar de spelers
            Clients.forEach((client) => {
                //check of de client in de huidige lobby zit
                if (client.lobby == lobby.id){
                    io.to(client.id).emit("game-discardpile-update", lobby.discardpile.length);
                    if (chosenCard.type == 'Fascist'){
                        io.to(client.id).emit('game-fascistboard-update', chosenCard);
                    } else {
                        io.to(client.id).emit('game-liberalboard-update', chosenCard);
                    }
                } else {
                    return;
                }
            });
            //console.log(lobby);
            //check of er acties moeten worden ondernomen omdat er x aantal beleidskaarten liggen
            module.exports.resolveGameboard(io,Clients,lobby);
        }
    }
    ,
    resolveGameboard: function(io,Clients,lobby){
        lobby.phase = 'resolve-gameboard';
        //check voor wincondities
        if (lobby.played_liberal_policies.length == 6){
            //liberalen hebben gewonnen
            module.exports.win(io,Clients,lobby,'Liberaal');
        }
        if (lobby.played_facist_policies == 6){
            //fascisten hebben gewonnen
            module.exports.win(io,Clients,lobby,'Fascisten');
        }
        //check voor speciale acties
        if (lobby.playercap < 7){
            if (lobby.played_facist_policies == 3){
                //Functie voor het bekijken van de 3 bovenste policy kaarten
            } else if (lobby.played_facist_policies == 4){
                //Functie voor het schieten
            } else if (lobby.played_facist_policies == 5){
                //Functie voor het schieten + vetorecht
            } else {
                //einde van een ronde, kies een nieuwe president
                module.exports.nextPresident(io, Clients, lobby);
            }
        } else if (lobby.playercap > 6 && lobby.playercap < 9){
            if (lobby.played_facist_policies == 2){
                //Functie voor het bekijken van iemand zijn rol
            } else if (lobby.played_facist_policies == 3){
                //Functie voor het kiezen van de volgende president

            } else if (lobby.played_facist_policies == 4){
                //Functie voor het schieten
                
            } else if (lobby.played_facist_policies == 5){
                //Functie voor het schieten + vetorecht
                
            } else {
                //einde van een ronde, kies een nieuwe president
                module.exports.nextPresident(io, Clients, lobby);
            }
        } else if (lobby.playercap > 8 && lobby.playercap < 11){
            if (lobby.played_facist_policies == 1){
                //Funcite voor het bekijken van iemand zijn rol
            } else if (lobby.played_facist_policies == 2){
                //Functie voor het bekijken van iemand zijn rol
            } else if (lobby.played_facist_policies == 3){
                //Functie voor het kiezen van de volgende president

            } else if (lobby.played_facist_policies == 4){
                //Functie voor het schieten
                
            } else if (lobby.played_facist_policies == 5){
                //Functie voor het schieten + vetorecht
                
            } else {
                //einde van een ronde, kies een nieuwe president
                module.exports.nextPresident(io, Clients, lobby);
            }
        }
    }
    ,
    win: function(io,Clients,lobby,party){
        lobby.phase = 'game-win';
        Clients.forEach((client) => {
            if (client.lobby == lobby.id){
                io.to(client.id).emit("server-alert", `${party} hebben gewonnen.`)
            } else {
                return
            }
        });
        //reset de lobby
        module.exports.reset(io,Clients,lobby,'spel gestopt');
    }

}