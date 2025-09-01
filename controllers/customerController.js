const database = require('../models/database');

class CustomerController {
    // Create a new customer
    async createCustomer(req, res) {
        try {
            const { first_name, last_name, phone_number, email } = req.body;
            const db = database.getConnection();
            
            const sql = 'INSERT INTO customers (first_name, last_name, phone_number, email) VALUES (?, ?, ?, ?)';
            
            db.run(sql, [first_name, last_name, phone_number, email], function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        if (err.message.includes('phone_number')) {
                            return res.status(400).json({ error: 'Phone number already exists' });
                        }
                        if (err.message.includes('email')) {
                            return res.status(400).json({ error: 'Email already exists' });
                        }
                    }
                    return res.status(400).json({ error: err.message });
                }
                
                res.status(201).json({
                    message: 'Customer created successfully',
                    data: { id: this.lastID, first_name, last_name, phone_number, email }
                });
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Get all customers with search, filtering, and pagination
    async getCustomers(req, res) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                search = '', 
                city = '', 
                state = '', 
                pin_code = '',
                sortBy = 'created_at',
                sortOrder = 'DESC'
            } = req.query;
            
            const offset = (page - 1) * limit;
            const validSortFields = ['first_name', 'last_name', 'phone_number', 'created_at'];
            const validSortOrders = ['ASC', 'DESC'];
            
            if (!validSortFields.includes(sortBy)) sortBy = 'created_at';
            if (!validSortOrders.includes(sortOrder.toUpperCase())) sortOrder = 'DESC';
            
            let sql = `
                SELECT DISTINCT c.*, 
                       COUNT(a.id) as address_count,
                       CASE WHEN COUNT(a.id) = 1 THEN 1 ELSE 0 END as has_only_one_address
                FROM customers c
                LEFT JOIN addresses a ON c.id = a.customer_id
            `;
            
            const conditions = [];
            const params = [];
            
            if (search) {
                conditions.push(`(c.first_name LIKE ? OR c.last_name LIKE ? OR c.phone_number LIKE ? OR c.email LIKE ?)`);
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm, searchTerm);
            }
            
            if (city || state || pin_code) {
                conditions.push(`EXISTS (
                    SELECT 1 FROM addresses a2 
                    WHERE a2.customer_id = c.id
                    ${city ? 'AND a2.city LIKE ?' : ''}
                    ${state ? 'AND a2.state LIKE ?' : ''}
                    ${pin_code ? 'AND a2.pin_code LIKE ?' : ''}
                )`);
                
                if (city) params.push(`%${city}%`);
                if (state) params.push(`%${state}%`);
                if (pin_code) params.push(`%${pin_code}%`);
            }
            
            if (conditions.length > 0) {
                sql += ' WHERE ' + conditions.join(' AND ');
            }
            
            sql += ` GROUP BY c.id ORDER BY c.${sortBy} ${sortOrder}`;
            
            const db = database.getConnection();
            
            // Get total count for pagination
            const countSql = sql.replace('SELECT DISTINCT c.*, COUNT(a.id) as address_count, CASE WHEN COUNT(a.id) = 1 THEN 1 ELSE 0 END as has_only_one_address', 'SELECT COUNT(DISTINCT c.id) as total');
            
            db.get(countSql, params, (err, countResult) => {
                if (err) {
                    return res.status(400).json({ error: err.message });
                }
                
                const total = countResult.total;
                const totalPages = Math.ceil(total / limit);
                
                sql += ` LIMIT ? OFFSET ?`;
                params.push(parseInt(limit), offset);
                
                db.all(sql, params, (err, rows) => {
                    if (err) {
                        return res.status(400).json({ error: err.message });
                    }
                    
                    res.json({
                        message: 'Customers retrieved successfully',
                        data: rows,
                        pagination: {
                            currentPage: parseInt(page),
                            totalPages,
                            totalItems: total,
                            itemsPerPage: parseInt(limit)
                        }
                    });
                });
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Get customer by ID
    async getCustomerById(req, res) {
        try {
            const { id } = req.params;
            const db = database.getConnection();
            
            const sql = `
                SELECT c.*, 
                       COUNT(a.id) as address_count,
                       CASE WHEN COUNT(a.id) = 1 THEN 1 ELSE 0 END as has_only_one_address
                FROM customers c
                LEFT JOIN addresses a ON c.id = a.customer_id
                WHERE c.id = ?
                GROUP BY c.id
            `;
            
            db.get(sql, [id], (err, customer) => {
                if (err) {
                    return res.status(400).json({ error: err.message });
                }
                
                if (!customer) {
                    return res.status(404).json({ error: 'Customer not found' });
                }
                
                res.json({
                    message: 'Customer retrieved successfully',
                    data: customer
                });
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Update customer
    async updateCustomer(req, res) {
        try {
            const { id } = req.params;
            const { first_name, last_name, phone_number, email } = req.body;
            const db = database.getConnection();
            
            const sql = `
                UPDATE customers 
                SET first_name = ?, last_name = ?, phone_number = ?, email = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            
            db.run(sql, [first_name, last_name, phone_number, email, id], function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        if (err.message.includes('phone_number')) {
                            return res.status(400).json({ error: 'Phone number already exists' });
                        }
                        if (err.message.includes('email')) {
                            return res.status(400).json({ error: 'Email already exists' });
                        }
                    }
                    return res.status(400).json({ error: err.message });
                }
                
                if (this.changes === 0) {
                    return res.status(404).json({ error: 'Customer not found' });
                }
                
                res.json({
                    message: 'Customer updated successfully',
                    data: { id, first_name, last_name, phone_number, email }
                });
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Delete customer
    async deleteCustomer(req, res) {
        try {
            const { id } = req.params;
            const db = database.getConnection();
            
            // Check if customer has any transactions (addresses)
            const checkSql = 'SELECT COUNT(*) as count FROM addresses WHERE customer_id = ?';
            
            db.get(checkSql, [id], (err, result) => {
                if (err) {
                    return res.status(400).json({ error: err.message });
                }
                
                const sql = 'DELETE FROM customers WHERE id = ?';
                
                db.run(sql, [id], function(err) {
                    if (err) {
                        return res.status(400).json({ error: err.message });
                    }
                    
                    if (this.changes === 0) {
                        return res.status(404).json({ error: 'Customer not found' });
                    }
                    
                    res.json({
                        message: 'Customer deleted successfully',
                        data: { id, addressesDeleted: result.count }
                    });
                });
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Get customers with multiple addresses
    async getCustomersWithMultipleAddresses(req, res) {
        try {
            const db = database.getConnection();
            
            const sql = `
                SELECT c.*, COUNT(a.id) as address_count
                FROM customers c
                INNER JOIN addresses a ON c.id = a.customer_id
                GROUP BY c.id
                HAVING COUNT(a.id) > 1
                ORDER BY address_count DESC
            `;
            
            db.all(sql, [], (err, customers) => {
                if (err) {
                    return res.status(400).json({ error: err.message });
                }
                
                res.json({
                    message: 'Customers with multiple addresses retrieved successfully',
                    data: customers
                });
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Get customers with only one address
    async getCustomersWithSingleAddress(req, res) {
        try {
            const db = database.getConnection();
            
            const sql = `
                SELECT c.*, COUNT(a.id) as address_count
                FROM customers c
                INNER JOIN addresses a ON c.id = a.customer_id
                GROUP BY c.id
                HAVING COUNT(a.id) = 1
                ORDER BY c.created_at DESC
            `;
            
            db.all(sql, [], (err, customers) => {
                if (err) {
                    return res.status(400).json({ error: err.message });
                }
                
                res.json({
                    message: 'Customers with single address retrieved successfully',
                    data: customers
                });
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new CustomerController();
