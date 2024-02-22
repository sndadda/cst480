import { useState } from "react";
import axios from "axios";
import { getServerErrorMessages } from "./utils";
import "./SignUp.css";

function SignUp({ setRegistered }: any) {
    let [signUpForm, setSignUpForm] = useState({
        username: "",
        password: "",
    });
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
        <div id="success-page">
            <div>
                You have successfully created an account! Please now login :)
            </div>
            <button
                onClick={() => {
                    setRegistered(true);
                }}
            >
                Login
            </button>
        </div>
    );

    let signUpPage = (
        <div id="sign-up-form">
            <h2>Sign Up:</h2>
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
            <input
                id="password"
                value={signUpForm.password}
                onChange={(e) => {
                    setSignUpForm({
                        ...signUpForm,
                        [e.target.id]: e.target.value,
                    });
                }}
                placeholder="Password"
            ></input>
            <button onClick={handleSubmit}>Register</button>
            <div>Already have an account?</div>
            <button
                onClick={() => {
                    setRegistered(true);
                }}
            >
                Login
            </button>
            <div className="error-message">
                {messages.map((message, i) => (
                    <div key={i}>{message}</div>
                ))}
            </div>
        </div>
    );

    return <>{success ? successPage : signUpPage}</>;
}

export default SignUp;
