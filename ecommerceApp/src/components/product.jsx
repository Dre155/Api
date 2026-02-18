import React from "react";

function Product(props) {
    return (
        <div>
            <img src={props.image_url} alt={props.name} />
            <h2>{props.name}</h2>
            <h2>{props.price}</h2>
            <button onClick={() => props.addToCart(props.id)}>
                Add to cart
            </button>
        </div>
    );
}

export default Product;