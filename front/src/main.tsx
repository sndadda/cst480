import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import CatMap from './Components/CatMap.tsx';
import Layout from './Components/Layout.tsx';
import './index.css'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import 'mapbox-gl/dist/mapbox-gl.css'; // contains styles to display map

const Main = () => {

  let router = createBrowserRouter([
    {
      element: <Layout />,
      children: [
        {
          path: "/", 
          element: <CatMap />,
        },
      ],
    },
  ]);
  
  return (
    <RouterProvider router={router} />
  
  );
  
}
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>,
)
