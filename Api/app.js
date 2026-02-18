// @ts-nocheck
// Import environment variables.
require("dotenv").config();
const os = require('os');
// import express.
const express = require('express');
const app = express()

// import passport.
var passport = require('passport');
var LocalStrategy = require("passport-local").Strategy;
var crypto = require('crypto')
var session = require('express-session');
const bcrypt = require('bcrypt');
const cors = require('cors');


const GoogleStrategy = require('passport-google-oauth20').Strategy;



// import middleware
const { json } = require("body-parser");
const morgan = require('morgan');

// import postgreSQL database.
const pool = require('./db/connection.js')
const pgSession = require('connect-pg-simple')(session);
pool.connect()

// middleware
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(json());
app.use(morgan('tiny'));

// import api URL.


// import util modules.
const { getProducts, createProduct, updateProduct, deleteProduct, getProductiD } = require('./utils/product.js')
const {getUser, createUser, updateUser, deleteUser} = require("./utils/user.js");
const {cartItems, addToCart, updateCartItem, removeFromCart, clearCart} = require('./utils/cart.js');
const {getOrders, getOrderByiD, createOrder} = require('./utils/order.js');

// local info
const localInfo = {
    'hostname': os.hostname(),
    'arch': os.arch(),
    'Last reboot': os.uptime()
}

console.log(localInfo);

if (process.argv[2] && process.argv[2] === 'dev') {
    process.env.NODE_ENV === 'development'
} else {
    process.env.NODE_ENV === 'production'
}

if (process.env.NODE_ENV === 'production') {
    console.log('node productRoute.js dev')
} else {
    console.log('node productRoute.js')
}

// declare listening port.
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});


app.use(
    session({
        store: new pgSession({
            pool: pool,
            tableName: 'session',
            createTableIfMissing: true,
        }),
        secret: process.env.SESSION_SECRET,
        cookie: {maxAge: 1000 * 60*60 * 24, secure: process.env.NODE_ENV === 'production',
            sameSite: "lax"},
        resave: false,
        saveUninitialized: false,
    })
);

app.use(passport.initialize());
app.use(passport.session());


passport.serializeUser(function(user, cb) {
    cb(null, user.id)
});

passport.deserializeUser(function(id, cb) {
    pool.query('SELECT * FROM users WHERE id = $1', [id], function(err, results) {
        if (err) {
            return cb(err);  
        }
        cb(null, results.rows[0]); 
    });
});

// session middleware.
passport.use(new LocalStrategy(function verify(username, password, cb) {
    pool.query('SELECT * FROM users where username = $1', [username], function(err, results) {
        if (err) { 
            return cb(err); 
        }
    

        if (!results.rows[0]) {
            return cb(null, false, { message: 'Incorrect username or password.'});
        }

        const user = results.rows[0];
        
        
        if (user.salt == null || user.password_hash == null) {
            return cb(null, false, { message: 'Please sign in with Google.'});
        }
        
        crypto.pbkdf2(password, user.salt, 31000, 32, 'sha256', function(err, hashedPassword) {
            if (err) {
                return cb(err);
            }
            
        
            const hashedPasswordHex = hashedPassword.toString('hex');
            
            if (hashedPasswordHex !== user.password_hash) {
                return cb(null, false, { message: 'Incorrect username or password.'});
            }

            return cb(null, user);
        });
    });
}));


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/callback',
    scope: ['profile', 'email']
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
      // Check if credential exists
      const credResult = await pool.query(
        'SELECT * FROM federated_credentials WHERE provider = $1 AND subject = $2',
        ['https://accounts.google.com', profile.id]
      );

      if (credResult.rows.length === 0) {
        // New user - create user first
        const newUserResult = await pool.query(
          'INSERT INTO users (username, email) VALUES ($1, $2) RETURNING *',
          [profile.displayName, profile.emails[0].value]
        );

        const newUser = newUserResult.rows[0];

        // Create federated credential
        await pool.query(
          'INSERT INTO federated_credentials (user_id, provider, subject) VALUES ($1, $2, $3)',
          [newUser.id, 'https://accounts.google.com', profile.id]
        );

        return cb(null, newUser);
      } else {
        // Existing user - get user info
        const userResult = await pool.query(
          'SELECT * FROM users WHERE id = $1',
          [credResult.rows[0].user_id]
        );

        if (userResult.rows.length === 0) {
          return cb(null, false);
        }

        return cb(null, userResult.rows[0]);
      }
    } catch (err) {
      return cb(err);
    }
  }
));

app.get('/auth/google', 
    passport.authenticate('google',
        { scope: ['profile', 'email'],
          prompt: 'select_account'
     })
  );
  
  app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: 'http://localhost:5173/login' }),
    function(req, res) {
      res.redirect('http://localhost:5173/products');
    }
  );

// Middleware functions
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ msg: 'Unauthorized. Please log in.' });
}

function isAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.isAdmin) {
        return next();
    }
    res.status(403).json({ msg: 'Forbidden. Admin access required.' });
}

// Register route.
// Register route.
app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                msg: 'All fields are required'
            });
        }

        const existingUser = await pool.query(
            'SELECT * FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                msg: 'User with this email or username already exists'
            });
        }

        const salt = crypto.randomBytes(16).toString('hex');

  
        crypto.pbkdf2(password, salt, 31000, 32, 'sha256', async function(err, hashedPassword) {
            if (err) {
                console.error('Password hashing error:', err);
                return res.status(500).json({ msg: 'Error hashing password' });
            }

            try {
                const passwordHashHex = hashedPassword.toString('hex');

                const result = await pool.query(
                    `INSERT INTO users(username, email, password_hash, salt, isAdmin)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING id, username, email, created_at, isAdmin`,
                    [username, email, passwordHashHex, salt, false]
                );

                res.status(201).json({
                    msg: "User created successfully.",
                    newUser: result.rows[0]
                });
            } catch (err) {
                console.error('Database error:', err);
                res.status(500).json({
                    msg: 'Database error during registration',
                    error: err.message
                });
            }
        });

    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({
            msg: 'Server error during registration',
            error: err.message
        });
    }
});

// login route.
app.post('/login', 
    passport.authenticate('local', {failureRedirect: '/login'}),
    (req, res) => {
       res.status(200).json({
        msg: 'Login successful',
        user: {
            id: req.user.id,
            username: req.user.username,
            email: req.user.email
        }
       });
    }
);

// profile route.
app.get("/profile", isAuthenticated, (req, res) => {
    res.json({
        user: req.user
    });
});

// logout route.
app.post("/logout", (req, res, next) => {  
    req.logout(function(err) {
        if (err) {
            return next(err);
        }

        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err);
                return next(err); 
            }
            
            res.clearCookie('connect.sid', {
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });
            
            res.json('/Home');
        });
    });
});

// User router
const userRouter = express.Router();
app.use('/users', userRouter);

// get user route.
userRouter.get('/', isAuthenticated, async (req, res) => {
    try {
        const user = await getUser(req.user.id);
        if (!user) {
            return res.status(404).json({msg: 'Cannot find user'});
        }
        res.json(user);
    } catch(err) {
        console.error(err.message);
        res.status(500).json({msg: 'Server error'})
    }
});

// update user details route.
userRouter.put('/me', isAuthenticated, async (req, res) => {
    try {
        const { username, email } = req.body;

        const updatedUser = await updateUser(req.user.id, {username, email});
        res.json({
            msg: 'User updated successfully',
            user: updatedUser
        });
    } catch(err) {
        console.error(err.message)
        if (err.message === 'Username taken') {
            res.status(409).json({ msg: 'Username taken' });
        }

        if (err.message === 'Email in use') {
            res.status(409).json({ msg: 'Email in use' });
        }

        res.status(500).json({ msg: 'Server error'});
    }
});

// delete user route.
userRouter.delete('/me', isAuthenticated, async (req, res) => {
    try {
        const deletedUser = await deleteUser(req.user.id);
        req.logout((err) => {
            if (err) {
                return res.status(500).json({ msg: 'Error logging out' });
            }
            res.json({
                msg: 'User deleted successfully',
                user: deletedUser
            });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({msg: 'Server error'})
    }
});

// Products router.
const productsRouter = express.Router();
app.use('/products', productsRouter);

// Get all products.
productsRouter.get('/', async (req, res) => {
    try {
        const allProducts = await getProducts();
        res.json(allProducts)
    } catch (err) {
        console.error(err.message);
    }
});

// Get a product by id.
productsRouter.get('/:id', async (req, res) => {
    try {
        const product = await getProductiD(req.params.id);
        if (!product) {
            return res.status(404).json({msg: 'Product not found'})
        }
        res.json(product)
    } catch(err) {
        console.error(err.message);
        res.status(500).json({msg: 'Server error'})
    }
});

// create new product route.
productsRouter.post('/add-product', isAdmin, async (req, res) => {
    try {
        const addedProduct = await createProduct(req.body);
        res.status(201).json(addedProduct);
    } catch(err) {
        console.error(err.message)
        res.status(500).json({msg: 'Server error'});
    }
});

// Update product route.
productsRouter.put('/:id', isAdmin, async (req, res) => {
    try {
        const updatedProduct = await updateProduct(req.params.id, req.body);
        res.json({
            msg: 'Product updated successfully',
            product: updatedProduct
        });
    } catch(err) {
        console.error(err.message);
        res.status(500).json({msg: 'Server error'});
    }
});

// delete product by id route.
productsRouter.delete('/:id', isAdmin, async (req, res) => {
    try {
        const deletedProduct = await deleteProduct(req.params.id);
        res.json({
            msg: 'Product deleted successfully',
            product: deletedProduct
        });
    } catch(err) {
        console.error(err.message)
        res.status(500).json({msg: 'Server error'});
    }
});

// Orders router
const orderRouter = express.Router()
app.use('/orders', orderRouter);

// get user order history route
orderRouter.get('/my-orders', isAuthenticated, async (req, res) => {
    try {
        const orders = await getOrders(req.user.id);
        res.json({
            msg: 'Order history retrieved successfully',
            count: orders.length,
            orders: orders
        })
    } catch (err) {
        console.error(err.message);
        res.status(500).json({msg: 'Server error'})
    }
});

// get order via id route.
orderRouter.get('/my-orders/:id', isAuthenticated, async (req, res) => {
    try {
        const order = await getOrderByiD(req.params.id, req.user.id);
        if (!order) {
            return res.status(404).json({msg: 'Order not found'});
        }
        res.json(order);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({msg: 'Server error'})
    }
});

// Cart router
const cartRouter = express.Router()
app.use('/cart', cartRouter);

// add cart item route.
cartRouter.post('/', isAuthenticated, async (req, res) => {
    try {
        const { product_id, quantity } = req.body;

        if (!product_id || !quantity || quantity < 1) {
            return res.status(400).json({
                msg: 'Product ID and valid quantity required'
            });
        }

        const cartItem = await addToCart(req.user.id, product_id, quantity);
        res.status(201).json({
            msg: 'Item added to cart successfully',
            cartItem: cartItem
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({msg: 'Server error'})
    }
});

// Get cart data.
cartRouter.get('/my-cart', isAuthenticated, async (req, res) => {
    try {
        const cartData = await cartItems(req.user.id);
        
        res.json({
            msg: 'Cart retrieved successfully',
            items: cartData.items,
            summary: {
                total_price: cartData.total_price,
                total_items: cartData.total_items,
                total_quantity: cartData.total_quantity
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({msg: 'Server error'});
    }
});


// update cart item quantity.
cartRouter.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const { quantity } = req.body;
        
        if (!quantity || quantity < 1) {
            return res.status(400).json({ msg: 'Valid quantity required' });
        }
        
        const updatedItem = await updateCartItem(req.user.id, req.params.id, quantity);
        
        if (!updatedItem) {
            return res.status(404).json({ msg: 'Cart item not found' });
        }
        
        res.json({
            msg: 'Cart item updated successfully',
            cartItem: updatedItem
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({msg: 'Server error'});
    }
});

// remove item from cart.
cartRouter.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const deletedItem = await removeFromCart(req.user.id, req.params.id);
        
        if (!deletedItem) {
            return res.status(404).json({ msg: 'Cart item not found' });
        }
        
        res.json({
            msg: 'Item removed from cart successfully',
            cartItem: deletedItem
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({msg: 'Server error'});
    }
});

// clear user full cart.
cartRouter.delete('/', isAuthenticated, async (req, res) => {
    try {
        const clearedItems = await clearCart(req.user.id);
        res.json({
            msg: 'Cart cleared successfully',
            itemsRemoved: clearedItems.length
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({msg: 'Server error'});
    }
});

// Checkout endpoint
cartRouter.post('/checkout', isAuthenticated, async (req, res) => {
    try {
        const { payment_method, card_number, card_expiry, card_cvv } = req.body;

        const cartData = await cartItems(req.user.id);

        if (!cartData.items || cartData.items.length === 0) {
            return res.status(400).json({
                msg: 'Cart is empty'
            });
        }

        if (!payment_method) {
            return res.status(400).json({
                msg: 'Payment method is required'
            });
        }

        // Validate payment details for credit card
        if (payment_method === 'credit_card') {
            if (!card_number || !card_expiry || !card_cvv) {
                return res.status(400).json({
                    msg: 'Credit card details incomplete'
                });
            }

            if (card_number.length < 13 || card_number.length > 19) {
                return res.status(400).json({
                    msg: 'Invalid card number'
                });
            }

            if (card_cvv.length < 3 || card_cvv.length > 4) {
                return res.status(400).json({
                    msg: 'Invalid CVV'
                });
            }

            const expiryValidation = validateCardExpiry(card_expiry);
            if (!expiryValidation.valid) {
                return res.status(400).json({
                    msg: expiryValidation.message
                });
            }
        }

        // Process payment 
        const paymentResult = await simulatePayment({
            payment_method,
            card_number,
            card_expiry,
            card_cvv,
            amount: cartData.total_price
        });

        if (!paymentResult.success) {
            return res.status(402).json({
                msg: 'Payment failed',
                error: paymentResult.error
            });
        }

        // Create order
        const order = await createOrder(
            req.user.id,
            cartData,
            { payment_method }
        );

        res.status(201).json({
            msg: 'Checkout successful! Order created.',
            order: {
                order_id: order.id,
                total_amount: order.total_amount,
                status: order.status,
                created_at: order.created_at
            },
            payment: {
                confirmation_id: paymentResult.confirmation_id,
                payment_method: payment_method
            }
        });

    } catch(err) {
        console.error(err.message);
        res.status(500).json({
            msg: 'Checkout failed',
            error: 'Server error occurred during checkout'
        });
    }
});