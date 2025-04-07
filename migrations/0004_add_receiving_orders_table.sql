-- Create receiving_orders table
CREATE TABLE IF NOT EXISTS receiving_orders (
    id SERIAL PRIMARY KEY,
    job_order_id INTEGER NOT NULL REFERENCES job_orders(id) ON DELETE CASCADE,
    roll_id INTEGER NOT NULL REFERENCES rolls(id) ON DELETE CASCADE,
    received_quantity NUMERIC(10, 2),
    received_date TIMESTAMP DEFAULT NOW(),
    received_by INTEGER REFERENCES users(id),
    notes TEXT,
    status VARCHAR(100) DEFAULT 'received',
    created_date TIMESTAMP DEFAULT NOW()
);

-- Add index for fast lookups
CREATE INDEX idx_receiving_orders_job_order_id ON receiving_orders(job_order_id);
CREATE INDEX idx_receiving_orders_roll_id ON receiving_orders(roll_id);