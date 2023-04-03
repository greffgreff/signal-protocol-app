const Websocket = require("websocket").server;
const http = require("http");

const server = http.createServer((req, rep) => {});

server.listen(4030, () => console.log(`Server is listening on port ${4030}`));

const ws = new Websocket({ httpServer: server });

const MAX_USERS = 10;

const connections = [];

ws.on("request", req => {
  if (connections.length >= MAX_USERS) {
    console.log("Max user count of", MAX_USERS, "reached. Will no longer accept incoming connections.");
    return;
  }
  const client = req.accept(null, req.origin);
  console.log("Client accepted.");

  // Upon connecting to the chat, the user should be sent key
  // bundles from all connected users in the chat
  const exchanges = [];
  for (let i = 0; i < connections.length; i++) {
    // If user not already accounted for
    if (!exchanges.some(ex => ex.user.id === connections[i].user.id)) {
      exchanges.push({
        user: connections[i].user,
        bundle: connections[i].bundles?.shift(),
      });
    }
  }
  client.send(JSON.stringify({ type: "exchanges", exchanges }));
  console.log("Sent key bundles to user.");

  client.on("message", message => {
    if (message.type !== "utf8") return;

    const packet = JSON.parse(message.utf8Data);
    console.log("Received message of type", packet.type);

    switch (packet.type) {
      // When a user connects, he sends key bundles to be sent to other users later
      // when they connect
      case "bundles":
        const newConnection = {
          client: client,
          user: packet.user,
          bundles: packet.bundles,
        };
        connections.push(newConnection);
        break;
      // Called when a user wishes to finalise an exchange with another user.
      // The post bundle from the sender must be redirected to user in question.
      case "post-exchange":
        for (let connection of connections) {
          if (connection.user.id === packet.to.id) {
            connection.client.send(JSON.stringify(packet));
            break;
          }
        }
        break;
      // Users independently encrypt messages for each user. Messages from a
      // sender must therefore be dispatched only to receiver in question for decryption
      case "chat":
        console.log("Passing encrypted message", packet);
        for (let connection of connections) {
          if (packet.to.id == connection.user.id) {
            connection.client.send(JSON.stringify(packet));
          }
        }
        break;
      default:
        console.log("Did not handle packet:", packet);
        break;
    }
  });
});
