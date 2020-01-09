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

//als de client het tabblad of de browser sluit, wordt beforeunload nog uitgevoerd.
window.addEventListener('beforeunload', (event) => {
  sock.emit("beforeunload", {ID:data, path:url});
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

//DEBUG
function debug(data){
    sock.emit("debug-request", data);
}

sock.on("debug-request-accepted", (package) => {
    console.log(package);
});