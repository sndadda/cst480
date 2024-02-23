import { useState } from "react";
import { getServerErrorMessages } from "./utils";
import axios from "axios";
import SignUp from "./SignUp";
import "./Login.css";
import { FaUser, FaEye, FaEyeSlash } from "react-icons/fa";

function Login({ setRefresh }: any) {
    let [loginForm, setLoginForm] = useState({
        username: "",
        password: "",
    });
    let [registered, setRegistered] = useState<boolean>(true);
    let [passwordVisibility, setPasswordVisibility] =
        useState<string>("password");
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

    let loginPage = (
        <div className="login-form-container">
            <div id="login-form">
                <h1>Login</h1>
                <div className="input-box">
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
                    <FaUser className="user-icon" />
                </div>
                <div className="input-box">
                    <input
                        id="password"
                        type={passwordVisibility}
                        value={loginForm.password}
                        onChange={(e) => {
                            setLoginForm({
                                ...loginForm,
                                [e.target.id]: e.target.value,
                            });
                        }}
                        placeholder="Password"
                    ></input>
                    {passwordVisibility === "password" ? (
                        <FaEyeSlash
                            className="eye-icon"
                            onClick={() => {
                                setPasswordVisibility("text");
                            }}
                        />
                    ) : (
                        <FaEye
                            className="eye-icon"
                            onClick={() => {
                                setPasswordVisibility("password");
                            }}
                        />
                    )}
                </div>
                <button className="login-button" onClick={handleSubmit}>
                    Login
                </button>
                <div className="register-link">
                    Don't have an account?{" "}
                    <button
                        className="register-button"
                        onClick={() => {
                            setRegistered(false);
                        }}
                    >
                        Register
                    </button>
                </div>

                <div className="error-message">
                    {messages.map((message, i) => (
                        <div key={i}>{message}</div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <>
            {registered ? (
                loginPage
            ) : (
                <SignUp
                    setRegistered={setRegistered}
                    setLoginMessages={setMessages}
                />
            )}
        </>
    );
}

export default Login;
