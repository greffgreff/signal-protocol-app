import "./App.css";
import Chat from "./Chat";
import React, { useEffect, useState } from "react";
import Register from "./Register";
import { v4 as uuid } from "uuid";
import { X3DH } from "./singal-protocol/x3dh";
import { DoubleRatchet } from "./singal-protocol/double-ratchet";

const MAX_USERS = 10;
const CHAT_SERVER = "ws://localhost:4030";

export default function App() {
  const [ws, setWs] = useState();
  const [username, setUsername] = useState();
  const [messages, setMessages] = useState([]);
  const [x3dh, setX3DH] = useState();
  const [doubleRatchets, setDoubleRatchets] = useState([]);

  useEffect(() => {
    if (!username) return;

    // Create X3DH instance for user to eventually perform key exchanges
    const x3dh = X3DH.createDefault(MAX_USERS);

    const ws = new WebSocket(CHAT_SERVER);

    ws.onopen = () => {
      console.log("WebSocket connection established!");
      console.log("Sending key bundles to the server...");
      // Immediately sends MAX_USERSs key bundle for MAX_USERS potential users
      ws.send({
        type: "bundles",
        user: username,
        bunbles: new Array(MAX_USERS).fill(null).map(x3dh.generateKeyBundle),
      });
    };

    ws.onmessage = packet => {
      console.log("Received message of type", packet.type, packet);
      switch (packet.type) {
        // Called when a simple `chat` message arrives from the server
        case "chat":
          // Find double ratchet for user and decipher message
          for (let ratchet of doubleRatchets) {
            if (ratchet.username === packet.from) {
              const plaintext = ratchet.doubleRatchet.receive(packet.text);
              const message = { id: packet.id, username: packet.from, text: plaintext, date: packet.date };
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
          packet.exchanges.foreach(exchange => {
            const { sharedSecret, id, identityKey, ephemeralKey } = x3dh.exchange(exchange.bundle);
            ws.send({ type: "post-exchange", to: exchange.username, postBundle: { id, identityKey, ephemeralKey } });
            const doubleRatchet = new DoubleRatchet(sharedSecret, true);
            setDoubleRatchets([...doubleRatchets, { username: exchange.username, doubleRatchet }]);
          });
          break;
        // Called when a user joins the chat, to establish E2E encryption with user
        case "post-exchange":
          // Find sharedSecret for a given user bundle and instanciate new double ratchet for given user
          // Users for which double ratchet is created should already have a double ratchet of their own
          const sharedSecret = x3dh.postExchange(packet.postBundle);
          const doubleRatchet = new DoubleRatchet(sharedSecret);
          setDoubleRatchets([...doubleRatchets, { username: packet.username, doubleRatchet }]);
          break;
        default:
          console.log("Did not handle packet:", packet);
          break;
      }
    };

    setWs(ws);
    setX3DH(x3dh);
  }, [username]);

  // On message send, compute ciphertext independently for each users in the chat
  function handleChat(text) {
    const message = { id: uuid(), username, text, date: new Date() };
    setMessages([...messages, message]);

    // Computer and send message with cipher text for server to dispatch to target user
    doubleRatchets.forEach(ratchet => {
      message.text = ratchet.doubleRatchet.send(text);
      message.type = "chat";
      message.to = ratchet.username;
      message.from = username;
      ws.send(JSON.stringify(message));
    });
  }

  return <div>{!username ? <Register onRegister={setUsername} /> : <Chat messages={messages} onChat={handleChat} />}</div>;
}
