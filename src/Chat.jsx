import { useEffect, useRef } from "react";

export default function Chat({ messages, onChat }) {
  const bottom = useRef(null);

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
            <b>{m.user.username}</b>&ensp;{m.text.plaintext}
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <input className="chat-input" placeholder="Say something funny!" onKeyDown={handleSend} />
    </div>
  );
}
