module.exports = {
    run: function(io,Clients,lobby){
        lobby.status = 'active';
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
        })
        //console.log(Players);

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
        //Functie waarmee de President en Kanselier kan worden gekozen
        //Functie waarmee gestemd kan worden en aan de hand daarvan een oordeel wordt gevormd
        //Functie waarmee het beleid kan worden bepaald en weergeven
        //Functie waarmee de president een rol mag inkijken
        //Functie waarmee de president een speler mag vermoorden
        //Functie voor vetorecht
    }
}