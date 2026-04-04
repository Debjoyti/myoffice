import random
import uuid
import os
from datetime import datetime, timedelta, timezone

# ───────────────── ENTITY CONFIG ───────────────
NUM_USERS = 150
NUM_PRODUCTS = 120
NUM_ORDERS = 200
NUM_REVIEWS = 150
NUM_LOGS = 250

def get_now(): return datetime.now(timezone.utc)
def random_date(days_back=365):
    return (get_now() - timedelta(days=random.randint(0, days_back))).strftime('%Y-%m-%d %H:%M:%S')

# ───────────────── DATA ───────────────────────
FIRST_NAMES = ["Liam", "Olivia", "Noah", "Emma", "Oliver", "Ava", "Elijah", "Charlotte", "William", "Sophia", "James", "Amelia", "Benjamin", "Isabella", "Lucas", "Mia", "Henry", "Evelyn", "Alexander", "Harper"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"]
DOMAINS = ["gmail.com", "outlook.com", "company-internal.net", "test-user-group.org", "guest-checkout.com"]
ROLES = ["admin", "editor", "moderator", "customer", "guest"]
CATEGORIES = ["Electronics", "Fashion", "Home & Garden", "Books", "Beauty", "Sports", "Toys", "Automotive"]
STATUSES_USER = ["active", "inactive", "banned", "pending"]
STATUSES_ORDER = ["pending", "completed", "failed", "cancelled", "refunded"]
STATUSES_PAYMENT = ["success", "failed", "processing", "refunded"]
CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "AUD"]
COUNTRIES = ["USA", "UK", "Germany", "India", "Japan", "Australia", "Canada", "France"]

# ───────────────── SCHEMA ────────────────────────

schema = """
-- ───────────────────────────────────────────────────────────
-- PRODUCTION-GRADE SAAS + E-COMMERCE SCHEMA v1.0
-- ───────────────────────────────────────────────────────────

DROP TABLE IF EXISTS AdminLogs;
DROP TABLE IF EXISTS Reviews;
DROP TABLE IF EXISTS Payments;
DROP TABLE IF EXISTS OrderItems;
DROP TABLE IF EXISTS Orders;
DROP TABLE IF EXISTS ProductVariants;
DROP TABLE IF EXISTS Products;
DROP TABLE IF EXISTS Categories;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Roles;

-- 1. AUTHENTICATION MODULE
CREATE TABLE Roles (
    id UUID PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role_id UUID REFERENCES Roles(id),
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, banned, pending
    is_soft_deleted BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. PRODUCT CATALOG MODULE
CREATE TABLE Categories (
    id UUID PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    parent_id UUID REFERENCES Categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Products (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES Categories(id),
    base_price DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ProductVariants (
    id UUID PRIMARY KEY,
    product_id UUID REFERENCES Products(id),
    sku VARCHAR(100) UNIQUE NOT NULL,
    attribute_name VARCHAR(50), -- e.g., Color, Size
    attribute_value VARCHAR(100),
    price_modifier DECIMAL(15, 2) DEFAULT 0.00,
    inventory_count INT DEFAULT 0
);

-- 3. SALES & CART MODULE
CREATE TABLE Orders (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES Users(id), -- Null if Guest
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, cancelled, refunded
    total_amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3),
    shipping_address_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE OrderItems (
    id UUID PRIMARY KEY,
    order_id UUID REFERENCES Orders(id),
    product_id UUID REFERENCES Products(id),
    variant_id UUID REFERENCES ProductVariants(id),
    quantity INT NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL
);

-- 4. FINANCE & FLOW MODULE
CREATE TABLE Payments (
    id UUID PRIMARY KEY,
    order_id UUID REFERENCES Orders(id),
    transaction_id VARCHAR(255) UNIQUE,
    provider VARCHAR(50), -- e.g., Stripe, PayPal
    status VARCHAR(20), -- success, failed, processing, refunded
    amount DECIMAL(15, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. AUDIT & REVIEWS
CREATE TABLE Reviews (
    id UUID PRIMARY KEY,
    product_id UUID REFERENCES Products(id),
    user_id UUID REFERENCES Users(id),
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE AdminLogs (
    id UUID PRIMARY KEY,
    admin_id UUID REFERENCES Users(id),
    action VARCHAR(100),
    entity_id UUID,
    payload TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_products_category ON Products(category_id);
CREATE INDEX idx_orders_user ON Orders(user_id);
CREATE INDEX idx_payments_order ON Payments(order_id);
"""

# ───────────────── DATA GEN ───────────────────────

inserts = []

# Roles
role_map = {}
for r in ROLES:
    rid = str(uuid.uuid4())
    role_map[r] = rid
    inserts.append(f"INSERT INTO Roles (id, name, description) VALUES ('{rid}', '{r}', 'System {r} access');")

# Categories
cat_map = []
for c in CATEGORIES:
    cid = str(uuid.uuid4())
    cat_map.append(cid)
    inserts.append(f"INSERT INTO Categories (id, name) VALUES ('{cid}', '{c}');")

# Users
user_map = []
for i in range(NUM_USERS):
    uid = str(uuid.uuid4())
    user_map.append(uid)
    fn, ln = random.choice(FIRST_NAMES), random.choice(LAST_NAMES)
    email = f"{fn.lower()}.{ln.lower()}.{i}@{random.choice(DOMAINS)}"
    role_id = role_map[random.choice(ROLES)]
    status = random.choice(STATUSES_USER)
    soft_del = 'true' if i < 5 else 'false' # Soft delete edge case
    inserts.append(f"INSERT INTO Users (id, email, password_hash, first_name, last_name, role_id, status, is_soft_deleted, created_at) VALUES ('{uid}', '{email}', 'bcrypt_hash_v2_xyz', '{fn}', '{ln}', '{role_id}', '{status}', {soft_del}, '{random_date(400)}');")

# Products & Variants
product_map = []
variant_map = []
for i in range(NUM_PRODUCTS):
    pid = str(uuid.uuid4())
    product_map.append(pid)
    name = f"Module-{i} Premium Item"
    price = random.uniform(20.0, 5000.0)
    cat_id = random.choice(cat_map)
    inserts.append(f"INSERT INTO Products (id, name, description, category_id, base_price, created_at) VALUES ('{pid}', '{name}', 'Production grade product record with edge case variations.', '{cat_id}', {price:.2f}, '{random_date(100)}');")
    
    # 2 variants per product
    for v in ["Small", "Large"]:
        vid = str(uuid.uuid4())
        variant_map.append(vid)
        sku = f"SKU-{str(uuid.uuid4())[:8].upper()}"
        inv = random.randint(0, 1000) # Edge case: Some will be 0
        inserts.append(f"INSERT INTO ProductVariants (id, product_id, sku, attribute_name, attribute_value, inventory_count) VALUES ('{vid}', '{pid}', '{sku}', 'Size', '{v}', {inv});")

# Orders & OrderItems
for i in range(NUM_ORDERS):
    oid = str(uuid.uuid4())
    uid = random.choice(user_map) if i > 10 else "NULL" # Null user = Guest Flow
    status = random.choice(STATUSES_ORDER)
    total = random.uniform(50.0, 10000.0)
    curr = random.choice(CURRENCIES)
    uid_str = f"'{uid}'" if uid != "NULL" else "NULL"
    inserts.append(f"INSERT INTO Orders (id, user_id, status, total_amount, currency, created_at) VALUES ('{oid}', {uid_str}, '{status}', {total:.2f}, '{curr}', '{random_date(30)}');")
    
    # Items
    for j in range(random.randint(1, 4)):
        iid = str(uuid.uuid4())
        pid = random.choice(product_map)
        vid = random.choice(variant_map)
        inserts.append(f"INSERT INTO OrderItems (id, order_id, product_id, variant_id, quantity, unit_price) VALUES ('{iid}', '{oid}', '{pid}', '{vid}', {random.randint(1, 5)}, 100.00);")

    # Payment for order
    pay_id = str(uuid.uuid4())
    tx_id = f"TX-{str(uuid.uuid4())[:12].upper()}"
    p_status = random.choice(STATUSES_PAYMENT)
    inserts.append(f"INSERT INTO Payments (id, order_id, transaction_id, provider, status, amount) VALUES ('{pay_id}', '{oid}', '{tx_id}', 'Stripe', '{p_status}', {total:.2f});")

# Reviews
for i in range(NUM_REVIEWS):
    rid = str(uuid.uuid4())
    pid = random.choice(product_map)
    uid = random.choice(user_map)
    rating = random.randint(1, 5)
    inserts.append(f"INSERT INTO Reviews (id, product_id, user_id, rating, comment, created_at) VALUES ('{rid}', '{pid}', '{uid}', {rating}, 'Testing product review module with rating {rating}', '{random_date(10)}');")

# AdminLogs
for i in range(NUM_LOGS):
    lid = str(uuid.uuid4())
    inserts.append(f"INSERT INTO AdminLogs (id, admin_id, action, entity_id, created_at) VALUES ('{lid}', '{random.choice(user_map)}', '{random.choice(['update_product', 'ban_user', 'refund_order', 'delete_variant'])}', '{random.choice(product_map)}', '{random_date(5)}');")


# Final Write
output_file = "c:\\Users\\Debjoyti\\Downloads\\myoffice-main\\myoffice-main\\database\\seeding\\full_ecommerce_suite.sql"
with open(output_file, "w", encoding='utf-8') as f:
    f.write(schema)
    f.write("\n\n-- SEED DATA\n")
    for ins in inserts:
        f.write(ins + "\n")

print(f"Success! SQL generated at {output_file}")
