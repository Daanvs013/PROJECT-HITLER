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

//LOG INFO
var package = {
    screen: {
        windowHeight: screen.availHeight,
        windowWidth: screen.availWidth,
        colorDepth: screen.colorDepth,
        screenHeight: screen.height,
        screenWidth: screen.width,
        pixelDepth: screen.pixelDepth,
    },
    browser: {
        browserName: navigator.appCodeName,
        browserCodeName: navigator.appName,
        browserVersion: navigator.appVersion,
        browserCookies: navigator.cookieEnabled,
        browserEngine: navigator.product,
        browserUserAgent: navigator.userAgent,
        language: navigator.language,
    }
}
sock.emit("device-info", package);