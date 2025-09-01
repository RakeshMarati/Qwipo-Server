const sqlite3 = require('sqlite3').verbose();

class Database {
    constructor() {
        this.db = null;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database('./database.db', (err) => {
                if (err) {
                    console.error('Error opening database:', err.message);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database.');
                    resolve();
                }
            });
        });
    }

    initialize() {
        return new Promise((resolve, reject) => {
            const createCustomersTable = `
                CREATE TABLE IF NOT EXISTS customers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    first_name TEXT NOT NULL,
                    last_name TEXT NOT NULL,
                    phone_number TEXT NOT NULL UNIQUE,
                    email TEXT UNIQUE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            const createAddressesTable = `
                CREATE TABLE IF NOT EXISTS addresses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    customer_id INTEGER NOT NULL,
                    address_details TEXT NOT NULL,
                    city TEXT NOT NULL,
                    state TEXT NOT NULL,
                    pin_code TEXT NOT NULL,
                    is_primary BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
                )
            `;

            this.db.serialize(() => {
                this.db.run(createCustomersTable, (err) => {
                    if (err) {
                        console.error('Error creating customers table:', err);
                        reject(err);
                        return;
                    }
                });

                this.db.run(createAddressesTable, (err) => {
                    if (err) {
                        console.error('Error creating addresses table:', err);
                        reject(err);
                        return;
                    }
                });

                // Create indexes for better performance
                this.db.run('CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_number)', (err) => {
                    if (err) console.error('Error creating phone index:', err);
                });

                this.db.run('CREATE INDEX IF NOT EXISTS idx_addresses_customer ON addresses(customer_id)', (err) => {
                    if (err) console.error('Error creating customer index:', err);
                });

                this.db.run('CREATE INDEX IF NOT EXISTS idx_addresses_city ON addresses(city)', (err) => {
                    if (err) console.error('Error creating city index:', err);
                });

                this.db.run('CREATE INDEX IF NOT EXISTS idx_addresses_state ON addresses(state)', (err) => {
                    if (err) console.error('Error creating state index:', err);
                });

                this.db.run('CREATE INDEX IF NOT EXISTS idx_addresses_pin ON addresses(pin_code)', (err) => {
                    if (err) console.error('Error creating pin index:', err);
                });

                resolve();
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err.message);
                        reject(err);
                    } else {
                        console.log('Database connection closed.');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    getConnection() {
        return this.db;
    }
}

module.exports = new Database();
