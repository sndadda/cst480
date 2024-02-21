import { useState } from "react";
import { getServerErrorMessages } from "./utils";
import axios from "axios";

function Login({ setRefresh }: any) {
    let [loginForm, setLoginForm] = useState({
        username: "",
        password: "",
    });
    let [messages, setMessages] = useState<string[]>([]);

    let handleSubmit = async function () {
        setMessages([]);
        if (validLogin()) {
            try {
                await axios.post("/api/login", loginForm);
                setRefresh("login");
                setMessages([]);
            } catch (error) {
                setMessages(getServerErrorMessages(error));
            }
        } else {
            return;
        }
    };

    function validLogin() {
        let messageList: string[] = [];
        let valid = true;
        if (!loginForm.username) {
            messageList.push("*Must enter a username.");
            valid = false;
        }
        if (!loginForm.password) {
            messageList.push("*Must enter a password.");
            valid = false;
        }
        if (loginForm.username.length < 3) {
            messageList.push("*Username must be at least 3 characters.");
            valid = false;
        }
        if (loginForm.password.length < 8) {
            messageList.push("*Password must be at least 8 characters.");
            valid = false;
        }
        setMessages(messageList);
        return valid;
    }

    return (
        <>
            <div id="login-form">
                <h2>Login Page:</h2>
                <input
                    id="username"
                    value={loginForm.username}
                    onChange={(e) => {
                        setLoginForm({
                            ...loginForm,
                            [e.target.id]: e.target.value,
                        });
                    }}
                    placeholder="Username"
                ></input>
                <input
                    id="password"
                    value={loginForm.password}
                    onChange={(e) => {
                        setLoginForm({
                            ...loginForm,
                            [e.target.id]: e.target.value,
                        });
                    }}
                    placeholder="Password"
                ></input>
                <button onClick={handleSubmit}>Login</button>
                <div className="error-message">
                    {messages.map((message, i) => (
                        <div key={i}>{message}</div>
                    ))}
                </div>
            </div>
        </>
    );
}

export default Login;
