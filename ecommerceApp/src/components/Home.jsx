import React from "react";
import { Link } from 'react-router-dom';

function Home() {
    return (
        <div>
            <h1>Dre's Ecommerce shop example</h1>
            <p>All your needs in one place.</p>

            <div>
                <Link to='/login'><button>Login</button></Link>
                <Link to='/register'><button>Register</button></Link>
            </div>
        </div>
    );
}

export default Home;