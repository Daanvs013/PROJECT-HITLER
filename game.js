module.exports = {
    run: function(io,Clients,lobby){
        lobby.status = 'active';
        console.log(lobby)
        //verkrijg de socket informatie van de spelers in de lobby
        var Players = []
        //loop door de spelerlijst die in het lobby object zit
        lobby.players.forEach((player) => {
            //loop door de clientlijst
            Clients.forEach((client) => {
                //als de username van een client overeenkomt van de spelernaam, voeg de client dan toe aan de nieuwe array genaamd Spelerlijst.
                if (client.username == player){
                    Players.push(client);
                } else {
                    return
                }
            });
        });
        Players.forEach((player) => {
            io.to(player.id).emit("server-alert", "Het spel gaat beginnen.");
            io.to(player.id).emit(`start-game`, lobby.playercap);
        })
        //Variabelen waarmee wordt aangegeven wie President en wie Kanselier is
        var President;
        var Chancellor;
        //array met de beleidkaarten
        function policy(type){
            this.type = type,
            this.played = 'false',
            this.path = 'images/card.png';
        }
        var Policies = [new policy('Liberal'), new policy('Liberal'), new policy('Liberal'), new policy('Liberal'), new policy('Liberal'), new policy('Liberal'), new policy('Fascist'),
        new policy('Fascist'),new policy('Fascist'),new policy('Fascist'),new policy('Fascist'),new policy('Fascist'),new policy('Fascist'),new policy('Fascist'),new policy('Fascist'),
        new policy('Fascist'),new policy('Fascist'),];
        //'shuffle' de Policies array
        Policies.sort(() => Math.random() - 0.5);
        console.log(Policies);
        //Variabelen die aangeven hoeveel facistische/liberale kaarten zijn opgespeeld
        var Facist_Policies = 0;
        var Liberal_Policies = 0;
        //Variabelen waarmee wordt aangegeven hoeveel samenwerkingen zijn mislukt
        var Failures = 0;
        //Functie voor de rolverdeling
        var Hitler = lobby.players[Math.floor(Math.random() * lobby.players.length)];
        lobby.players.splice( lobby.players.indexOf(Hitler), 1 );
        Players.forEach((player) => {
            if (player.username == Hitler){
                player.partyrole = `Fascist`;
                player.secretrole = `Hitler`;
            } else {
                return;
            }
        })
        if (lobby.playercap == 5){
            selectFascists();
        } else if (lobby.playercap == 7){
            selectFascists();
            selectFascists();
        } else if (lobby.playercap == 9){
            selectFascists();
            selectFascists();
            selectFascists();
        } else {
            return;
        }
        function selectFascists(){
            var Fascist = lobby.players[Math.floor(Math.random() * lobby.players.length)];
            lobby.players.splice( lobby.players.indexOf(Fascist), 1 );
            Players.forEach((player) => {
                if (player.username == Fascist){
                    player.partyrole = `Fascist`;
                    player.secretrole = `Fascist`;
                } else {
                    return;
                }
            })
        }
        lobby.players.forEach((lobby) => {
            Players.forEach((player) => {
                if (player.username == lobby){
                    player.partyrole = `Liberal`;
                    player.secretrole = `Liberal`;
                } else {
                    return;
                }
            })
        })
        gameloop()
        function gameloop(){
            
        }
        //Functie waarmee de President en Kanselier kan worden gekozen
        //Functie waarmee gestemd kan worden en aan de hand daarvan een oordeel wordt gevormd
        //Functie waarmee het beleid kan worden bepaald en weergeven
        //Functie waarmee de president een rol mag inkijken
        //Functie waarmee de president een speler mag vermoorden
        //Functie voor vetorecht
    }
}