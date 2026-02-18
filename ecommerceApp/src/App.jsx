import React from "react";
import { RouterProvider ,createBrowserRouter, createRoutesFromElements, Route } from "react-router-dom";
import { createRoot } from 'react-dom/client';
import './App.css'
import Home from './components/Home.jsx'
import SignUp from "./components/Register.jsx";
import Login from "./components/login.jsx";
import AuthLayout from "./components/authlayout.jsx";
import AllProducts from "./components/allProducts.jsx";
import Checkout from "./components/checkout.jsx";


const router = createBrowserRouter([
  {
    path: '/',
    element: <Home /> 
  },
  {
    path: '/register',
    element: <SignUp />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/products',
    element: (
      <AuthLayout>
        <AllProducts />
      </AuthLayout>
    )
  },
  {
    path: '/checkout',
    element: (
      <AuthLayout>
          <Checkout />
      </AuthLayout>
    )
  }
]);


function App() {
  return (  
    <RouterProvider router={router}/>
    );
}

export default App;
