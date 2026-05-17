-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    username VARCHAR(50) UNIQUE,
    password VARCHAR(255)
);

-- Sign-in logs
CREATE TABLE user_signins (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    ip_address VARCHAR(50),
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI analysis history
CREATE TABLE art_history (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    image_path TEXT,
    color_scheme TEXT,
    art_style TEXT,
    artist_match TEXT,
    tools TEXT,
    tips TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment details
CREATE TABLE payment_details (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    card_number TEXT,
    expiry_date TEXT,
    cvv TEXT
);

-- Payment history
CREATE TABLE payment_history (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    amount_paid NUMERIC(10, 2),
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contact form messages
CREATE TABLE contact_messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    message TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI artist recommendations
CREATE TABLE artist_recommendations (
    id SERIAL PRIMARY KEY,
    style VARCHAR(50),
    artist_name VARCHAR(100),
    recommended_tools TEXT,
    improvement_tips TEXT
);
