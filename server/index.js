const webSocketServer = require("websocket").server;
const http = require("http");

const server = http.createServer((req, rep) => {});

server.listen(4030, () => console.log(`Server is listening on port ${4030}`));

const ws = new webSocketServer({ httpServer: server });

const MAX_USERS = 10;

const chatUsers = [];

ws.on("request", req => {
  if (chatUsers.length <= MAX_USERS) {
    console.log("Max user count reached", MAX_USERS, "Will no longer accept incoming connections.");
    return;
  }

  const client = req.accept(null, req.origin);
  console.log("Client accepted.");

  // Upon connecting to the chat, the user should be sent key
  // bundles from all connected users in the chat
  const exchanges = [];
  for (let i = 0; i < chatUsers.length; i++) {
    if (!exchanges.some(ex => ex.username === chatUsers[i].username)) {
      exchanges.push({
        username: chatUsers[i].username,
        bundle: chatUsers[i].bundles.shift(),
      });
    }
  }
  console.log("Sending key bundles to user", exchanges);
  client.send(JSON.stringify({ type: "exchanges", exchanges }));

  client.on("message", data => {
    const packet = JSON.parse(data);
    console.log("Received", data);

    switch (packet.type) {
      // When a user connects, he sends key bundles to be sent to other users
      case "bundle":
        chatUsers.push({
          client: client,
          username: packet.user,
          bundles: packet.bundles,
        });
        break;
      // Users independently encrypt messages for each users. Messages from a
      // sender must therefore be dispatched only to receiver in question for decryption
      case "chat":
        chatUsers.forEach(user => {
          if (packet.to == user.username) {
            user.client.send(packet);
          }
        });
        break;
      // Called when a user wishes to finalise an exchange with another user.
      // The post bundle from the sender must be redirected to user in question.
      case "post-exchange":
        for (let user in chatUsers) {
          if (user.username === packet.to) {
            user.client.send(packet);
            break;
          }
        }
        break;
      default:
        console.log("Did not handle packet:", packet);
        break;
    }
  });
});
