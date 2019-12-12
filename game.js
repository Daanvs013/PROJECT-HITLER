module.exports = {
    run: function(io,Clients,lobby){
        lobby.status = 'active';
        console.log(lobby)
        playersclone = lobby.players;
        Clients.forEach((client) => {
            if (client.lobby == lobby.id){
                io.to(client.id).emit("redirect-client", `/Gameboards/Gameboard${lobby.playercap}p.html`);
            } else {
                return;
            }
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
        Clients.forEach((client) => {
            if (client.username == Hitler){
                client.partyrole = `Fascist`;
                client.secretrole = `Hitler`;
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
                    client.partyrole = `Liberal`;
                    client.secretrole = `Liberal`;
                    io.to(client.id).emit("game-role", {party: client.partyrole, secret: client.secretrole})
                } else {
                    return;
                }
            })
        })
        lobby.players = playersclone;
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