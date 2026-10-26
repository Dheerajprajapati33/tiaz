# Digital Gold Platform - Backend API Server

A modular, production-ready RESTful API backend built using Node.js, Express, and MongoDB (Mongoose) for a 24K/22K Digital Gold investment and wallet platform.

---

## 📁 Project Architecture

```
server/
│
├── src/
│   ├── config/              # Configuration (DB, Env, Logger)
│   ├── models/              # Mongoose Data Models & Schemas
│   ├── controllers/         # Request handlers & logic dispatchers
│   ├── services/            # Core business logic layer
│   ├── routes/              # Express API Route endpoints
│   ├── middleware/          # Auth, Validation, Upload, Error & Rate Limiter
│   ├── validators/          # Express-validator schema rules
│   ├── utils/               # Helper utilities (JWT, OTP, Response, etc.)
│   ├── uploads/             # Media upload storage (KYC docs, Profiles)
│   ├── app.js               # Express application initialization
│   └── server.js            # Server entry point & DB connection
│
├── .env                     # Local environment secrets
├── .env.example             # Example environment template
├── .gitignore               # Ignored git files
├── package.json             # Dependencies and scripts
└── README.md                # Project documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally or a MongoDB Atlas URI

### 2. Installation
Navigate into the `server` directory and install dependencies:
```bash
cd server
npm install
```

### 3. Environment Configuration
Check `.env` file in the `server` directory:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/gold_app_db
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your_refresh_token_secret_key
REFRESH_TOKEN_EXPIRES_IN=30d
CLIENT_URL=http://localhost:3000
UPLOAD_DIR=uploads
```

### 4. Running the Server

#### Development mode (with live reload):
```bash
npm run dev
```

#### Production mode:
```bash
npm start
```

---

## 📡 API Overview

Base URL: `http://localhost:5000/api/v1`

| Module | Base Path | Description |
|---|---|---|
| **Health** | `GET /api/v1/health` | Health and status check |
| **Auth** | `/api/v1/auth` | OTP login/register, verify OTP, password login |
| **User** | `/api/v1/user` | Profile view, update, avatar upload, password change |
| **KYC** | `/api/v1/kyc` | KYC document upload (Aadhaar/PAN), verification status |
| **Gold** | `/api/v1/gold` | Live gold rates (24K/22K), buy gold, sell gold, orders |
| **Wallet** | `/api/v1/wallet` | View gold grams & cash balance, add balance |
| **Transactions** | `/api/v1/transactions` | Transaction history, detail queries |
| **Bank** | `/api/v1/banks` | Add/manage bank accounts for payouts |
| **Referrals** | `/api/v1/referrals` | Referral code, bonus summary & referee list |
| **Notifications** | `/api/v1/notifications`| In-app alerts, read status |
| **Security** | `/api/v1/security` | Login history, active registered devices |
| **Support** | `/api/v1/support` | Support tickets, threaded messaging, FAQs |

---

## 🔒 Security Best Practices Implemented
- **Helmet**: Secures HTTP response headers.
- **CORS**: Configurable cross-origin resource sharing.
- **Express Rate Limit**: Protects authentication & public endpoints against brute force / DDoS.
- **Input Validation**: `express-validator` sanitizes and verifies input data before hitting controllers.
- **Centralized Error Handling**: Ensures error details are safely formatted and not leaking internal stack traces in production.
