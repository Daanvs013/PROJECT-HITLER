var sock = io();

console.log("javascript is gelinkt");

sock.on("Send-Name", (parameters) => {
    console.log(parameters);
    document.getElementById("id").innerHTML += parameters;
});

sock.emit("Receive-Name", "test 1 2 3");