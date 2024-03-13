import { Link, Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import { useContext, useState, useEffect } from "react";
import { getAxiosErrorMessages, getServerErrorMessages } from "./utils";
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import "./Layout.css";
import Login from "./Login";

function Header({ setRefresh, name, setName }: any) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const navigate = useNavigate();

    // TODO find better type def for setRefresh???
    let handleLogout = async function () {
        try {
            await axios.post("/api/logout");
            setRefresh("logout");
            setName(null);
        } catch (error) {
            console.log(getServerErrorMessages(error)); // TODO maybe remove???
        }
    };

    return (
        <>
            <img src="/cat_globe.jpg" className="cat-logo" />
            <img src="/mange_cat.png" className="mange-cat" />
            <div className="nav-links">
                <Link to="/">Map</Link>
                <Link to="/feed">Feed</Link>
                <Link to="/cuteCatFeed">Cute Cats</Link>
            </div>
            <div className="profile-section" style={{ display: 'flex', alignItems: 'center' }}>
                {name && <span style={{ color: 'black', marginRight: '10px' }}>Welcome, {name}</span>}
                <Avatar
                    onClick={(event) => setAnchorEl(event.currentTarget)}
                />
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => setAnchorEl(null)}
                >
                <MenuItem onClick={() => navigate('/profile')}>Settings</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
            </div>
        </>
    );
}

function Layout() {
    let [name, setName] = useState<string | null>(null);
    let [loggedInStatus, setLoggedInStatus] = useState<boolean>(false);
    let [refresh, setRefresh] = useState(""); // this is used to manually trigger useEffect when user logs in or out

    useEffect(() => {
        (async () => {
            try {
                let {
                    data: { loggedIn, name },
                } = await axios.get<{ loggedIn: boolean, name: string }>("/api/loggedin");
                setLoggedInStatus(loggedIn);
                setName(name);
            } catch (error) {
                console.log(getAxiosErrorMessages(error));
            }
        })();
    }, [refresh]);

    let layoutPage = (
        <>
            <nav>
                <Header setRefresh={setRefresh} name={name} setName={setName} />
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
