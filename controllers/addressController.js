const database = require('../models/database');

class AddressController {
    // Get all addresses for a customer
    async getCustomerAddresses(req, res) {
        try {
            const { id } = req.params;
            const db = database.getConnection();
            
            const sql = 'SELECT * FROM addresses WHERE customer_id = ? ORDER BY is_primary DESC, created_at ASC';
            
            db.all(sql, [id], (err, addresses) => {
                if (err) {
                    return res.status(400).json({ error: err.message });
                }
                
                res.json({
                    message: 'Addresses retrieved successfully',
                    data: addresses
                });
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Add new address for a customer
    async addAddress(req, res) {
        try {
            const { id } = req.params;
            const { address_details, city, state, pin_code, is_primary = false } = req.body;
            const db = database.getConnection();
            
            // Check if customer exists
            db.get('SELECT id FROM customers WHERE id = ?', [id], (err, customer) => {
                if (err) {
                    return res.status(400).json({ error: err.message });
                }
                
                if (!customer) {
                    return res.status(404).json({ error: 'Customer not found' });
                }
                
                // If this is primary address, unset other primary addresses
                if (is_primary) {
                    db.run('UPDATE addresses SET is_primary = 0 WHERE customer_id = ?', [id]);
                }
                
                const sql = 'INSERT INTO addresses (customer_id, address_details, city, state, pin_code, is_primary) VALUES (?, ?, ?, ?, ?, ?)';
                
                db.run(sql, [id, address_details, city, state, pin_code, is_primary ? 1 : 0], function(err) {
                    if (err) {
                        return res.status(400).json({ error: err.message });
                    }
                    
                    res.status(201).json({
                        message: 'Address added successfully',
                        data: { 
                            id: this.lastID, 
                            customer_id: id, 
                            address_details, 
                            city, 
                            state, 
                            pin_code, 
                            is_primary 
                        }
                    });
                });
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Update address
    async updateAddress(req, res) {
        try {
            const { addressId } = req.params;
            const { address_details, city, state, pin_code, is_primary = false } = req.body;
            const db = database.getConnection();
            
            // Get customer_id for this address
            db.get('SELECT customer_id FROM addresses WHERE id = ?', [addressId], (err, address) => {
                if (err) {
                    return res.status(400).json({ error: err.message });
                }
                
                if (!address) {
                    return res.status(404).json({ error: 'Address not found' });
                }
                
                // If this is primary address, unset other primary addresses for the same customer
                if (is_primary) {
                    db.run('UPDATE addresses SET is_primary = 0 WHERE customer_id = ? AND id != ?', [address.customer_id, addressId]);
                }
                
                const sql = `
                    UPDATE addresses 
                    SET address_details = ?, city = ?, state = ?, pin_code = ?, is_primary = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `;
                
                db.run(sql, [address_details, city, state, pin_code, is_primary ? 1 : 0, addressId], function(err) {
                    if (err) {
                        return res.status(400).json({ error: err.message });
                    }
                    
                    if (this.changes === 0) {
                        return res.status(404).json({ error: 'Address not found' });
                    }
                    
                    res.json({
                        message: 'Address updated successfully',
                        data: { 
                            id: addressId, 
                            customer_id: address.customer_id, 
                            address_details, 
                            city, 
                            state, 
                            pin_code, 
                            is_primary 
                        }
                    });
                });
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Delete address
    async deleteAddress(req, res) {
        try {
            const { addressId } = req.params;
            const db = database.getConnection();
            
            const sql = 'DELETE FROM addresses WHERE id = ?';
            
            db.run(sql, [addressId], function(err) {
                if (err) {
                    return res.status(400).json({ error: err.message });
                }
                
                if (this.changes === 0) {
                    return res.status(404).json({ error: 'Address not found' });
                }
                
                res.json({
                    message: 'Address deleted successfully',
                    data: { id: addressId }
                });
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Search addresses by city, state, or pin code
    async searchAddresses(req, res) {
        try {
            const { city = '', state = '', pin_code = '' } = req.query;
            const db = database.getConnection();
            
            if (!city && !state && !pin_code) {
                return res.status(400).json({ error: 'At least one search parameter is required' });
            }
            
            let sql = `
                SELECT a.*, c.first_name, c.last_name, c.phone_number
                FROM addresses a
                INNER JOIN customers c ON a.customer_id = c.id
                WHERE 1=1
            `;
            
            const params = [];
            
            if (city) {
                sql += ' AND a.city LIKE ?';
                params.push(`%${city}%`);
            }
            
            if (state) {
                sql += ' AND a.state LIKE ?';
                params.push(`%${state}%`);
            }
            
            if (pin_code) {
                sql += ' AND a.pin_code LIKE ?';
                params.push(`%${pin_code}%`);
            }
            
            sql += ' ORDER BY c.first_name, c.last_name';
            
            db.all(sql, params, (err, addresses) => {
                if (err) {
                    return res.status(400).json({ error: err.message });
                }
                
                res.json({
                    message: 'Addresses found successfully',
                    data: addresses
                });
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new AddressController();
