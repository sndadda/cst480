import { Link, Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import { useContext } from 'react';
import "./Layout.css";

function Header() {
    return (
        <>
            <img src="/cat_globe.jpg" className="cat-logo"/>
            <Link to="/">Map</Link>
            <Link to="/feed">Feed</Link>
            <Link to="/profile">Profile</Link>
        </>
    )
}

function Layout() {
    return (
        <>
            <nav>
                <Header />
            </nav>
            <main>
                <Outlet />
            </main>
        </>
    )
}

export default Layout;