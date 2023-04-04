import { useEffect, useRef, useState } from "react";

export default function Chat({ messages, onChat }) {
  const bottom = useRef(null);
  const [showCiphtertext, setShowCiphertext] = useState(false);

  function handleSend(event) {
    if (event.key === "Enter" && event.target?.value) {
      onChat(event.target?.value);
      event.target.value = "";
    }
  }

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-wrapper">
      <div className="chat">
        {messages.map(m => (
          <div key={m.id} className="chat-bubble">
            {console.log(m)}
            <b>{!m.text.ciphertext ? "me" : m.user.username}</b> &ensp; {showCiphtertext ? m.text.ciphertext : m.text.plaintext}
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <input className="chat-input" placeholder="Say something funny!" onKeyDown={handleSend} />
      <input type="button" value={showCiphtertext ? "Show plaintext" : "Show ciphertext"} onClick={() => setShowCiphertext(!showCiphtertext)} />
    </div>
  );
}
