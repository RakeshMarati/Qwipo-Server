# Customer Management System - Backend

A Node.js/Express.js backend API for managing customers and their addresses with SQLite database.

## Project Structure

```
server/
├── models/
│   └── database.js          # Database connection and initialization
├── controllers/
│   ├── customerController.js # Customer business logic
│   └── addressController.js  # Address business logic
├── routes/
│   ├── customerRoutes.js     # Customer API routes
│   └── addressRoutes.js      # Address API routes
├── middleware/
│   ├── validation.js         # Input validation middleware
│   └── errorHandler.js       # Error handling middleware
├── utils/
│   └── responseHandler.js    # Response utility functions
├── app.js                    # Express app configuration
├── index.js                  # Server entry point
└── package.json
```

## Features

- **Customer Management**: Full CRUD operations for customers
- **Address Management**: Full CRUD operations for addresses
- **Search & Filtering**: Search customers by name, phone, email
- **Address Search**: Search addresses by city, state, pin code
- **Pagination**: Built-in pagination for large datasets
- **Validation**: Comprehensive input validation
- **Error Handling**: Centralized error handling
- **Database**: SQLite with proper indexing

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Customer Endpoints

#### Create Customer
```
POST /api/customers
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "1234567890",
  "email": "john@example.com"
}
```

#### Get All Customers (with pagination & search)
```
GET /api/customers?page=1&limit=10&search=john&city=mumbai&state=maharashtra&pin_code=400001&sortBy=first_name&sortOrder=ASC
```

#### Get Customer by ID
```
GET /api/customers/:id
```

#### Update Customer
```
PUT /api/customers/:id
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Smith",
  "phone_number": "1234567890",
  "email": "john.smith@example.com"
}
```

#### Delete Customer
```
DELETE /api/customers/:id
```

#### Get Customers with Multiple Addresses
```
GET /api/customers/multiple-addresses/list
```

#### Get Customers with Single Address
```
GET /api/customers/single-address/list
```

### Address Endpoints

#### Get Customer Addresses
```
GET /api/customers/:id/addresses
```

#### Add Address to Customer
```
POST /api/customers/:id/addresses
Content-Type: application/json

{
  "address_details": "123 Main Street, Apartment 4B",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pin_code": "400001",
  "is_primary": true
}
```

#### Update Address
```
PUT /api/addresses/:addressId
Content-Type: application/json

{
  "address_details": "456 Oak Avenue",
  "city": "Pune",
  "state": "Maharashtra",
  "pin_code": "411001",
  "is_primary": false
}
```

#### Delete Address
```
DELETE /api/addresses/:addressId
```

#### Search Addresses
```
GET /api/addresses/search?city=mumbai&state=maharashtra&pin_code=400001
```

### Health Check
```
GET /api/health
```

## Database Schema

### Customers Table
```sql
CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone_number TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Addresses Table
```sql
CREATE TABLE addresses (
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
);
```

## Validation Rules

### Customer Validation
- First name: Required, minimum 2 characters
- Last name: Required, minimum 2 characters
- Phone number: Required, valid format
- Email: Optional, valid email format if provided

### Address Validation
- Address details: Required, minimum 5 characters
- City: Required, minimum 2 characters
- State: Required, minimum 2 characters
- PIN code: Required, 6 digits

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

## Development

### Adding New Features

1. **Controllers**: Add business logic in `controllers/`
2. **Routes**: Define API endpoints in `routes/`
3. **Middleware**: Add validation or other middleware in `middleware/`
4. **Models**: Add database models in `models/`

### Testing

The API can be tested using tools like:
- Postman
- curl
- Thunder Client (VS Code extension)

### Environment Variables

Create a `.env` file for environment-specific configuration:

```env
PORT=5000
NODE_ENV=development
```

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Input Validation**: Comprehensive validation
- **SQL Injection Protection**: Parameterized queries
- **Error Handling**: No sensitive information in errors
