# Smart Expense Tracker - Backend API

A complete RESTful API for managing expenses with user authentication built using Node.js, Express, and MongoDB.

## 🚀 Features

- ✅ User Authentication (Register/Login with JWT)
- ✅ Password Hashing with bcrypt
- ✅ Protected Routes with JWT Middleware
- ✅ Complete CRUD Operations for Expenses
- ✅ Expense Statistics & Analytics
- ✅ MongoDB Database with Mongoose ODM
- ✅ Error Handling & Validation
- ✅ CORS Enabled

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js              # MongoDB connection
├── controllers/
│   ├── authController.js  # Authentication logic
│   └── expenseController.js # Expense management logic
├── middleware/
│   └── auth.js            # JWT authentication middleware
├── models/
│   ├── User.js            # User schema
│   └── Expense.js         # Expense schema
├── routes/
│   ├── auth.js            # Auth routes
│   └── expenses.js        # Expense routes
├── .env.example           # Environment variables template
├── server.js              # Main application entry point
└── package.json           # Dependencies
```

## 🛠️ Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Environment Variables

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expense-tracker
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=development
```

### 3. Start MongoDB

Make sure MongoDB is running on your machine:

```bash
# If using MongoDB locally
mongod

# Or use MongoDB Atlas (cloud database)
# Update MONGODB_URI in .env with your Atlas connection string
```

### 4. Run the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will start at: `http://localhost:5000`

## 📡 API Endpoints

### Authentication Routes

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Soni Sharma",
  "email": "soni@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "_id": "...",
    "name": "Soni Sharma",
    "email": "soni@example.com",
    "token": "jwt_token_here"
  }
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "soni@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "_id": "...",
    "name": "Soni Sharma",
    "email": "soni@example.com",
    "token": "jwt_token_here"
  }
}
```

#### Get User Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Expense Routes

**Note:** All expense routes require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

#### Add Expense
```http
POST /api/expenses/add
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Swiggy Order",
  "amount": 350,
  "category": "Food",
  "date": "2026-03-15",
  "notes": "Dinner from local restaurant"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Expense added successfully",
  "data": {
    "_id": "...",
    "title": "Swiggy Order",
    "amount": 350,
    "category": "Food",
    "date": "2026-03-15T00:00:00.000Z",
    "notes": "Dinner from local restaurant",
    "userId": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### Get All Expenses
```http
GET /api/expenses
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 8670,
  "data": [
    {
      "_id": "...",
      "title": "Swiggy Order",
      "amount": 350,
      "category": "Food",
      "date": "2026-03-15T00:00:00.000Z",
      "notes": "Dinner",
      "userId": "...",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

#### Get Single Expense
```http
GET /api/expenses/:id
Authorization: Bearer <token>
```

#### Update Expense
```http
PUT /api/expenses/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "amount": 400,
  "category": "Food",
  "notes": "Updated notes"
}
```

#### Delete Expense
```http
DELETE /api/expenses/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Expense deleted successfully",
  "data": {}
}
```

#### Get Expense Statistics
```http
GET /api/expenses/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalExpenses": 8670,
    "totalTransactions": 10,
    "averageExpense": "867.00",
    "categoryBreakdown": {
      "Food": 775,
      "Transport": 400,
      "Shopping": 3998
    },
    "monthlyBreakdown": {
      "Mar": 8670
    }
  }
}
```

## 📊 Database Models

### User Schema
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  timestamps: true
}
```

### Expense Schema
```javascript
{
  title: String (required),
  amount: Number (required, min: 0),
  category: String (required, enum: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Education']),
  date: Date (required),
  notes: String,
  userId: ObjectId (required, ref: 'User'),
  timestamps: true
}
```

## 🔐 Authentication Flow

1. User registers with name, email, and password
2. Password is hashed using bcrypt (10 salt rounds)
3. JWT token is generated with 30-day expiration
4. User receives token in response
5. Token must be included in Authorization header for protected routes
6. Middleware validates token and attaches user to request object

## 🧪 Testing with Postman/Thunder Client

1. **Register a user** → Save the token
2. **Login** → Get new token if needed
3. **Add the token to Authorization header** for all expense endpoints
4. **Test CRUD operations** on expenses

## 🚨 Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description here"
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/expense-tracker` |
| `JWT_SECRET` | Secret key for JWT | `your_secret_key` |
| `NODE_ENV` | Environment | `development` or `production` |

## 📝 Notes

- Password minimum length: 6 characters
- JWT token expires in 30 days
- All expense amounts must be positive numbers
- Categories are limited to predefined values
- Users can only access their own expenses

## 🤝 Integration with React Frontend

To connect with your React frontend:

1. Update API base URL in frontend
2. Store JWT token in localStorage/context
3. Add token to Authorization header in API calls
4. Handle authentication state in React

Example frontend API call:
```javascript
const token = localStorage.getItem('token');

fetch('http://localhost:5000/api/expenses', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log(data));
```

## 📦 Dependencies

- `express` - Web framework
- `mongoose` - MongoDB ODM
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `dotenv` - Environment variables
- `cors` - CORS middleware
- `nodemon` - Development auto-reload

## 🎯 Ready to Use!

Your backend is now ready to connect with the React frontend. Make sure MongoDB is running and the server is started before testing!
