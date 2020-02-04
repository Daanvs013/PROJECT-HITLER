module.exports = {
    chat: function(io,Clients,currentUser,message){
        //console.log(message)
        //var d = new Date();
        //var time = d.toLocaleTimeString();
        //valideer het bericht
        if (message.length < 1){
            return;
        } else {
            //kijk of de speler dood is of niet.
            if (currentUser.alive == 'alive'){
                //filter het bericht op '<' en '>', zodat html tags niet gebruikt kunnen worden.
                var regex = /<[^>]+>/g;
                var filteredmessage = message.replace(regex, '');
                //verstuur het bericht
                Clients.forEach((client) => {
                    if (client.lobby == currentUser.lobby){
                        io.to(client.id).emit("chat-message", `[${currentUser.username}]: ${filteredmessage} <br>`);
                    } else {
                        return;
                    }
                });
            } else {
                return;
            }
        }
    }
}