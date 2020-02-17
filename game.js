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
        lobby.hitler = Hitler.username;
        lobby.players.splice( lobby.players.indexOf(Hitler), 1 );
        Clients.forEach((client) => {
            if (client.username == Hitler.username){
                client.partyrole = `Fascist`;
                client.secretrole = `Hitler`;
                client.alive = 'alive';
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
                    if (client.username == Fascist.username){
                        client.partyrole = `Fascist`;
                        client.secretrole = `Fascist`;
                        client.alive = 'alive';
                    } else {
                        return;
                    }
                })
            }
        }
        //rol verdeling voor de overige spelers, dus liberalen
        lobby.players.forEach((player) => {
            Clients.forEach((client) => {
                if (client.username == player.username){
                    client.partyrole = `Liberaal`;
                    client.secretrole = `Liberaal`;
                    client.alive = 'alive';
                } else {
                    return;
                }
            })
        })
        lobby.players = playersclone;
        lobby.president = lobby.players[Math.floor(Math.random() * lobby.players.length)].username;
        //console.log(lobby)
    }
    ,
    setup: function(io,Clients,lobby,currentUser){
        lobby.phase = 'setup';
        //verstuur de individuele client de rol
        var package = {
            username:currentUser.username
        };
        if (currentUser.partyrole == `Liberaal`){
            package.partyrolepath = `../images/Liberalmembership.png`;
        } else {
            package.partyrolepath = `../images/Fascistmembership.png`;
        }
        if (currentUser.secretrole == `Hitler`){
            package.secretrolepath = `../images/Tenshi.png`;
        } else if (currentUser.secretrole == `Liberaal`){
            package.secretrolepath = `../images/Liberalmember.png`;
        } else {
            package.secretrolepath = `../images/Fascistsecretrole.png`;
        }
        io.to(currentUser.id).emit("game-player-info", package);
        lobby.loaded++;
        currentUser.status = 'playing';

        //als alle clients succesvol zijn geladen, anders missen clients belangrijke informatie
        if (lobby.loaded == lobby.playercap){
            //array met de positie van de client
            var package = [];
            lobby.players.forEach((player) => {
                var position = lobby.players.indexOf(player);
                package.push({position:position,username:player.username});
            })
            //obj met informatie over wie fascisten zijn.
            var package2 = {
                hitler: '',
                fascists: []
            }
            //obj met president gerelateerde stuff
            var presidentindex = lobby.players.indexOf(lobby.players.filter(function(player){return player.username == lobby.president})[0]);
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
                    io.to(client.id).emit("game-player-position", package);
                    io.to(client.id).emit("game-drawpile-update",lobby.drawpile.length);
                    io.to(client.id).emit("game-discardpile-update",lobby.discardpile.length);
                    io.to(client.id).emit("game-president-update", presidentpackage);
                    //io.to(client.id).emit("chat-message", `[Server]:<i> ${lobby.president} is de president deze ronde.</i> <br>`);
                    //choice is een array met spelers waaruit de president een kanselier kan kiezen
                    var choice = [];
                    lobby.players.forEach((player) => {
                        //console.log(player)
                        //check of de speler de vorige ronde president/kanselier was
                        if (player.username == lobby.lastpresident || player.username == lobby.lastchancellor || player.username == lobby.president ){
                            return;
                        } else {
                            var name = Clients.filter(function(client){return client.username == player.username })[0];
                            if (name.alive == 'alive'){
                                choice.push(lobby.players.indexOf(player));
                            } else {
                                return;
                            }
                            
                        }
                    });
                    if (client.username == lobby.president){
                        io.to(client.id).emit("game-choose-chancellor", choice);
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
            });
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
        lobby.hitler = '';
        lobby.round = 0;
        lobby.lastround = [];
        lobby.played_facist_policies.splice(0,lobby.played_facist_policies.length);
        lobby.played_liberal_policies.splice(0,lobby.played_liberal_policies.length);
        lobby.drawpile.splice(0,lobby.drawpile.length);
        lobby.discardpile.splice(0,lobby.discardpile.length);
        lobby.loaded = 0;
        lobby.phase = 'inactive';
        lobby.votes.splice(0,lobby.votes.length);
        lobby.presidentcards.splice(0,lobby.presidentcards.length);
        lobby.chancellorcards.splice(0,lobby.chancellorcards.length);
        lobby.deads = 0;
        lobby.lastchancellor = '';
        lobby.lastpresident = '';
    }
    ,
    reconnect: function(io,Clients,Lobbies, currentUser){
        var lobby = Lobbies[currentUser.lobby];
        console.log(lobby)
        //verstuur de gamestate naar de opnieuw verbonden client.
        var inforpack = {
            username:currentUser.username
        };
        if (currentUser.partyrole == `Liberaal`){
            inforpack.partyrolepath = `../images/Liberalmembership.png`;
        } else {
            inforpack.partyrolepath = `../images/Fascistmembership.png`;
        }
        if (currentUser.secretrole == `Hitler`){
            inforpack.secretrolepath = `../images/Tenshi.png`;
        } else if (currentUser.secretrole == `Liberaal`){
            inforpack.secretrolepath = `../images/Liberalmember.png`;
        } else {
            inforpack.secretrolepath = `../images/Fascistsecretrole.png`;
        }
        io.to(currentUser.id).emit("game-player-info", inforpack);
        var gameRolePackage = [];
        //positie
        lobby.players.forEach((player) => {
            var position = lobby.players.indexOf(player);
            gameRolePackage.push({position:position,username:player.username});
        })
        io.to(currentUser.id).emit("game-player-position", gameRolePackage);
        //beleidskaarten stapels
        io.to(currentUser.id).emit("game-drawpile-update", lobby.drawpile.length);
        io.to(currentUser.id).emit("game-discardpile-update", lobby.discardpile.length);
        //president
        var presidentindex = lobby.players.indexOf(lobby.players.filter(function(player){return player.username == lobby.president})[0]);
        var presidentpackage = {
            president: presidentindex,
            action: 'add'
        }
        io.to(currentUser.id).emit("game-president-update", presidentpackage);
        //kanselier
        if (lobby.chancellor != ''){
            var chancellorindex = lobby.players.indexOf(lobby.players.filter(function(player){return player.username == lobby.chancellor})[0]);
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
        //verstuur verzoek om een kanselier te kiezen, mits nodig
        if (currentUser.username == lobby.president && lobby.chancellor.length == 0){
            var choice = [];
            lobby.players.forEach((player) => {
                //console.log(player)
                //check of de speler de vorige ronde president/kanselier was
                if (player.username == lobby.lastpresident || player.username == lobby.lastchancellor || player.username == lobby.president ){
                    return;
                } else {
                    var name = Clients.filter(function(client){return client.username == player.username })[0];
                    if (name.alive == 'alive'){
                        choice.push(lobby.players.indexOf(player));
                    } else {
                        return;
                    }
                    
                }
            });
            //console.log(choice)
            if (choice.length > 0){
                io.to(client.id).emit("game-choose-chancellor", choice);
            } else {
                var wchoice = [];
                lobby.players.forEach((player) => {
                    var name = Clients.filter(function(client){return client.username == player.username })[0];
                    if (name.alive == 'alive'){
                        wchoice.push(lobby.players.indexOf(player));
                    } else {
                        return;
                    }
                });
                var newchoice = wchoice[0];
                io.to(client.id).emit("game-choose-chancellor", newchoice);
            }
        } 
        //verzoek om te stemmen, mits nodig
        var voted = false;
        lobby.votes.forEach((vote) => {
            if (vote.username == currentUser.username){
                voted = true;
            } else {
                return;
            }
        });
        if (lobby.phase == 'chancellor-request' && lobby.chancellor.length != 0 && voted == false){
            io.to(currentUser.id).emit("game-vote-chancellor", lobby.chancellor);
        }
        //verstuur de stemmen naar client
        lobby.votes.forEach((vote) => {
            var index = lobby.players.indexOf(lobby.players.filter(function(player){return player.username == vote.username})[0]);
            io.to(currentUser.id).emit("game-voted", {playerindex:index,vote:vote.vote});
        });
    }
    ,
    chancellorRequest: function(io,Clients,lobby,currentUser,id){
        lobby.phase = 'chancellor-request';
        //controlleer of het verzoek wel legitiem is (of currentUser wel de president is).
        if (currentUser.username == lobby.president){
            if (currentUser.username == choice){
                io.to(currentUser.id).emit("server-alert", "Je kunt jezelf niet kiezen!");
            } else {
                var choice = lobby.players[id.slice(6,7)].username;
                lobby.chancellor = choice;
                //obj met kanselier gerelateerde stuff
                var chancellorindex = lobby.players.indexOf(lobby.players.filter(function(player){return player.username == choice})[0]);
                var chancellorpackage = {
                    chancellor: chancellorindex,
                    action: 'add'
                }
                var array  = [];
                lobby.players.forEach((player) => {
                    if ( player.username == lobby.president || player.username == lobby.lastpresident || player.username == lobby.lastchancellor ){
                        return;
                    } else {
                        array.push(lobby.players.indexOf(player));
                        
                    }
                })
                Clients.forEach((client) => {
                    //check of de client wel in de huidige lobby zit.
                    if (client.lobby == lobby.id){
                        io.to(client.id).emit("game-chooce-chancellor-succes", array);
                        io.to(client.id).emit("game-chancellor-update", chancellorpackage);
                        if (client.alive == 'alive'){
                            io.to(client.id).emit("game-vote-chancellor", choice);
                        } else {
                            return;
                        }
                        
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
            //check of de client al heeft gestemd.
            var voted = false;
            lobby.votes.forEach((vote) => {
                if (vote.username == currentUser.username){
                    voted = true
                    io.to(currentUser.id).emit("server-alert", `Je hebt al gestemd.`)
                } else {
                    return;
                }
            });
            if (voted == false){
                var pack = {username:username,vote:choice}
                lobby.votes.push(pack);
                var playerindex = lobby.players.indexOf(lobby.players.filter(function(player){ return player.username == currentUser.username})[0]);
                Clients.forEach((client) => {
                    if (client.lobby == lobby.id){
                        io.to(client.id).emit("game-voted",{playerindex:playerindex,vote:pack.vote})
                    } else {
                        return;
                    }
                })
            }
            var maxVote = lobby.playercap - lobby.deads;
            //check of iedereen heeft gestemd.
            if (lobby.votes.length == maxVote){
                lobby.phase = 'chancellor-vote-count';
                lobby.round++;
                //tel alle ja stemmen
                var ja_votes = 0;
                lobby.votes.forEach((vote) => {
                    if (vote.vote == "ja"){
                        ja_votes++;
                    } else {
                        return;
                    }
                });
                var result = 'mislukt';
                if (ja_votes > (maxVote)/2){
                    result = 'succes';
                    //kijk of de benoemde kanselier hitler is, zo ja => fascisten winnen
                    if (lobby.chancellor == lobby.hitler && lobby.played_facist_policies.length >= 3){
                        module.exports.win(io,Clients,lobby,'fascisten', 'Hitler is kanselier geworden.');
                    } else {
                        //stuur de uitslag naar de clients
                        Clients.forEach((client) => {
                            if (client.lobby == lobby.id){
                                io.to(client.id).emit("chat-message", `[Server]:<i> -Ronde ${lobby.round}-</i><br>`);
                                lobby.votes.forEach((vote) => {
                                    io.to(client.id).emit("chat-message", `[Server]:<i> ${vote.username} heeft ${vote.vote} gestemd.</i><br>`);
                                });
                                io.to(client.id).emit("chat-message", `[Server]:<i> -Uitslag: ${result}-</i><br>`);
                            } else {
                                return;
                            }
                        })
                        //reset votes
                        lobby.votes = [];
                        module.exports.giveCardsPresident(io,Clients,lobby);
                    }
                } else {
                    //reset de stemmen
                    //console.log("president opneiwue gekozenaldfksj")
                    lobby.faillures++;
                    lobby.votes = [];
                    Clients.forEach((client) => {
                        if (client.lobby == lobby.id){
                            io.to(client.id).emit("game-vote-resolved", lobby.playercap);
                            io.to(client.id).emit("chat-message", `[Server]:<i> -Ronde ${lobby.round}-</i><br>`);
                                lobby.votes.forEach((vote) => {
                                    io.to(client.id).emit("chat-message", `[Server]:<i> ${vote.username} heeft ${vote.vote} gestemd.</i><br>`);
                                });
                                io.to(client.id).emit("chat-message", `[Server]:<i> -Uitslag: ${result}-</i><br>`);
                        } else {
                            return;
                        }
                    });
                    module.exports.nextPresident(io,Clients,lobby);
                    
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
        lobby.lastpresident = lobby.president;
        lobby.lastchancellor = lobby.chancellor;
        //console.log(lobby);
        //maak de persoon rechts(volgende in de array) van de huidige president de nieuwe president
        var presidentindex = lobby.players.indexOf(lobby.players.filter(function(player){return player.username == lobby.president})[0]);
        //obj met president gerelateerde stuff
        var presidentpackage = {
            president: presidentindex,
            action: 'remove'
        }
        validatepresident();
        //check of de nieuwe president wel leeft
        function validatepresident(){
            //update president index
            if (presidentindex == (lobby.playercap - 1 )){
                presidentindex = 0;
            } else {
                presidentindex++;
            }
            var name = lobby.players[presidentindex].username;
            var test;
            Clients.forEach((client) => {
                if (client.username == name){
                    if (client.alive == 'alive'){
                        lobby.president = lobby.players[presidentindex].username;
                    } else {
                        validatepresident()
                    }
                } else {
                    return;
                }
            });
        }
        
        //obj met nieuwe president gerelateerde stuff
        var newpresidentpackage = {
            president: presidentindex,
            action: 'add'
        }
        //obj met kanselier gerelateerde stuff
        var chancellorindex = lobby.players.indexOf(lobby.players.filter(function(player){return player.username == lobby.chancellor})[0]);
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
                    var choice = [];
                    lobby.players.forEach((player) => {
                        //console.log(player)
                        //check of de speler de vorige ronde president/kanselier was
                        if (player.username == lobby.lastpresident || player.username == lobby.lastchancellor || player.username == lobby.president ){
                            return;
                        } else {
                            var name = Clients.filter(function(client){return client.username == player.username })[0];
                            if (name.alive == 'alive'){
                                choice.push(lobby.players.indexOf(player));
                            } else {
                                return;
                            }
                            
                        }
                    });
                    if (choice.length > 0){
                        io.to(client.id).emit("game-choose-chancellor", choice);
                    } else {
                        var choice = [];
                        lobby.players.forEach((player) => {
                            var name = Clients.filter(function(client){return client.username == player.username })[0];
                            if (name.alive == 'alive'){
                                choice.push(lobby.players.indexOf(player));
                            } else {
                                return;
                            }
                        });
                        var newchoice = choice[0];
                        io.to(client.id).emit("game-choose-chancellor", newchoice);
                    }
                    
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
                    io.to(client.id).emit("game-vote-resolved", lobby.playercap);
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
            module.exports.resolveGameboard(io,Clients,lobby,chosenCard);
        }
    }
    ,
    resolveGameboard: function(io,Clients,lobby,chosenCard){
        lobby.phase = 'resolve-gameboard';
        //console.log(lobby.played_facist_policies.length);
        //check voor wincondities
        if (lobby.played_liberal_policies.length == 6){
            //liberalen hebben gewonnen
            module.exports.win(io,Clients,lobby,'Liberalen','Er zijn zes liberalen kaarten gespeeld.');
        } else if (lobby.played_facist_policies.length == 6){
            //fascisten hebben gewonnen
            module.exports.win(io,Clients,lobby,'Fascisten','Er zijn zes fascisten kaarten gespeeld.');
        } else {
            //check voor speciale acties
            if(chosenCard.type == "Fascist"){
                if (lobby.playercap < 7){
                    if (lobby.played_facist_policies.length == 3){
                        //Functie voor het bekijken van de 3 bovenste policy kaarten
                        module.exports.seeTopPolicies(io,Clients,lobby);
                    } else if (lobby.played_facist_policies.length == 4){
                        //Functie voor het schieten
                        module.exports.kill(io,Clients,lobby,'_ask');
                    } else if (lobby.played_facist_policies.length == 5){
                        //Functie voor het schieten
                        module.exports.kill(io,Clients,lobby,'_ask');
                    } else {
                        //volgende ronde
                        module.exports.nextPresident(io, Clients, lobby);
                    }
                } else if (lobby.playercap > 6 && lobby.playercap < 9){
                    if (lobby.played_facist_policies.length == 2){
                        //Functie voor het bekijken van iemand zijn rol
                        module.exports.seeRole(io, Clients, lobby, '_ask');
                    } else if (lobby.played_facist_policies.length == 3){
                        //Functie voor het kiezen van de volgende president
                        module.exports.nextPresident(io, Clients, lobby);
                    } else if (lobby.played_facist_policies.length == 4){
                        //Functie voor het schieten
                        module.exports.kill(io,Clients,lobby,'_ask');
                    } else if (lobby.played_facist_policies.length == 5){
                        //Functie voor het schieten
                        module.exports.kill(io,Clients,lobby,'_ask');
                    } else {
                        //volgende ronde
                        module.exports.nextPresident(io, Clients, lobby);
                    }
                } else if (lobby.playercap > 8 && lobby.playercap < 11){
                    if (lobby.played_facist_policies.length == 1){
                        //Funcite voor het bekijken van iemand zijn rol
                        module.exports.seeRole(io, Clients, lobby, '_ask');
                    } else if (lobby.played_facist_policies.length == 2){
                        //Functie voor het bekijken van iemand zijn rol
                        module.exports.seeRole(io, Clients, lobby, '_ask');
                    } else if (lobby.played_facist_policies.length == 3){
                        //Functie voor het kiezen van de volgende president
                        module.exports.nextPresident(io, Clients, lobby);
                    } else if (lobby.played_facist_policies.length == 4){
                        //Functie voor het schieten
                        module.exports.kill(io,Clients,lobby,'_ask');
                    } else if (lobby.played_facist_policies.length == 5){
                        //Functie voor het schieten
                        module.exports.kill(io,Clients,lobby,'_ask');
                    } else {
                        //volgende ronde
                        module.exports.nextPresident(io, Clients, lobby);
                    }
                }
            } else {
                //volgende ronde
                module.exports.nextPresident(io, Clients, lobby);
            }
        }
        
    }
    ,
    win: function(io,Clients,lobby,party,reason){
        lobby.phase = 'game-win';
        Clients.forEach((client) => {
            if (client.lobby == lobby.id){
                io.to(client.id).emit("game-win", `De ${party} hebben gewonnen. ${reason}`);
            } else {
                return
            }
        });
        //reset de lobby
        module.exports.reset(io,Clients,lobby,'_win');
    }
    ,
    //Speciale acties:
    seeTopPolicies: function(io,Clients,lobby){
        var president;
        Clients.forEach((client) => {
            if (lobby.president == client.username){
                president = client;
            } else {
                return
            }
        });
        var package = [];
        for (var i = 0; i < 3; i++){
            package.push(lobby.drawpile[i]);
        }
        //console.log(package)
        io.to(president.id).emit("game-see-top-policy", package);
    }
    ,
    kill: function(io,Clients,lobby,action){
        var president;
        Clients.forEach((client) => {
            if (lobby.president == client.username){
                president = client;
            } else {
                return
            }
        });
        //als de parameter 'action' gelijk is een de string('_ask'), laat de president iemand kiezen
        //als de parameter niet gelijk is aan de string, dood de persoon wiens naam in de var 'action' staat.
        if (action == '_ask'){
            var choice = [];
            lobby.players.forEach((player) => {
                //console.log(player)
                //check of de speler de vorige ronde president/kanselier was
                if (player.username == lobby.president ){
                    return;
                } else {
                    var name = Clients.filter(function(client){return client.username == player.username })[0];
                    if (name.alive == 'alive'){
                        choice.push(lobby.players.indexOf(player));
                    } else {
                        return;
                    }
                    
                }
            });
            io.to(president.id).emit("game-kill", choice);
        } else {
            var name = lobby.players[action.slice(6,7)].username;
            var chosen = Clients.filter(function(client){
                return client.username == name;
            })[0];
            var choice = [];
            lobby.players.forEach((player) => {
                //console.log(player)
                //check of de speler de vorige ronde president/kanselier was
                if (player.username == lobby.president ){
                    return;
                } else {
                    var name = Clients.filter(function(client){return client.username == player.username })[0];
                    if (name.alive == 'alive'){
                        choice.push(lobby.players.indexOf(player));
                    } else {
                        return;
                    }
                    
                }
            });
            io.to(president.id).emit("game-kill-request-succes", choice);
            Clients.forEach((client) => {
                if (client.lobby == lobby.id){
                    io.to(client.id).emit("game-kill-succes", action.slice(6,7));
                    io.to(client.id).emit("chat-message", `[Server]: ${lobby.president} heeft ${chosen.username} vermoord.<br>`);
                } else {
                    return
                }
            });
            chosen.alive = 'dead';
            lobby.deads = lobby.deads + 1;
            if (lobby.hitler == name){
                //liberalen hebben gewonnen
                module.exports.win(io,Clients, lobby, 'Liberalen', "Hilter is dood.")
            } else {
                module.exports.nextPresident(io, Clients, lobby);
            }
            
        }
    },
    seeRole: function(io,Clients,lobby,action){
        var president;
        //loop door de clientlijst en verkrijg de huidige president van de lobby
        Clients.forEach((client) => {
            if (lobby.president == client.username){
                president = client;
            } else {
                return;
            }
        });
        //als actie gelijk is aan '_ask' betekent dit dat de server de functie roept, ipv een client. Dus moet er nog een keuze worden gemaakt door de speler.
        if (action == '_ask'){
            var choice = [];
            lobby.players.forEach((player) => {
                //console.log(player)
                //check of de speler de vorige ronde president/kanselier was
                if (player.username == lobby.president ){
                    return;
                } else {
                    var name = Clients.filter(function(client){return client.username == player.username })[0];
                    if (name.alive == 'alive'){
                        choice.push(lobby.players.indexOf(player));
                    } else {
                        return;
                    }
                    
                }
            });
            io.to(president.id).emit("game-see-role", choice);
        } else {
            var name = lobby.players[action.slice(6,7)].username;
            var choice = Clients.filter(function(client){return client.username == name })[0]
            var package = {
                username: choice.username,
            }
            if (choice.partyrole == 'Liberaal'){
                package.partyrolepath = `../images/Liberalmembership.png`;
            } else {
                package.partyrolepath = `../images/Fascistmembership.png`;
            }
            var pack = [];
            lobby.players.forEach((player) => {
                //console.log(player)
                //check of de speler de vorige ronde president/kanselier was
                if ( player.username == lobby.president ){
                    return;
                } else {
                    var name = Clients.filter(function(client){return client.username == player.username })[0];
                    if (name.alive == 'alive'){
                        pack.push(lobby.players.indexOf(player));
                    } else {
                        return;
                    }
                    
                }
            });
            io.to(president.id).emit("game-see-role-request-succes", pack)
            io.to(president.id).emit("game-seen-role", package);
        }
    }

}
