const pool = require("../db/connection");


// get all products.
async function getProducts() {
    try {
        const product = await pool.query(`SELECT * FROM products`);
        return product.rows;
    } catch(err) {
        console.error(err.message)
    }
};


// get shop product by item id.
async function getProductiD(id) {
    try {
        const product = await pool.query(`SELECT * FROM products WHERE id = $1`,
            [id]);
        return product.rows[0];
    } catch(err) {
        console.error(err.message)
    }
};

// Add new product to the shop.
async function createProduct(productInfo) {
    const {name, price, stock_count, image_url} = productInfo;
    
    try {
        const result = await pool.query(`INSERT INTO products (name, price, stockCount, image_url)
            VALUES ($1, $2, $3, $4)
            RETURNING *`, [name, price, stock_count, image_url]
        );
        return result.rows[0]
            
    } catch(err) {
        console.error(err.message)
    }
};


// Update product details.
async function updateProduct(id, productInfo) {
    const {name, price, stock_count} = productInfo;
    
    try{
        const result = await pool.query(`UPDATE products
        SET name = $1, price = $2, stock_count = $3 WHERE id = $4`, [name, price, stock_count]);

        return result.rows[0]
    } catch(err) {
        console.error(err.message);
    }
};

// Delete product from the store.
async function deleteProduct(id) {
    try {
        const result = await pool.query(`DELETE FROM products WHERE id = $1 RETURNING *`,
        [id]
        );
        return result.rows[0]
    } catch(err) {
        console.error(err.message);
    }
};

module.exports = { getProducts, getProductiD, createProduct, deleteProduct, updateProduct}