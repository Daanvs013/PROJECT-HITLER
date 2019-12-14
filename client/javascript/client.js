//socket.io module.
var sock = io();
//

//sessie
var url = window.location.href;
var data = sessionStorage.getItem('sessionID');
console.log(`Sessie ID:${data}, Sessie path:${url}`);
sock.emit("new-session", {ID:data, path:url});

sock.on("sessionID", (ID) => {
    //sla het ID op als sessieopslag
    sessionStorage.setItem('sessionID', ID);
});

//test
console.log("javascript is gelinkt");
//

//debug
sock.on("server-alert", (message) => {
    alert(message);
});
//

//redirect functie
sock.on("redirect-client", (path) => {
    //console.log(path);
    window.location.replace(path);
});