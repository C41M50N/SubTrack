CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, name)
);

CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    cost_amount INTEGER NOT NULL, -- in cents
    cost_frequency VARCHAR(20),  -- this should be an enum in Drizzle
    next_invoice_date DATE NOT NULL,
    last_invoice_date DATE,
    send_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_subscriptions_user_next_invoice ON subscriptions(user_id, next_invoice_date);
CREATE INDEX idx_subscriptions_notifications ON subscriptions(send_notifications, next_invoice_date);

CREATE TABLE subscription_invoices (
    id SERIAL PRIMARY KEY,
    subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- in cents
    invoice_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_invoices_subscription_date ON subscription_invoices(subscription_id, invoice_date DESC);
CREATE INDEX idx_invoices_date ON subscription_invoices(invoice_date);
