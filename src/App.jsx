import "./App.css";
import Chat from "./Chat";
import React, { useEffect, useState } from "react";
import Register from "./Register";

export default function App() {
  const [ws, setWs] = useState();
  const [username, setUsername] = useState();
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!username) return;

    const newWs = new WebSocket("ws://localhost:4030");

    newWs.onopen = () => {
      console.log("WebSocket connection established!");
      newWs.send({
        type: "bundle",
        user: username,
        // bunbles: new Array(10).fill(null).map(x3dh.generateKeyBundle),
      });
    };
    newWs.onmessage = message => {
      console.log(`Received message from server: ${message.data}`);
    };
    newWs.onclose = () => {
      console.log("WebSocket connection closed!");
    };

    setWs(newWs);

    return () => {
      newWs.close();
    };
  }, [username]);

  function handleChat(text) {
    setMessages([...messages, { username, text }]);
  }

  return <div>{!username ? <Register onRegister={setUsername} /> : <Chat messages={messages} onChat={handleChat} />}</div>;
}
