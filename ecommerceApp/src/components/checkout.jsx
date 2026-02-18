// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Checkout() {
    const [cartData, setCartData] = useState({
        items: [],
        summary: {
            total_price: 0,
            total_items: 0,
            total_quantity: 0
        }
    });
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/cart/my-cart', {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setCartData({
                    items: data.items,
                    summary: data.summary
                });
            }
        } catch (err) {
            console.error('Failed to fetch cart:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (cartId, newQuantity) => {
        if (newQuantity < 1) return;
        
        try {
            const response = await fetch(`http://localhost:3000/cart/${cartId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ quantity: newQuantity })
            });

            if (response.ok) {
                fetchCart(); // Refresh cart
            } else {
                alert('Failed to update quantity');
            }
        } catch (err) {
            console.error('Failed to update quantity:', err);
            alert('Failed to update quantity');
        }
    };

    const removeItem = async (cartId) => {
        if (!window.confirm('Remove this item from cart?')) return;
        
        try {
            const response = await fetch(`http://localhost:3000/cart/${cartId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                fetchCart(); // Refresh cart
            } else {
                alert('Failed to remove item');
            }
        } catch (err) {
            console.error('Failed to remove item:', err);
            alert('Failed to remove item');
        }
    };

    const clearCart = async () => {
        if (!window.confirm('Are you sure you want to clear your entire cart?')) return;
        
        try {
            const response = await fetch('http://localhost:3000/cart/', {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                fetchCart(); // Refresh cart
            } else {
                alert('Failed to clear cart');
            }
        } catch (err) {
            console.error('Failed to clear cart:', err);
            alert('Failed to clear cart');
        }
    };

    const handlePlaceOrder = async () => {
        if (cartData.items.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        if (!window.confirm(`Place order for $${Number(cartData.summary.total_price || 0).toFixed(2)}?`)) {
            return;
        }

        setProcessing(true);
        try {
            const response = await fetch('http://localhost:3000/orders/checkout', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                alert('Order placed successfully!');
                navigate('/orders'); // Redirect to order history
            } else {
                const error = await response.json();
                alert(error.msg || 'Failed to place order');
            }
        } catch (err) {
            console.error('Checkout failed:', err);
            alert('Failed to process order');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading checkout...</div>;
    }

    return (
        <div className="checkout-page">
            <div className="checkout-header">
                <h1>Checkout</h1>
                {cartData.items.length > 0 && (
                    <button onClick={clearCart} className="clear-all-btn">
                        Clear All Items
                    </button>
                )}
            </div>
            
            {cartData.items.length === 0 ? (
                <div className="empty-checkout">
                    <h2>Your cart is empty</h2>
                    <p>Add some products to get started!</p>
                    <Link to='/products' className="shop-now-btn">
                        Shop Now
                    </Link>
                </div>
            ) : (
                <div className="checkout-content">
                    {/* Cart Items Section */}
                    <div className="cart-items-section">
                        <h2>Cart Items ({cartData.summary.total_items})</h2>
                        
                        <div className="checkout-items-list">
                            {cartData.items.map((item) => (
                                <div key={item.cart_id} className="checkout-item-card">
                                    <div className="item-main-info">
                                        <div className="item-details">
                                            <h3>{item.name}</h3>
                                            <p className="unit-price">
                                                ${parseFloat(item.price).toFixed(2)} each
                                            </p>
                                        </div>
                                        
                                        <div className="item-controls">
                                            <div className="quantity-section">
                                                <label>Quantity:</label>
                                                <div className="quantity-controls">
                                                    <button 
                                                        onClick={() => updateQuantity(item.cart_id, item.quantity - 1)}
                                                        className="qty-btn"
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        -
                                                    </button>
                                                    <input 
                                                        type="number" 
                                                        value={item.quantity}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value);
                                                            if (val > 0) updateQuantity(item.cart_id, val);
                                                        }}
                                                        className="qty-input"
                                                        min="1"
                                                    />
                                                    <button 
                                                        onClick={() => updateQuantity(item.cart_id, item.quantity + 1)}
                                                        className="qty-btn"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div className="item-subtotal">
                                                <span>Subtotal:</span>
                                                <strong>${parseFloat(item.item_total).toFixed(2)}</strong>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => removeItem(item.cart_id)}
                                        className="remove-item-btn"
                                        title="Remove from cart"
                                    >
                                        ✕ Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Order Summary Section */}
                    <div className="order-summary-section">
                        <div className="summary-card">
                            <h2>Order Summary</h2>
                            
                            <div className="summary-details">
                                <div className="summary-row">
                                    <span>Items in cart:</span>
                                    <span>{cartData.summary.total_items}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Total quantity:</span>
                                    <span>{cartData.summary.total_quantity}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Subtotal:</span>
                                    <span>${parseFloat(cartData.summary.total_price).toFixed(2)}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Shipping:</span>
                                    <span className="free-shipping">FREE</span>
                                </div>
                                
                                <div className="summary-divider"></div>
                                
                                <div className="summary-row total-row">
                                    <span>Total:</span>
                                    <strong>${parseFloat(cartData.summary.total_price).toFixed(2)}</strong>
                                </div>
                            </div>
                            
                            <button 
                                onClick={handlePlaceOrder}
                                className="place-order-btn"
                                disabled={processing}
                            >
                                {processing ? 'Processing...' : 'Place Order'}
                            </button>
                            
                            <Link to='/products' className="continue-shopping-link">
                                ← Continue Shopping
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Checkout;