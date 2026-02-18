// @ts-nocheck
import React, { useState, useEffect } from "react";
import Product from "./product.jsx";

function AllProducts() {
    const [products, setProducts] = useState([]);
    
    useEffect(() => {
        getProducts();
    }, []);

    const getProducts = async () => {
        try {
            const response = await fetch('http://localhost:3000/products', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            if (response.ok) {
                const productData = await response.json();
                setProducts(productData);
            }
        } catch (err) {
            console.error(err.message);
        }
    };

    const handleCartBtn = async (productId) => {
        try {
            const response = await fetch('http://localhost:3000/cart', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    product_id: productId,
                    quantity: 1
                })
            });

            if (response.status === 401) {
                alert('User error. Please log in.');
            }
            if (response.ok) {
                alert('Product added to cart!');
            }
        } catch (err) {
            console.error(err.message);
        }
    };

    return (
        <div>
            {products.map((product) => (
                <Product
                    key={product.id}
                    name={product.name}
                    id={product.id}
                    price={product.price}
                    image_url={product.image_url}
                    addToCart={handleCartBtn}
                />
            ))}
        </div>
    );
}

export default AllProducts;