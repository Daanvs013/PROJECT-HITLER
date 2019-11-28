module.exports = {
    chat: function(io,currentUser,message){
        //var d = new Date();
        //valideer het bericht
        if (message.length < 1){
            return;
        } else {
            //verstuur het bericht
            io.emit("chat-message", `[${currentUser.username}]: message`);
        }
    }
}