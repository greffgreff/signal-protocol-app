const webSocketServer = require("websocket").server;
const http = require("http");

const server = http.createServer((req, rep) => {});

server.listen(3000, () => console.log(`Server is listening on port ${3000}`));
const wsServer = new webSocketServer({ httpServer: server });

const clients = [];

wsServer.on("request", req => {
  const connection = req.accept(null, req.origin);
  console.log("Connection accepted.");

  connection.on("message", msg => {
    console.log(msg.utf8Data);
    connection.sendUTF("Hello, client!");
    // connection.sendUTF(JSON.stringify({ type: "color", data: userColor }));
    // clients[i].sendUTF(json);
  });
});
