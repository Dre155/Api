import React from 'react';
import {useState} from 'react';
import { useNavigate } from 'react-router-dom';


function Login() {
    const navigate = useNavigate();
    const [userInput, setUserInput] = useState({
        username: '',
        password: ''
    });
    function handleUserInput(e) {
       setUserInput({
        ...userInput,
        [e.target.name]: e.target.value
       });
    }
    async function handleSubmit(e) {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userInput)
            });


            if (response.ok) {
                console.log('Login Successful');
                navigate('/products');
            }
        } catch (err) {
            console.error(err.message);
        }
    }
    return (
        <>
            <div>
                <h2>Login</h2>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="username">Username: </label>
                    <input id="username" name="username" type="text" onChange={handleUserInput} value={userInput.username}/>

                    <label htmlFor="password">Password: </label>
                    <input id="password" name="password" type="password" onChange={handleUserInput} value={userInput.password}/>

                    <button type="submit">Login</button>
                </form>
                <a href="http://localhost:3000/auth/google/">
                <button type="button">
                Sign in with Google
                </button>
                </a>

                <a href="/register">
                <button type="button">
                    Register
                </button>
                </a>
            </div>
        </>
    )
}

export default Login;
