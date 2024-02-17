import "./App.css";
import io from "socket.io-client";
import { useEffect, useState } from "react";

let socket = io.connect("http://localhost:3001");

function App() {
  let [message, setMessage] = useState("");
  let [messageReceived, setMessageReceived] = useState("");
  let sendMessage = () => {
    socket.emit("send_message", { message });
    setMessage("");
  };

  useEffect(() => {
    socket.on("recieve_message", (data) => {
      setMessageReceived(data.message);
    });
  }, [socket]);

  return (
    <div className="App">
      <input
        value={message}
        placeholder="Message"
        onChange={(e) => {
          setMessage(e.target.value);
        }}
      />
      <button onClick={sendMessage}>Send Message</button>
      <div id="messages">{messageReceived}</div>
    </div>
  );
}

export default App;
