import React from 'react';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';


function AuthRoute({ children }) {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuth, setIsAuth] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('http://localhost:3000/products', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                setIsAuth(response.ok);
            } catch (error) {
                setIsAuth(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!isAuth) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default AuthRoute;