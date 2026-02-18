import React from 'react';  
import { Link, useNavigate } from 'react-router-dom';

function SideNav() {
    const navigate = useNavigate();
    
    const handleLogout = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:3000/logout', {
                method: 'POST',
                credentials: 'include', 
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                navigate('/login');
            }
        } catch (err) {
            console.error(err.message);
        }
    };

    return (
        <div className='sidebar'>
            <Link to='/checkout'>Cart</Link>
            <Link to='/frontpage'>Home</Link>
            <Link to='/products'>Products</Link>
            <Link to='/orders'>Orders</Link>
            <Link to='/login' onClick={handleLogout}>Log Out</Link>           
        </div>
    );
}

export default SideNav;