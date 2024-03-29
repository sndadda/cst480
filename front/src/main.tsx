import React from "react";
import ReactDOM from "react-dom/client";
import CatMap from "./Components/CatMap.tsx";
import Layout from "./Components/Layout.tsx";
import NotFound from "./Components/NotFound.tsx";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "mapbox-gl/dist/mapbox-gl.css"; // contains styles to display map
import UserFeed from "./Components/UserFeed.tsx";
import CuteCatFeed from "./Components/CuteCatFeed.tsx";
import Profile from "./Components/Profile.tsx";

const Main = () => {
    let router = createBrowserRouter([
        {
            element: <Layout />,
            children: [
                {
                    path: "/",
                    element: <CatMap />,
                },
                {
                    path: "/feed",
                    element: <UserFeed />,
                },
                {
                    path: "/cuteCatFeed",
                    element: <CuteCatFeed />,
                },
                {
                    path: "/profile",
                    element: <Profile />,
                },
                {
                    path: "*",
                    element: <NotFound />,
                },
            ],
        },
    ]);

    return <RouterProvider router={router} />;
};
ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <Main />
    </React.StrictMode>
);
