import "./App.css";
import Chat from "./Chat";
import React, { useEffect, useState } from "react";
import Register from "./Register";
import { v4 as uuid } from "uuid";
import { X3DH } from "./singal-protocol/x3dh";
import { DoubleRatchet } from "./singal-protocol/double-ratchet";

const MAX_USERS = 10;
const CHAT_SERVER = "ws://localhost:4030";
// Uncomment and change <IP> to the ip address of the running server to use of the network.
// const CHAT_SERVER = "ws://<IP>:4030";

const doubleRatchets = [];

export default function App() {
  const [ws, setWs] = useState();
  const [user, setUser] = useState();
  const [messages, setMessages] = useState([]);
  const [x3dh, setX3dh] = useState();

  useEffect(() => {
    if (!user) return;

    const x3dh = X3DH.createDefault(MAX_USERS);

    const ws = new WebSocket(CHAT_SERVER);

    ws.onopen = () => {
      console.log("WebSocket connection established!");

      // Immediately sends MAX_USERSs key bundle for MAX_USERS potential users
      const bundles = {
        type: "bundles",
        user: user,
        bundles: new Array(MAX_USERS).fill(null).map(x3dh.generateKeyBundle),
      };

      ws.send(JSON.stringify(bundles));
    };

    ws.onmessage = message => {
      const packet = JSON.parse(message.data);
      console.log("Received message of type", packet.type);

      switch (packet.type) {
        // Called when a simple `chat` message arrives from the server
        case "chat":
          // Find double ratchet for user and decipher message
          for (let ratchet of doubleRatchets) {
            if (ratchet.user.id === packet.from.id) {
              const { plaintext, ciphertext } = ratchet.doubleRatchet.receive(packet.text);

              const message = {
                id: packet.id,
                user: packet.from,
                text: { plaintext, ciphertext },
                date: packet.date,
              };
              console.log("Decryted message", message);

              setMessages([...messages, message]);
              break;
            }
          }
          break;
        // Called when the user joins the chat, to establish E2E with already connected users
        case "exchanges":
          // Perform key exchange foreach users already in chat and create double ratchet for each of them
          // A post bundle key containing the ephemeral key is then send to server to dispatch to target user
          // to complete the exchange cycle and create a double ratchet
          for (let exchange of packet.exchanges) {
            const { sharedSecret, id, identityKey, ephemeralKey } = x3dh.exchange(exchange.bundle);

            const postExchange = {
              type: "post-exchange",
              to: exchange.user,
              from: user,
              postBundle: { id, identityKey, ephemeralKey },
            };

            ws.send(JSON.stringify(postExchange));

            doubleRatchets.push({
              user: exchange.user,
              doubleRatchet: new DoubleRatchet(sharedSecret, true),
            });

            console.log("ESTABLISHED SHARED SECRET", sharedSecret, "WITH USER", exchange.user.username);
          }
          break;
        // Called when a user joins the chat, to establish E2E encryption with user
        case "post-exchange":
          // Find sharedSecret for a given user bundle and instanciate new double ratchet for given user
          // Users for which double ratchet is created should already have a double ratchet of their own
          const { sharedSecret } = x3dh.postExchange(packet.postBundle);

          doubleRatchets.push({
            user: packet.from,
            doubleRatchet: new DoubleRatchet(sharedSecret),
          });

          console.log("ESTABLISHED SHARED SECRET", sharedSecret, "WITH USER", packet.from.username);
          break;
        default:
          console.log("Did not handle packet:", packet);
          break;
      }
    };

    setWs(ws);
    setX3dh(x3dh);
  }, [user]);

  useEffect(() => {
    if (!x3dh) return;

    ws.onmessage = message => {
      const packet = JSON.parse(message.data);
      console.log("Received message of type", packet.type);

      switch (packet.type) {
        // Called when a simple `chat` message arrives from the server
        case "chat":
          // Find double ratchet for user and decipher message
          for (let ratchet of doubleRatchets) {
            if (ratchet.user.id === packet.from.id) {
              const { plaintext, ciphertext } = ratchet.doubleRatchet.receive(packet.text);

              const message = {
                id: packet.id,
                user: packet.from,
                text: { plaintext, ciphertext },
                date: packet.date,
              };
              console.log("Decryted message", message);

              setMessages([...messages, message]);
              break;
            }
          }
          break;
        // Called when the user joins the chat, to establish E2E with already connected users
        case "exchanges":
          // Perform key exchange foreach users already in chat and create double ratchet for each of them
          // A post bundle key containing the ephemeral key is then send to server to dispatch to target user
          // to complete the exchange cycle and create a double ratchet
          for (let exchange of packet.exchanges) {
            const { sharedSecret, id, identityKey, ephemeralKey } = x3dh.exchange(exchange.bundle);

            const postExchange = {
              type: "post-exchange",
              to: exchange.user,
              from: user,
              postBundle: { id, identityKey, ephemeralKey },
            };

            ws.send(JSON.stringify(postExchange));

            doubleRatchets.push({
              user: exchange.user,
              doubleRatchet: new DoubleRatchet(sharedSecret, true),
            });

            console.log("ESTABLISHED SHARED SECRET", sharedSecret, "WITH USER", exchange.user.username);
          }
          break;
        // Called when a user joins the chat, to establish E2E encryption with user
        case "post-exchange":
          // Find sharedSecret for a given user bundle and instanciate new double ratchet for given user
          // Users for which double ratchet is created should already have a double ratchet of their own
          const { sharedSecret } = x3dh.postExchange(packet.postBundle);

          doubleRatchets.push({
            user: packet.from,
            doubleRatchet: new DoubleRatchet(sharedSecret),
          });

          console.log("ESTABLISHED SHARED SECRET", sharedSecret, "WITH USER", packet.from.username);
          break;
        default:
          console.log("Did not handle packet:", packet);
          break;
      }
    };

    setWs(ws);
  }, [messages]);

  // On message send, compute ciphertext independently for each users in the chat
  function handleChat(text) {
    const localMessage = {
      id: uuid(),
      user,
      text: { plaintext: text, ciphertext: null },
      date: new Date(),
    };
    setMessages([...messages, localMessage]);

    // Compute and send message with cipher text for server to dispatch to target user
    doubleRatchets.forEach(ratchet => {
      const remoteMessage = {
        id: localMessage.id,
        type: "chat",
        text: ratchet.doubleRatchet.send(text),
        to: ratchet.user,
        from: user,
        date: localMessage.date,
      };
      ws.send(JSON.stringify(remoteMessage));
    });
  }

  return <div>{!user ? <Register onRegister={setUser} /> : <Chat messages={messages} onChat={handleChat} />}</div>;
}
