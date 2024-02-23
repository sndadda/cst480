import { useState } from "react";
import axios from "axios";
import { getServerErrorMessages } from "./utils";
import "./SignUp.css";
import { FaUser, FaEye, FaEyeSlash, FaRegSmileBeam } from "react-icons/fa";

function SignUp({ setRegistered, setLoginMessages }: any) {
    let [signUpForm, setSignUpForm] = useState({
        username: "",
        password: "",
    });
    let [passwordVisibility, setPasswordVisibility] =
        useState<string>("password");
    let [messages, setMessages] = useState<string[]>([]);
    let [success, setSuccess] = useState(false);

    let handleSubmit = async function () {
        setMessages([]);
        if (validSignUp()) {
            try {
                await axios.post("/api/create", signUpForm);
                setMessages([]);
                setSuccess(true);
            } catch (error) {
                setMessages(getServerErrorMessages(error));
            }
        } else {
            return;
        }
    };

    function validSignUp() {
        let messageList: string[] = [];
        let valid = true;
        if (!signUpForm.username) {
            messageList.push("*Must enter a username.");
            valid = false;
        }
        if (!signUpForm.password) {
            messageList.push("*Must enter a password.");
            valid = false;
        }
        if (signUpForm.username.length < 3) {
            messageList.push("*Username must be at least 3 characters.");
            valid = false;
        }
        if (signUpForm.password.length < 8) {
            messageList.push("*Password must be at least 8 characters.");
            valid = false;
        }
        setMessages(messageList);
        return valid;
    }

    let successPage = (
        <div className="success-page-container">
            <div id="success-page">
                <div className="success-message">
                    You have successfully created an account!
                    <div>
                        Please{" "}
                        <button
                            className="login-button"
                            onClick={() => {
                                setLoginMessages([]);
                                setRegistered(true);
                            }}
                        >
                            login
                        </button>{" "}
                        <FaRegSmileBeam className="smile-icon" />
                    </div>
                </div>
            </div>
        </div>
    );

    let signUpPage = (
        <div className="sign-up-form-container">
            <div id="sign-up-form">
                <h1>Sign Up</h1>
                <div className="input-box">
                    <input
                        id="username"
                        value={signUpForm.username}
                        onChange={(e) => {
                            setSignUpForm({
                                ...signUpForm,
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
                        value={signUpForm.password}
                        onChange={(e) => {
                            setSignUpForm({
                                ...signUpForm,
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
                <button className="sign-up-button" onClick={handleSubmit}>
                    Register
                </button>
                <div className="login-link">
                    Already have an account?{" "}
                    <button
                        className="login-button"
                        onClick={() => {
                            setLoginMessages([]);
                            setRegistered(true);
                        }}
                    >
                        Login
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

    return <>{success ? successPage : signUpPage}</>;
}

export default SignUp;
