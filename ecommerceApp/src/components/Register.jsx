import React from 'react';
import {useState} from 'react';
import { useNavigate } from 'react-router-dom';


function SignUp() {
    const navigate = useNavigate();
    const [userInput, setUserInput] = useState({
        email: '',
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
            const response = await fetch('http://localhost:3000/register', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userInput)
            });


            if (response.status === 201) {
                console.log('Sign up Successful');
                navigate('/login');
            }
        } catch (err) {
            console.error(err.message);
        }
    }
    return (
        <>
            <div>
                <h2>Register a new account</h2>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="email">Email: </label>
                    <input id="email" name="email" type="email" onChange={handleUserInput} value={userInput.email}/>

                    <label htmlFor="username">Username: </label>
                    <input id="username" name="username" type="text" onChange={handleUserInput} value={userInput.username}/>

                    <label htmlFor="password">Password: </label>
                    <input id="password" name="password" type="password" onChange={handleUserInput} value={userInput.password}/>

                    <button type="submit">Sign Up</button>
                </form>
            </div>
        </>
    )
}

export default SignUp;