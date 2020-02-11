module.exports = {
    chat: function(io,Clients,currentUser,message){
        //console.log(message)
        //var d = new Date();
        //var time = d.toLocaleTimeString();
        //valideer het bericht
        if (message.length < 1){
            return;
        } else {
            //filter het bericht op '<' en '>', zodat html tags niet gebruikt kunnen worden.
            var regex = /<[^>]+>/g;
            var filteredmessage = message.replace(regex, '');
            var chatmessage;
            if (currentUser.alive != 'alive'){
                chatmessage = `<i>[${currentUser.username}](Dood): ${filteredmessage} <i><br>`
            } else {
                chatmessage = `[${currentUser.username}]: ${filteredmessage} <br>`;
            }
            //verstuur het bericht
            Clients.forEach((client) => {
                if (client.lobby == currentUser.lobby){
                    io.to(client.id).emit("chat-message", chatmessage);
                } else {
                    return;
                }
            });
            
        }
    }
}