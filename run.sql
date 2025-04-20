CREATE TABLE IF NOT EXISTS food_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    citizenid VARCHAR(100),
    customer_name VARCHAR(128),
    items LONGTEXT,
    order_no VARCHAR(10),
    total_price DECIMAL(10,2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
