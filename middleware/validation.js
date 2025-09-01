const validateCustomer = (req, res, next) => {
    const { first_name, last_name, phone_number, email } = req.body;
    
    if (!first_name || !last_name || !phone_number) {
        return res.status(400).json({ error: 'First name, last name, and phone number are required' });
    }
    
    if (first_name.trim().length < 2) {
        return res.status(400).json({ error: 'First name must be at least 2 characters long' });
    }
    
    if (last_name.trim().length < 2) {
        return res.status(400).json({ error: 'Last name must be at least 2 characters long' });
    }
    
    // Phone number validation (basic)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phone_number.replace(/\s/g, ''))) {
        return res.status(400).json({ error: 'Invalid phone number format' });
    }
    
    // Email validation (if provided)
    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
    }
    
    next();
};

const validateAddress = (req, res, next) => {
    const { address_details, city, state, pin_code } = req.body;
    
    if (!address_details || !city || !state || !pin_code) {
        return res.status(400).json({ error: 'All address fields are required' });
    }
    
    if (address_details.trim().length < 5) {
        return res.status(400).json({ error: 'Address details must be at least 5 characters long' });
    }
    
    if (city.trim().length < 2) {
        return res.status(400).json({ error: 'City must be at least 2 characters long' });
    }
    
    if (state.trim().length < 2) {
        return res.status(400).json({ error: 'State must be at least 2 characters long' });
    }
    
    // PIN code validation (6 digits for India)
    const pinRegex = /^[1-9][0-9]{5}$/;
    if (!pinRegex.test(pin_code)) {
        return res.status(400).json({ error: 'PIN code must be 6 digits' });
    }
    
    next();
};

module.exports = {
    validateCustomer,
    validateAddress
};
