import React, { useState } from "react";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  function sendMessage(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const newMsg = {
      text: input,
      time: new Date().toLocaleTimeString(),
    };

    setMessages([...messages, newMsg]);
    setInput("");
  }

  return (
    <div style={{ padding: "40px", color: "#fff" }}>
      <h1>Live Chat</h1>
      <p>This is a temporary chat system (local only). I can upgrade it to real-time whenever you're ready.</p>

      <div
        style={{
          background: "rgba(255,255,255,0.1)",
          padding: "20px",
          borderRadius: "10px",
          height: "300px",
          overflowY: "auto",
          marginTop: "20px"
        }}
      >
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: "10px" }}>
            <strong>You:</strong> {msg.text}
            <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>{msg.time}</div>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message..."
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "5px",
            border: "none",
            outline: "none"
          }}
        />
        <button
          type="submit"
          style={{
            padding: "10px 20px",
            background: "#ff007f",
            border: "none",
            color: "#fff",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
