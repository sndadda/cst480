import { Link, Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import { useContext, useState, useEffect } from "react";
import { getAxiosErrorMessages, getServerErrorMessages } from "./utils";
import "./Layout.css";
import Login from "./Login";

function Header({ setRefresh }: any) {
    // TODO find better type def for setRefresh???
    let handleLogout = async function () {
        try {
            await axios.post("/api/logout");
            setRefresh("logout");
        } catch (error) {
            console.log(getServerErrorMessages(error)); // TODO maybe remove???
        }
    };

    return (
        <>
            <img src="/cat_globe.jpg" className="cat-logo" />
            <Link to="/">Map</Link>
            <Link to="/feed">Feed</Link>
            <Link to="/cuteCatFeed">CuteCatFeed</Link>
            <Link to="/profile">Profile</Link>
            <Link to="/" onClick={handleLogout}>
                Logout
            </Link>
        </>
    );
}

function Layout() {
    let [loggedInStatus, setLoggedInStatus] = useState<boolean>(false);
    let [refresh, setRefresh] = useState(""); // this is used to manually trigger useEffect when user logs in or out

    useEffect(() => {
        (async () => {
            try {
                let {
                    data: { loggedIn },
                } = await axios.get<{ loggedIn: boolean }>("/api/loggedin");
                setLoggedInStatus(loggedIn);
            } catch (error) {
                console.log(getAxiosErrorMessages(error));
            }
        })();
    }, [refresh]);

    let layoutPage = (
        <>
            <nav>
                <Header setRefresh={setRefresh} />
            </nav>
            <main>
                <Outlet />
            </main>
        </>
    );

    return (
        <>{loggedInStatus ? layoutPage : <Login setRefresh={setRefresh} />}</>
    );
}

export default Layout;
