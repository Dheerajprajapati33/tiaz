/**
 * OpenAPI 3.0.0 Specification for Tia'z Digital Gold & Silver Platform
 * Provides complete, interactive Swagger API documentation organized by folders (Tags)
 * Allows frontend/mobile developers to test all endpoints directly with "Try it out" and JWT Bearer auth.
 */

const swaggerJsDoc = require("swagger-jsdoc");
const path = require("path");

const baseSpec = {
  openapi: "3.0.0",
  info: {
    title: "Tia'z Digital Gold & Silver API Documentation",
    version: "2.0.0",
    description: `
### 🪙 Welcome to Tia'z Digital Gold & Silver Enterprise API Portal
This interactive documentation contains **all endpoints** for both the Customer Mobile/Web App and Admin Console.

---

### 🔑 Authentication Guide for Developers:
1. Go to **1. Authentication** -> execute **\`POST /api/v1/auth/verify-otp\`** (or **\`POST /api/v1/auth/admin/login\`**).
2. Copy the \`token\` string received in \`data.token\`.
3. Click the green **Authorize** 🔓 button at the top right of this page.
4. Paste the token into the **Value** input and click **Authorize**.
5. All protected endpoints will now automatically include the \`Authorization: Bearer <token>\` header for testing!

---

### ⚖️ Core Business Trading Rules:
- **BUY (Gold / Silver):** 5% platform mark-up added to the live scraped benchmark rate + 3% bullion GST.
- **SELL (Gold / Silver):** Liquidated at **100% actual benchmark rate** (no markup applied).
- **Physical Orders:** Order statuses strictly follow: **\`PENDING\`**, **\`PLACED\`**, **\`CONFIRMED\`**, **\`DELIVERED\`** (and terminal **\`CANCELLED\`**).
    `,
    contact: {
      name: "Tia'z Engineering Desk",
      email: "support@tiaz.com",
    },
  },
  servers: [
    {
      url: "/api/v1",
      description:
        "Current Host API Server (Auto-adapts to localhost, devtunnels, or production)",
    },
    {
      url: "http://localhost:8000/api/v1",
      description: "Local Development Server",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "Enter your JWT token received from /auth/verify-otp or /auth/admin/login",
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
  tags: [
    {
      name: "1. Authentication",
      description:
        "Mobile OTP Login, Verification, User Registration & Admin Auth",
    },
    {
      name: "2. Home Screen & Live Rates",
      description:
        "Real-time scraped Gold & Silver market rates and home dashboard",
    },
    {
      name: "3. Gold Bullion Trading",
      description:
        "Gold buy calculation (5% margin + 3% GST), physical/virtual buying, sell calculation and order execution",
    },
    {
      name: "4. Silver Bullion Trading",
      description:
        "Silver buy calculation (5% margin + 3% GST), physical/virtual buying, sell calculation and order execution",
    },
    {
      name: "5. Physical Products Catalog",
      description:
        "Browse coins & bars, filter by metal/stock, image upload and admin catalog CRUD",
    },
    {
      name: "6. Orders & Doorstep Delivery",
      description:
        "User order tracking timeline and admin order status updates (Pending, Placed, Confirmed, Delivered)",
    },
    {
      name: "7. User Profile & Nominee",
      description:
        "Customer account details, profile picture upload, nominee settings and password updates",
    },
    {
      name: "8. KYC Verification",
      description:
        "Aadhaar / PAN verification status, document re-upload and admin review",
    },
    {
      name: "9. Wallet & Balance",
      description:
        "Fiat cash balance, available gold & silver holdings, add money via gateway",
    },
    {
      name: "10. Financial Transactions Ledger",
      description:
        "Immutable transaction logs across purchases, liquidations, bank transfers, and exports",
    },
    {
      name: "11. Bank Accounts",
      description:
        "Manage bank accounts for instant sell payouts and verification",
    },
    {
      name: "12. Refer & Earn",
      description: "Referral links, invite statistics, and commission rewards",
    },
    {
      name: "13. In-App Notifications",
      description:
        "Customer alerts, order status updates, and mark read actions",
    },
    {
      name: "14. Devices & Security",
      description: "Login history, active device tokens, and 2FA configuration",
    },
    {
      name: "15. Support & FAQs",
      description: "Public FAQs and customer support ticket helpdesk",
    },
    {
      name: "16. CMS Content & Policies",
      description:
        "Terms and conditions, privacy policy, and public disclosures",
    },
    {
      name: "17. Admin Console Operations",
      description:
        "Super Admin dashboard stats, customer blocking, KYC approvals, and order verification calls",
    },
    {
      name: "18. Unified Trading (Buy & Sell Quotes)",
      description:
        "Unified APIs for both Gold and Silver: Get live buy/sell rates and dynamic calculated quotes in a single endpoint",
    },
    {
      name: "19. Payment Gateway (Razorpay)",
      description:
        "Razorpay order generation, checkout credentials, and cryptographic HMAC-SHA256 signature verification",
    },
  ],
  paths: {
    // =========================================================================
    // 1. AUTHENTICATION
    // =========================================================================
    "/auth/send-otp": {
      post: {
        tags: ["1. Authentication"],
        summary: "Send 6-digit OTP for Login",
        description:
          "Sends an SMS verification OTP to the user's mobile number.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["mobile"],
                properties: {
                  mobile: { type: "string", example: "9876543210" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "OTP sent successfully" },
          400: { description: "Invalid mobile number" },
        },
      },
    },
    "/auth/verify-otp": {
      post: {
        tags: ["1. Authentication"],
        summary: "Verify OTP & Generate JWT Auth Token",
        description:
          "Verifies the 6-digit OTP and returns user profile + JWT token for authorization.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["mobile", "otp"],
                properties: {
                  mobile: { type: "string", example: "9876543210" },
                  otp: { type: "string", example: "123456" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "OTP verified, returns JWT Bearer token" },
          400: { description: "Invalid or expired OTP" },
        },
      },
    },
    "/auth/register": {
      post: {
        tags: ["1. Authentication"],
        summary: "Register New User (Multipart Form with KYC)",
        description:
          "Creates a new customer account with optional PAN / Aadhaar KYC documents and selfie image.",
        security: [],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["fullName", "mobile"],
                properties: {
                  fullName: { type: "string", example: "Rahul Sharma" },
                  mobile: { type: "string", example: "9876543210" },
                  email: { type: "string", example: "rahul@example.com" },
                  password: { type: "string", example: "Password@123" },
                  panNumber: { type: "string", example: "ABCDE1234F" },
                  aadhaarNumber: { type: "string", example: "123456789012" },
                  referralCode: { type: "string", example: "REF12345" },
                  profileImage: {
                    type: "string",
                    format: "binary",
                    description: "Profile photo (optional)",
                  },
                  aadhaarFront: {
                    type: "string",
                    format: "binary",
                    description: "Aadhaar front image (optional)",
                  },
                  aadhaarBack: {
                    type: "string",
                    format: "binary",
                    description: "Aadhaar back image (optional)",
                  },
                  panCard: {
                    type: "string",
                    format: "binary",
                    description: "PAN card image (optional)",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Account created successfully" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["1. Authentication"],
        summary: "Password Login (Alternative to OTP)",
        description:
          "Authenticate using registered mobile/email and account password.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["identifier", "password"],
                properties: {
                  identifier: { type: "string", example: "9876543210" },
                  password: { type: "string", example: "Password@123" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Login successful" },
        },
      },
    },
    "/auth/admin/login": {
      post: {
        tags: ["1. Authentication"],
        summary: "Admin Console Login",
        description: "Admin portal authentication using master credentials.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "admin@tiaz.com" },
                  password: { type: "string", example: "Admin@123" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Admin logged in successfully" },
        },
      },
    },

    // =========================================================================
    // 2. HOME SCREEN & LIVE RATES
    // =========================================================================
    "/home": {
      get: {
        tags: ["2. Home Screen & Live Rates"],
        summary: "Get Complete Mobile Home Screen Payload",
        description:
          "Fetches live gold & silver rates (scraped), user portfolio value, 24h market trends, promotional banners, and quick investment cards.",
        parameters: [
          {
            name: "period",
            in: "query",
            schema: {
              type: "string",
              enum: ["1d", "1w", "1m", "1y", "all_time"],
              default: "1m",
            },
            description: "Historical price trend timeframe",
          },
        ],
        responses: {
          200: { description: "Returns consolidated home data" },
        },
      },
    },

    // =========================================================================
    // 3. GOLD BULLION TRADING
    // =========================================================================
    "/gold/rates": {
      get: {
        tags: ["3. Gold Bullion Trading"],
        summary: "Get Live Gold Rates by Purity",
        description:
          "Returns live market rates for 24K (99.9%), 22K (91.6%), and other purities.",
        security: [],
        responses: {
          200: { description: "Current benchmark gold rates" },
        },
      },
    },
    "/gold/create-order": {
      post: {
        tags: ["3. Gold Bullion Trading"],
        summary: "Generate Razorpay Order for Digital Gold Purchase",
        description:
          "Creates a Razorpay order ID to open the payment modal in mobile/web app before buying digital gold.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  amount: { type: "number", example: 500 },
                  grams: { type: "number", example: 0.0628 },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Razorpay order created with orderId, amount, keyId",
          },
        },
      },
    },
    "/gold/buy": {
      post: {
        tags: ["3. Gold Bullion Trading"],
        summary: "Execute Gold Purchase (Virtual / Physical)",
        description:
          "Buys gold. If buyType is PHYSICAL and paymentMethod is COD, order is placed without debiting wallet. If ONLINE, triggers payment settlement.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["buyType", "paymentMethod"],
                properties: {
                  buyType: {
                    type: "string",
                    enum: ["VIRTUAL", "PHYSICAL"],
                    default: "VIRTUAL",
                  },
                  paymentMethod: {
                    type: "string",
                    enum: ["ONLINE", "WALLET", "COD"],
                    default: "ONLINE",
                  },
                  amount: { type: "number", example: 5000 },
                  grams: { type: "number", example: 0.65 },
                  productId: {
                    type: "string",
                    example: "66123456789abcdef0123456",
                  },
                  deliveryAddress: {
                    type: "object",
                    properties: {
                      recipientName: {
                        type: "string",
                        example: "Rahul Sharma",
                      },
                      recipientPhone: { type: "string", example: "9876543210" },
                      addressLine: {
                        type: "string",
                        example: "Flat 402, Sunshine Heights, MG Road",
                      },
                      city: { type: "string", example: "Mumbai" },
                      state: { type: "string", example: "Maharashtra" },
                      pincode: { type: "string", example: "400001" },
                    },
                  },
                  paymentDetails: {
                    type: "object",
                    description:
                      "Required when paymentMethod is ONLINE. Contains Razorpay verification payload.",
                    properties: {
                      razorpay_order_id: {
                        type: "string",
                        example: "order_TkB5gP37dIZn8Q",
                      },
                      razorpay_payment_id: {
                        type: "string",
                        example: "pay_TkB61qX98zKabc",
                      },
                      razorpay_signature: {
                        type: "string",
                        example: "9f8a3c4b5d6e7f8a9b0c...",
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Order executed successfully" },
        },
      },
    },
    "/gold/sell": {
      post: {
        tags: ["3. Gold Bullion Trading"],
        summary: "Sell Gold from Vault to Bank/Wallet",
        description:
          "Liquidates gold from user's vault at actual market rate and credits bank account / cash wallet.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["grams", "bankAccountId"],
                properties: {
                  grams: { type: "number", example: 0.5 },
                  bankAccountId: {
                    type: "string",
                    example: "66123456789abcdef0123456",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Gold sold and payout initiated" },
        },
      },
    },
    "/gold/sell-screen": {
      get: {
        tags: ["3. Gold Bullion Trading"],
        summary: "Get Sell Screen Data (Holdings & Banks)",
        description:
          "Fetches user's available gold grams, current valuation, and linked bank accounts.",
        responses: {
          200: {
            description: "Returns vault holding and eligible payout banks",
          },
        },
      },
    },
    "/gold/orders": {
      get: {
        tags: ["3. Gold Bullion Trading"],
        summary: "Get Gold Orders History",
        description: "Lists all historical gold buy and sell transactions.",
        responses: {
          200: { description: "List of gold orders" },
        },
      },
    },

    // =========================================================================
    // 4. SILVER BULLION TRADING
    // =========================================================================
    "/silver/rates": {
      get: {
        tags: ["4. Silver Bullion Trading"],
        summary: "Get Live Silver Rates (999 Fine)",
        description:
          "Returns live market rates for pure 999 Fine Silver per gram.",
        security: [],
        responses: {
          200: { description: "Current benchmark silver rate" },
        },
      },
    },
    "/silver/create-order": {
      post: {
        tags: ["4. Silver Bullion Trading"],
        summary: "Generate Razorpay Order for Digital Silver Purchase",
        description:
          "Creates a Razorpay order ID to open the payment modal in mobile/web app before buying digital silver.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  amount: { type: "number", example: 500 },
                  grams: { type: "number", example: 4.5 },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Razorpay order created with orderId, amount, keyId",
          },
        },
      },
    },
    "/silver/buy": {
      post: {
        tags: ["4. Silver Bullion Trading"],
        summary: "Execute Silver Purchase (Virtual / Physical)",
        description:
          "Buys silver bullion. Supports Cash on Delivery (COD) and Online Payment.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["buyType", "paymentMethod"],
                properties: {
                  buyType: {
                    type: "string",
                    enum: ["VIRTUAL", "PHYSICAL"],
                    default: "VIRTUAL",
                  },
                  paymentMethod: {
                    type: "string",
                    enum: ["ONLINE", "WALLET", "COD"],
                    default: "ONLINE",
                  },
                  amount: { type: "number", example: 2500 },
                  grams: { type: "number", example: 25 },
                  productId: {
                    type: "string",
                    example: "66123456789abcdef0123456",
                  },
                  deliveryAddress: {
                    type: "object",
                    properties: {
                      recipientName: {
                        type: "string",
                        example: "Rahul Sharma",
                      },
                      recipientPhone: { type: "string", example: "9876543210" },
                      addressLine: {
                        type: "string",
                        example: "Flat 402, Sunshine Heights",
                      },
                      city: { type: "string", example: "Delhi" },
                      state: { type: "string", example: "Delhi" },
                      pincode: { type: "string", example: "110001" },
                    },
                  },
                  paymentDetails: {
                    type: "object",
                    description:
                      "Required when paymentMethod is ONLINE. Contains Razorpay verification payload.",
                    properties: {
                      razorpay_order_id: {
                        type: "string",
                        example: "order_TkB5gP37dIZn8Q",
                      },
                      razorpay_payment_id: {
                        type: "string",
                        example: "pay_TkB61qX98zKabc",
                      },
                      razorpay_signature: {
                        type: "string",
                        example: "9f8a3c4b5d6e7f8a9b0c...",
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Order executed successfully" },
        },
      },
    },
    "/silver/sell": {
      post: {
        tags: ["4. Silver Bullion Trading"],
        summary: "Sell Silver from Vault to Bank/Wallet",
        description: "Liquidates silver at actual market rate.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["grams", "bankAccountId"],
                properties: {
                  grams: { type: "number", example: 10 },
                  bankAccountId: {
                    type: "string",
                    example: "66123456789abcdef0123456",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Silver sold successfully" },
        },
      },
    },
    "/silver/sell-screen": {
      get: {
        tags: ["4. Silver Bullion Trading"],
        summary: "Get Silver Sell Screen Data",
        description:
          "Returns user's available silver weight and linked bank accounts.",
        responses: {
          200: { description: "Silver holdings data" },
        },
      },
    },
    "/silver/orders": {
      get: {
        tags: ["4. Silver Bullion Trading"],
        summary: "Get Silver Orders History",
        description: "Lists all silver transactions for the user.",
        responses: {
          200: { description: "List of silver orders" },
        },
      },
    },

    // =========================================================================
    // 5. PHYSICAL PRODUCTS CATALOG
    // =========================================================================
    "/products": {
      get: {
        tags: ["5. Physical Products Catalog"],
        summary: "Browse Physical Bullion Products",
        description:
          "Lists minted bullion coins & bars with search, metalType filter (GOLD/SILVER), inStock filter, and pagination.",
        security: [],
        parameters: [
          {
            name: "metalType",
            in: "query",
            schema: {
              type: "string",
              enum: ["ALL", "GOLD", "SILVER"],
              default: "ALL",
            },
          },
          {
            name: "inStock",
            in: "query",
            schema: { type: "string", enum: ["true", "false"] },
          },
          { name: "search", in: "query", schema: { type: "string" } },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10 },
          },
        ],
        responses: {
          200: { description: "Paginated list of products" },
        },
      },
      post: {
        tags: ["5. Physical Products Catalog"],
        summary: "Add New Product (Admin)",
        description: "Creates a new bullion product with multiple images.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "metalType", "weightGrams", "price"],
                properties: {
                  name: { type: "string", example: "10g 24K Gold Minted Coin" },
                  metalType: {
                    type: "string",
                    enum: ["GOLD", "SILVER"],
                    default: "GOLD",
                  },
                  weightGrams: { type: "number", example: 10 },
                  price: { type: "number", example: 75500 },
                  inStock: { type: "boolean", default: true },
                  images: {
                    type: "array",
                    items: { type: "string" },
                    example: [
                      "/uploads/products/prod-1.webp",
                      "/uploads/products/prod-2.webp",
                    ],
                  },
                  description: {
                    type: "string",
                    example:
                      "99.9% pure 24K gold coin in tamper-evident assay packaging.",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Product created successfully" },
        },
      },
    },
    "/products/{id}": {
      get: {
        tags: ["5. Physical Products Catalog"],
        summary: "Get Single Product Details",
        description:
          "Retrieves complete product specification and photo gallery.",
        security: [],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Product details" },
          404: { description: "Product not found" },
        },
      },
      put: {
        tags: ["5. Physical Products Catalog"],
        summary: "Update Product (Admin)",
        description:
          "Updates price, stock availability, photos, or description.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  price: { type: "number" },
                  inStock: { type: "boolean" },
                  images: { type: "array", items: { type: "string" } },
                  description: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Product updated successfully" },
        },
      },
      delete: {
        tags: ["5. Physical Products Catalog"],
        summary: "Delete Product (Admin)",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Product deleted successfully" },
        },
      },
    },
    "/products/upload-images": {
      post: {
        tags: ["5. Physical Products Catalog"],
        summary: "Upload Product Images (Admin)",
        description:
          "Uploads up to 4 compressed product images directly to `uploads/products/` folder.",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  images: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Images uploaded, returns array of public image paths",
          },
        },
      },
    },

    // =========================================================================
    // 6. ORDERS & DOORSTEP DELIVERY
    // =========================================================================
    "/orders/create-payment": {
      post: {
        tags: ["6. Orders & Doorstep Delivery"],
        summary: "Generate Razorpay Order for Physical Product Online Payment",
        description:
          "Creates a Razorpay order ID to open the payment modal in mobile/web app before purchasing a physical coin or bar.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["productId"],
                properties: {
                  productId: {
                    type: "string",
                    description: "Product ObjectId",
                    example: "67f29c8e4f1a2b001c9a8b12",
                  },
                  quantity: {
                    type: "integer",
                    default: 1,
                    minimum: 1,
                    example: 1,
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description:
              "Razorpay order created with orderId, amount in paise, currency, keyId",
          },
          400: { description: "Invalid product or out of stock" },
        },
      },
    },
    "/orders/buy": {
      post: {
        tags: ["6. Orders & Doorstep Delivery"],
        summary:
          "Buy Physical Product (Direct Purchase via COD, Wallet, or Online)",
        description:
          "Places an order for a physical bullion product (Gold/Silver coin/bar). Directly supports three payment modes:\n- **`COD`**: Cash on Delivery (Order status `PLACED`, Payment `PENDING_ON_DELIVERY`)\n- **`WALLET`**: Tia'z Wallet (Instant balance deduction, Order `CONFIRMED`, Payment `COMPLETED`)\n- **`ONLINE`**: UPI / NetBanking / Cards (Order `CONFIRMED`, Payment `COMPLETED`)\n\nRequires recipient delivery address (Full name, 10-digit mobile, street address, city, state, 6-digit PIN).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["productId", "deliveryAddress", "paymentMode"],
                properties: {
                  productId: {
                    type: "string",
                    description: "MongoDB ObjectId of the physical product",
                    example: "67f29c8e4f1a2b001c9a8b12",
                  },
                  quantity: {
                    type: "integer",
                    description: "Quantity of coins or bars to purchase",
                    default: 1,
                    minimum: 1,
                    example: 1,
                  },
                  deliveryAddress: {
                    type: "object",
                    required: [
                      "recipientName",
                      "mobileNumber",
                      "address",
                      "city",
                      "state",
                      "pincode",
                    ],
                    properties: {
                      recipientName: {
                        type: "string",
                        description: "Recipient full name",
                        example: "Monit Kumar",
                      },
                      mobileNumber: {
                        type: "string",
                        description:
                          "10-digit mobile number for delivery confirmation",
                        example: "9341171746",
                      },
                      address: {
                        type: "string",
                        description: "House / Flat / Street address",
                        example: "Flat 402, Royal Palms, MG Road",
                      },
                      city: {
                        type: "string",
                        description: "Delivery city",
                        example: "Mumbai",
                      },
                      state: {
                        type: "string",
                        description: "Delivery state",
                        example: "Maharashtra",
                      },
                      pincode: {
                        type: "string",
                        description: "6-digit delivery PIN code",
                        example: "400065",
                      },
                    },
                  },
                  paymentMode: {
                    type: "string",
                    enum: ["COD", "WALLET", "ONLINE"],
                    default: "COD",
                    description:
                      "Payment method: COD for Cash on Delivery, WALLET for Tia'z Wallet, or ONLINE for UPI/NetBanking",
                    example: "COD",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Physical product order placed successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: {
                      type: "string",
                      example:
                        "Physical product order placed successfully via Cash on Delivery!",
                    },
                    data: {
                      type: "object",
                      properties: {
                        orderId: {
                          type: "string",
                          example: "67a3f81e9b2c3d0012e34567",
                        },
                        orderNumber: {
                          type: "string",
                          example: "SO-PHY-174829381029ABC",
                        },
                        status: { type: "string", example: "PLACED" },
                        statusLabel: { type: "string", example: "Placed" },
                        product: {
                          type: "object",
                          properties: {
                            id: {
                              type: "string",
                              example: "65f29c8e4f1a2b001c9a8b12",
                            },
                            name: {
                              type: "string",
                              example: "20g 999 Fine Silver Coin",
                            },
                            subtitle: {
                              type: "string",
                              example: "999 Silver 20 gm",
                            },
                            metalType: { type: "string", example: "SILVER" },
                            weightGrams: { type: "number", example: 20 },
                            quantity: { type: "integer", example: 1 },
                            totalWeightGrams: { type: "number", example: 20 },
                            purity: {
                              type: "string",
                              example: "999 Fine (99.9%)",
                            },
                            imageUrl: {
                              type: "string",
                              example:
                                "https://images.unsplash.com/photo-1589758438368-0ad531db3366?auto=format&fit=crop&w=600&q=80",
                            },
                          },
                        },
                        pricing: {
                          type: "object",
                          properties: {
                            productPrice: { type: "number", example: 2250 },
                            quantity: { type: "integer", example: 1 },
                            itemTotal: { type: "number", example: 2250 },
                            deliveryFee: { type: "number", example: 0 },
                            deliveryFeeText: {
                              type: "string",
                              example: "FREE",
                            },
                            transitCover: {
                              type: "string",
                              example: "100% Insured",
                            },
                            totalPayable: { type: "number", example: 2250 },
                            formattedTotalPayable: {
                              type: "string",
                              example: "₹2,250.00",
                            },
                          },
                        },
                        deliveryAddress: {
                          type: "object",
                          properties: {
                            recipientName: {
                              type: "string",
                              example: "Monit Kumar",
                            },
                            mobileNumber: {
                              type: "string",
                              example: "9341171746",
                            },
                            addressLine: {
                              type: "string",
                              example: "Flat 402, Royal Palms, MG Road",
                            },
                            city: { type: "string", example: "Mumbai" },
                            state: { type: "string", example: "Maharashtra" },
                            pincode: { type: "string", example: "400065" },
                          },
                        },
                        payment: {
                          type: "object",
                          properties: {
                            mode: { type: "string", example: "COD" },
                            method: { type: "string", example: "COD" },
                            status: {
                              type: "string",
                              example: "PENDING_ON_DELIVERY",
                            },
                            statusLabel: {
                              type: "string",
                              example: "Cash on Delivery (Pending on Delivery)",
                            },
                            walletDeducted: { type: "boolean", example: false },
                          },
                        },
                        placedAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description:
              "Validation error or insufficient wallet balance / out of stock",
          },
          401: {
            description: "Unauthorized - missing or invalid Bearer token",
          },
          404: {
            description: "Product not found",
          },
        },
      },
    },
    "/orders/my-orders": {
      get: {
        tags: ["6. Orders & Doorstep Delivery"],
        summary: "Get Authenticated User Orders",
        description:
          "Returns all physical purchase requests and orders placed by the logged-in customer.",
        parameters: [
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: [
                "ALL",
                "PENDING",
                "PLACED",
                "CONFIRMED",
                "DELIVERED",
                "CANCELLED",
              ],
              default: "ALL",
            },
          },
          {
            name: "metalType",
            in: "query",
            schema: {
              type: "string",
              enum: ["ALL", "GOLD", "SILVER"],
              default: "ALL",
            },
          },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10 },
          },
        ],
        responses: {
          200: { description: "List of customer orders with status badges" },
        },
      },
    },
    "/orders/{orderId}": {
      get: {
        tags: ["6. Orders & Doorstep Delivery"],
        summary: "Get Single Order Details with Tracking Timeline",
        description:
          "Returns full order information, shipping address, product specs, breakdown, and 4-step delivery progress timeline.",
        parameters: [
          {
            name: "orderId",
            in: "path",
            required: true,
            schema: { type: "string" },
            example: "66123456789abcdef0123456",
          },
        ],
        responses: {
          200: { description: "Full order details and tracking" },
          404: { description: "Order not found" },
        },
      },
    },
    "/orders/{id}/status": {
      put: {
        tags: ["6. Orders & Doorstep Delivery"],
        summary: "Update Order Status (Admin)",
        description:
          "Updates physical order lifecycle to **\`PENDING\`**, **\`PLACED\`**, **\`CONFIRMED\`**, **\`DELIVERED\`**, or **\`CANCELLED\`** and automatically alerts customer.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: [
                      "PENDING",
                      "PLACED",
                      "CONFIRMED",
                      "DELIVERED",
                      "CANCELLED",
                    ],
                    example: "CONFIRMED",
                  },
                  adminNotes: {
                    type: "string",
                    example:
                      "Customer confirmed interest and shipping address over call.",
                  },
                  courierPartner: {
                    type: "string",
                    example: "Sequel Logistics",
                  },
                  trackingNumber: { type: "string", example: "TRK-9842104" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Order status updated and customer notified" },
        },
      },
    },

    // =========================================================================
    // 7. USER PROFILE & NOMINEE
    // =========================================================================
    "/user/profile": {
      get: {
        tags: ["7. User Profile & Nominee"],
        summary: "Get Logged-in User Profile",
        description:
          "Returns profile details, verification status, contact info, and linked KYC status.",
        responses: {
          200: { description: "Profile data" },
        },
      },
      put: {
        tags: ["7. User Profile & Nominee"],
        summary: "Update Profile Details & Avatar",
        description:
          "Supports multipart form data to update full name, email, address, and profile image.",
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  fullName: { type: "string", example: "Rahul Sharma" },
                  email: { type: "string", example: "rahul@example.com" },
                  profileImage: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Profile updated successfully" },
        },
      },
    },
    "/user/change-password": {
      post: {
        tags: ["7. User Profile & Nominee"],
        summary: "Change Account Password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["currentPassword", "newPassword"],
                properties: {
                  currentPassword: { type: "string", example: "Password@123" },
                  newPassword: { type: "string", example: "NewPassword@123" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Password changed successfully" },
        },
      },
    },

    // =========================================================================
    // 8. KYC VERIFICATION
    // =========================================================================
    "/kyc/status": {
      get: {
        tags: ["8. KYC Verification"],
        summary: "Get KYC Verification Status",
        description:
          "Returns whether KYC is PENDING, VERIFIED, or REJECTED with rejection reasons.",
        responses: {
          200: { description: "Current KYC status and documents" },
        },
      },
    },
    "/kyc/upload": {
      post: {
        tags: ["8. KYC Verification"],
        summary: "Upload / Re-Upload KYC Documents",
        description:
          "Allows customer to upload or re-submit identity proof (Aadhaar & PAN). Sets KYC status to under_review until reviewed by admin.",
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  aadhaarFront: {
                    type: "string",
                    format: "binary",
                    description: "Aadhaar Card Front Image",
                  },
                  aadhaarBack: {
                    type: "string",
                    format: "binary",
                    description: "Aadhaar Card Back Image",
                  },
                  panCard: {
                    type: "string",
                    format: "binary",
                    description: "PAN Card Image",
                  },
                  panNumber: { type: "string", example: "ABCDE1234F" },
                  dob: {
                    type: "string",
                    format: "date",
                    example: "1995-05-15",
                  },
                  gender: {
                    type: "string",
                    enum: ["male", "female", "other"],
                    example: "male",
                  },
                  address: {
                    type: "string",
                    example: "Flat 402, Royal Residency, Mumbai",
                  },
                  fullName: { type: "string", example: "Rahul Sharma" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description:
              "Documents uploaded and status set to under_review for admin verification",
          },
          400: { description: "Upload error or invalid data" },
        },
      },
    },
    "/kyc/review/{userId}": {
      put: {
        tags: ["8. KYC Verification"],
        summary: "Review Customer KYC (Admin)",
        description:
          "Admin approves or rejects KYC documents. Only when admin verifies does the user model become verified.",
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: ["verified", "rejected", "under_review"],
                    example: "verified",
                  },
                  rejectionReason: {
                    type: "string",
                    example: "Document details mismatch",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "KYC decision saved and user notified" },
          400: { description: "Invalid status or missing user" },
        },
      },
    },

    // =========================================================================
    // 9. WALLET & BALANCE
    // =========================================================================
    "/wallet": {
      get: {
        tags: ["9. Wallet & Balance"],
        summary: "Get Wallet Balances (Fiat & Bullion)",
        description:
          "Returns available INR cash balance, 24K Gold grams, and 999 Silver grams.",
        responses: {
          200: { description: "Wallet balances" },
        },
      },
    },
    "/wallet/create-order": {
      post: {
        tags: ["9. Wallet & Balance"],
        summary: "Create Razorpay Order for Adding Cash",
        description:
          "Generates a Razorpay order before opening the payment modal to add cash to Tia'z wallet.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["amount"],
                properties: {
                  amount: {
                    type: "number",
                    minimum: 1,
                    example: 5000,
                    description: "Amount in INR to add into wallet",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description:
              "Razorpay order created with orderId, amount in paise, currency, keyId",
          },
          400: { description: "Invalid amount" },
        },
      },
    },
    "/wallet/add-cash": {
      post: {
        tags: ["9. Wallet & Balance"],
        summary: "Verify Payment and Add Cash Balance to Wallet",
        description:
          "Verifies Razorpay payment signature and credits INR funds into user cash wallet with complete ledger logging.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "amount",
                  "razorpay_order_id",
                  "razorpay_payment_id",
                  "razorpay_signature",
                ],
                properties: {
                  amount: { type: "number", example: 5000 },
                  razorpay_order_id: {
                    type: "string",
                    example: "order_TkB5gP37dIZn8Q",
                    description:
                      "Razorpay order ID returned from /wallet/create-order",
                  },
                  razorpay_payment_id: {
                    type: "string",
                    example: "pay_TkB61qX98zKabc",
                    description: "Payment ID returned by Razorpay Checkout",
                  },
                  razorpay_signature: {
                    type: "string",
                    example: "9f8a3c4b5d6e7f8a9b0c...",
                    description:
                      "HMAC-SHA256 signature returned by Razorpay Checkout",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description:
              "Payment verified and cash credited to wallet successfully",
          },
          400: { description: "Invalid payment signature or bad request" },
        },
      },
    },
    "/wallet/withdraw": {
      post: {
        tags: ["9. Wallet & Balance"],
        summary: "Request Cash Withdrawal to Bank / UPI",
        description:
          "Withdraws INR from the user's Tia'z Wallet to a linked bank account or UPI ID. The amount is held (deducted from wallet) immediately and a PENDING withdrawal request is created for admin verification. Requires at least one added bank/UPI account (see \`POST /banks\`).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["amount"],
                properties: {
                  amount: {
                    type: "number",
                    minimum: 100,
                    example: 1000,
                    description: "INR amount to withdraw",
                  },
                  bankAccountId: {
                    type: "string",
                    example: "64f1a2b3c4d5e6f7a8b9c0d1",
                    description:
                      "Destination BankAccount _id (optional; falls back to primary account)",
                  },
                  upiId: {
                    type: "string",
                    example: "rahul@okhdfcbank",
                    description:
                      "Destination UPI ID (optional alternative to bankAccountId)",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description:
              "Withdrawal request submitted (status PENDING), wallet balance held",
          },
          400: {
            description:
              "Insufficient balance, invalid amount, or no payout account added",
          },
        },
      },
    },
    "/wallet/withdrawals": {
      get: {
        tags: ["9. Wallet & Balance"],
        summary: "Get My Withdrawal History",
        description:
          "Returns the logged-in user's withdrawal requests and their statuses (PENDING / APPROVED / REJECTED / PAID), along with a `stats` summary (total, pending, approved, rejected counts and amounts) for the user's dashboard.",
        parameters: [
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: ["ALL", "PENDING", "APPROVED", "REJECTED", "PAID"],
              default: "ALL",
            },
          },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 50 },
          },
        ],
        responses: {
          200: { description: "Paginated withdrawal history" },
        },
      },
    },

    // =========================================================================
    // 10. FINANCIAL TRANSACTIONS LEDGER
    // =========================================================================
    "/transactions": {
      get: {
        tags: ["10. Financial Transactions Ledger"],
        summary: "Get Transactions History",
        description:
          "Returns transaction ledger records with filters for type (VIRTUAL_BUY, PHYSICAL_BUY, SELL), metalType (GOLD/SILVER), search, and pagination.",
        parameters: [
          {
            name: "type",
            in: "query",
            schema: {
              type: "string",
              enum: ["ALL", "VIRTUAL_BUY", "PHYSICAL_BUY", "SELL"],
              default: "ALL",
            },
          },
          {
            name: "metalType",
            in: "query",
            schema: {
              type: "string",
              enum: ["ALL", "GOLD", "SILVER"],
              default: "ALL",
            },
          },
          { name: "search", in: "query", schema: { type: "string" } },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10 },
          },
        ],
        responses: {
          200: { description: "Paginated transactions list" },
        },
      },
    },
    "/transactions/{transactionId}": {
      get: {
        tags: ["10. Financial Transactions Ledger"],
        summary: "Get Single Transaction Ledger Details",
        parameters: [
          {
            name: "transactionId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Complete transaction detail record" },
        },
      },
    },

    // =========================================================================
    // 11. BANK ACCOUNTS
    // =========================================================================
    "/banks": {
      get: {
        tags: ["11. Bank Accounts"],
        summary: "Get User's Linked Bank Accounts",
        responses: {
          200: { description: "List of bank accounts" },
        },
      },
      post: {
        tags: ["11. Bank Accounts"],
        summary: "Add Bank Account for Sell Payouts (with optional UPI)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "accountNumber",
                  "ifscCode",
                  "accountHolderName",
                  "bankName",
                ],
                properties: {
                  accountNumber: { type: "string", example: "918273645123" },
                  ifscCode: { type: "string", example: "HDFC0001234" },
                  accountHolderName: {
                    type: "string",
                    example: "Rahul Sharma",
                  },
                  bankName: { type: "string", example: "HDFC Bank" },
                  accountType: {
                    type: "string",
                    enum: ["SAVINGS", "CURRENT"],
                    default: "SAVINGS",
                  },
                  upiId: { type: "string", example: "rahul@okhdfcbank" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Bank account linked successfully" },
        },
      },
    },
    "/banks/upi": {
      post: {
        tags: ["11. Bank Accounts"],
        summary: "Add & Link UPI ID Directly for Instant Payouts",
        description:
          "Links a Virtual Payment Address (e.g. Google Pay, PhonePe, Paytm UPI ID) for sell liquidation payouts without requiring full bank account numbers.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["upiId"],
                properties: {
                  upiId: { type: "string", example: "rahul@okhdfcbank" },
                  name: { type: "string", example: "Rahul Sharma" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "UPI ID linked successfully" },
        },
      },
    },
    "/banks/{accountId}/primary": {
      put: {
        tags: ["11. Bank Accounts"],
        summary: "Set Bank Account as Primary Payout Destination",
        parameters: [
          {
            name: "accountId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Primary account updated" },
        },
      },
    },
    "/banks/{accountId}": {
      delete: {
        tags: ["11. Bank Accounts"],
        summary: "Remove Linked Bank Account",
        parameters: [
          {
            name: "accountId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Bank account removed" },
        },
      },
    },

    // =========================================================================
    // 12. REFER & EARN
    // =========================================================================
    "/referrals": {
      get: {
        tags: ["12. Refer & Earn"],
        summary: "Get Complete Refer & Earn Screen Data",
        description:
          "Returns customer referral code, shareable link, referral reward rules, and history of referred friends.",
        responses: {
          200: { description: "Referral data" },
        },
      },
    },
    "/referrals/summary": {
      get: {
        tags: ["12. Refer & Earn"],
        summary: "Get Quick Referral Summary",
        responses: {
          200: { description: "Total invited and total earned summary" },
        },
      },
    },
    "/referrals/my-referrals": {
      get: {
        tags: ["12. Refer & Earn"],
        summary: "Get List of Users Referred By Me",
        description:
          "Returns the logged-in user's referral code and the full list of friends who signed up using it, with join date, reward status, and reward credited.",
        responses: {
          200: { description: "Referral code, counts, and referred-user list" },
        },
      },
    },

    // =========================================================================
    // 13. IN-APP NOTIFICATIONS
    // =========================================================================
    "/notifications": {
      get: {
        tags: ["13. In-App Notifications"],
        summary: "Get User Notifications",
        description:
          "Returns unread and read alerts regarding orders, price movements, and KYC.",
        responses: {
          200: { description: "List of notifications" },
        },
      },
    },
    "/notifications/{id}/read": {
      put: {
        tags: ["13. In-App Notifications"],
        summary: "Mark Single Notification as Read",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Marked as read" },
        },
      },
    },
    "/notifications/read-all": {
      put: {
        tags: ["13. In-App Notifications"],
        summary: "Mark All Notifications as Read",
        responses: {
          200: { description: "All notifications marked as read" },
        },
      },
    },

    // =========================================================================
    // 14. DEVICES & SECURITY
    // =========================================================================
    "/security/login-history": {
      get: {
        tags: ["14. Devices & Security"],
        summary: "Get Login History",
        description:
          "Returns list of recent sign-ins with IP addresses, location and device browser details.",
        responses: {
          200: { description: "Login history records" },
        },
      },
    },
    "/security/devices": {
      get: {
        tags: ["14. Devices & Security"],
        summary: "Get Active Logged-in Devices",
        responses: {
          200: { description: "Active devices" },
        },
      },
    },
    "/security/device": {
      post: {
        tags: ["14. Devices & Security"],
        summary: "Register / Update Push Device Token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["fcmToken", "deviceName"],
                properties: {
                  fcmToken: {
                    type: "string",
                    example: "fcm_token_sample_abc123",
                  },
                  deviceName: { type: "string", example: "iPhone 15 Pro" },
                  deviceType: {
                    type: "string",
                    enum: ["ANDROID", "IOS", "WEB"],
                    default: "ANDROID",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Device registered" },
        },
      },
    },

    // =========================================================================
    // 15. SUPPORT & FAQS
    // =========================================================================
    "/support/faqs": {
      get: {
        tags: ["15. Support & FAQs"],
        summary: "Get Categorized FAQs",
        description:
          "Returns frequently asked questions on buying, selling, delivery, purity, and taxation.",
        security: [],
        responses: {
          200: { description: "List of FAQs" },
        },
      },
    },
    "/support/tickets": {
      get: {
        tags: ["15. Support & FAQs"],
        summary: "Get User's Support Tickets",
        responses: {
          200: { description: "List of support tickets" },
        },
      },
      post: {
        tags: ["15. Support & FAQs"],
        summary: "Create New Support Ticket",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["subject", "category", "message"],
                properties: {
                  subject: {
                    type: "string",
                    example: "Inquiry about delivery address update",
                  },
                  category: {
                    type: "string",
                    enum: ["ORDER", "PAYMENT", "KYC", "GENERAL"],
                    default: "ORDER",
                  },
                  message: {
                    type: "string",
                    example:
                      "Hello, I placed order #GO-PHY-123. Can I change recipient phone?",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Ticket created" },
        },
      },
    },
    "/support/tickets/{ticketId}": {
      get: {
        tags: ["15. Support & FAQs"],
        summary: "Get Ticket Details & Chat Messages",
        parameters: [
          {
            name: "ticketId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Ticket conversation thread" },
        },
      },
    },
    "/support/tickets/{ticketId}/reply": {
      post: {
        tags: ["15. Support & FAQs"],
        summary: "Send Message / Reply on Ticket",
        parameters: [
          {
            name: "ticketId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["message"],
                properties: {
                  message: {
                    type: "string",
                    example: "Thanks, the issue is resolved.",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Reply added to ticket" },
        },
      },
    },

    // =========================================================================
    // 16. CMS CONTENT & POLICIES
    // =========================================================================
    "/content": {
      get: {
        tags: ["16. CMS Content & Policies"],
        summary: "Get Legal CMS Content (Terms / Privacy)",
        security: [],
        parameters: [
          {
            name: "type",
            in: "query",
            schema: {
              type: "string",
              enum: ["terms", "privacy", "about"],
              default: "terms",
            },
          },
        ],
        responses: {
          200: { description: "Content body and last updated date" },
        },
      },
      post: {
        tags: ["16. CMS Content & Policies"],
        summary: "Save / Update CMS Content (Admin)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["type", "content"],
                properties: {
                  type: {
                    type: "string",
                    enum: ["terms", "privacy", "about"],
                    example: "terms",
                  },
                  title: { type: "string", example: "Terms and Conditions" },
                  content: {
                    type: "string",
                    example: "<p>Updated terms content...</p>",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Content saved" },
        },
      },
    },

    // =========================================================================
    // 17. ADMIN OPERATIONS
    // =========================================================================
    "/admin/dashboard": {
      get: {
        tags: ["17. Admin Console Operations"],
        summary: "Get Admin Dashboard Metrics & Financials",
        description:
          "Returns total customers, physical orders volume, total gold in vault, total silver in vault, revenue, and daily settlement graphs.",
        parameters: [
          {
            name: "assetType",
            in: "query",
            schema: {
              type: "string",
              enum: ["gold", "silver"],
              default: "gold",
            },
          },
          {
            name: "period",
            in: "query",
            schema: {
              type: "string",
              enum: ["1W", "1M", "1Y", "ALL"],
              default: "1M",
            },
          },
        ],
        responses: {
          200: { description: "Complete dashboard KPI statistics" },
        },
      },
    },
    "/admin/users": {
      get: {
        tags: ["17. Admin Console Operations"],
        summary: "List Customers with KYC & Status",
        parameters: [
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: ["ALL", "ACTIVE", "BLOCKED"],
              default: "ALL",
            },
          },
          {
            name: "kycStatus",
            in: "query",
            schema: {
              type: "string",
              enum: ["ALL", "VERIFIED", "PENDING", "REJECTED"],
              default: "ALL",
            },
          },
          { name: "search", in: "query", schema: { type: "string" } },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10 },
          },
        ],
        responses: {
          200: { description: "List of users" },
        },
      },
    },
    "/admin/users/{userId}/block": {
      put: {
        tags: ["17. Admin Console Operations"],
        summary: "Block / Unblock Customer Account",
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "User block status toggled" },
        },
      },
    },
    "/admin/users/{userId}/kyc": {
      put: {
        tags: ["17. Admin Console Operations"],
        summary: "Approve or Reject Customer KYC",
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: ["VERIFIED", "REJECTED"],
                    example: "VERIFIED",
                  },
                  rejectionReason: {
                    type: "string",
                    example: "PAN image blurry",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "KYC decision recorded" },
        },
      },
    },
    "/admin/purchase-requests": {
      get: {
        tags: ["17. Admin Console Operations"],
        summary: "Get Physical Purchase Requests & Orders",
        description:
          "Returns list of physical delivery requests requiring phone verification calls, dispatch, or status updates.",
        parameters: [
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: [
                "ALL",
                "PENDING",
                "PLACED",
                "CONFIRMED",
                "DELIVERED",
                "CANCELLED",
              ],
              default: "ALL",
            },
          },
          {
            name: "metalType",
            in: "query",
            schema: {
              type: "string",
              enum: ["ALL", "GOLD", "SILVER"],
              default: "ALL",
            },
          },
          {
            name: "paymentMethod",
            in: "query",
            schema: {
              type: "string",
              enum: ["ALL", "COD", "ONLINE"],
              default: "ALL",
            },
          },
          { name: "search", in: "query", schema: { type: "string" } },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10 },
          },
        ],
        responses: {
          200: { description: "List of physical orders" },
        },
      },
    },
    "/admin/purchase-requests/{id}/status": {
      put: {
        tags: ["17. Admin Console Operations"],
        summary: "Update Physical Purchase Order Status",
        description:
          "Direct status update endpoint: **\`PENDING\`**, **\`PLACED\`**, **\`CONFIRMED\`**, **\`DELIVERED\`**, or **\`CANCELLED\`**.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: [
                      "PENDING",
                      "PLACED",
                      "CONFIRMED",
                      "DELIVERED",
                      "CANCELLED",
                    ],
                    example: "CONFIRMED",
                  },
                  adminNotes: {
                    type: "string",
                    example: "Customer phone call verification completed.",
                  },
                  courierPartner: {
                    type: "string",
                    example: "Sequel Logistics",
                  },
                  trackingNumber: { type: "string", example: "TRK-9842104" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Order status updated" },
        },
      },
    },
    "/admin/gold": {
      get: {
        tags: ["17. Admin Console Operations"],
        summary: "Get Gold Vault Inventory & Live Reserves",
        responses: {
          200: { description: "Gold inventory statistics" },
        },
      },
    },
    "/admin/silver": {
      get: {
        tags: ["17. Admin Console Operations"],
        summary: "Get Silver Vault Inventory & Live Reserves",
        responses: {
          200: { description: "Silver inventory statistics" },
        },
      },
    },
    "/admin/rate-settings": {
      get: {
        tags: ["17. Admin Console Operations"],
        summary: "Get Dynamic Buy & Sell Markup % Rates (Gold & Silver)",
        description:
          "Returns the active platform buy markups (default 5%) and sell discounts (default 0%) configured by Admin.",
        responses: {
          200: { description: "Current rate margin settings" },
        },
      },
      put: {
        tags: ["17. Admin Console Operations"],
        summary: "Update Dynamic Buy & Sell % Rates (Gold & Silver)",
        description:
          "Admin updates the percentage markups/discounts for digital gold & silver trading dynamically in real time.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  goldBuyMarkupPercent: {
                    type: "number",
                    example: 5.0,
                    description:
                      "Percentage markup added to live gold buy price",
                  },
                  goldSellDiscountPercent: {
                    type: "number",
                    example: 0.0,
                    description:
                      "Percentage discount/fee deducted from live gold sell price",
                  },
                  silverBuyMarkupPercent: {
                    type: "number",
                    example: 5.0,
                    description:
                      "Percentage markup added to live silver buy price",
                  },
                  silverSellDiscountPercent: {
                    type: "number",
                    example: 0.0,
                    description:
                      "Percentage discount/fee deducted from live silver sell price",
                  },
                  gstPercent: {
                    type: "number",
                    example: 3.0,
                    description: "Bullion GST %",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Rate settings updated successfully" },
          400: { description: "Invalid setting values" },
        },
      },
    },
    "/admin/withdrawals": {
      get: {
        tags: ["17. Admin Console Operations"],
        summary: "Get All Cash Withdrawal Requests",
        description:
          "Returns every customer cash withdrawal request with filters for status and search (by withdrawal number, customer name/mobile/email), pagination, and aggregate stats (pending/approved/rejected counts & amounts).",
        parameters: [
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: ["ALL", "PENDING", "APPROVED", "REJECTED", "PAID"],
              default: "ALL",
            },
          },
          { name: "search", in: "query", schema: { type: "string" } },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10 },
          },
        ],
        responses: {
          200: { description: "Paginated withdrawal requests with stats" },
        },
      },
    },
    "/admin/withdrawals/{id}/approve": {
      put: {
        tags: ["17. Admin Console Operations"],
        summary: "Approve a Withdrawal Request",
        description:
          "Marks a PENDING withdrawal as APPROVED and settles the payout. The held wallet amount stays deducted and the ledger transaction is completed.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  adminNotes: {
                    type: "string",
                    example: "Paid via IMPS, UTR 1234567890",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Withdrawal approved" },
          400: { description: "Withdrawal not in PENDING state" },
        },
      },
    },
    "/admin/withdrawals/{id}/reject": {
      put: {
        tags: ["17. Admin Console Operations"],
        summary: "Reject a Withdrawal Request",
        description:
          "Rejects a PENDING withdrawal and automatically refunds the held amount back to the customer's Tia'z Wallet. The ledger transaction is reversed.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  reason: {
                    type: "string",
                    example: "Bank account details mismatch",
                  },
                  adminNotes: {
                    type: "string",
                    example: "Asked customer to re-add account",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Withdrawal rejected and amount refunded" },
          400: { description: "Withdrawal already approved or processed" },
        },
      },
    },
    "/admin/profile": {
      get: {
        tags: ["17. Admin Console Operations"],
        summary: "Get Admin Profile Details",
        responses: {
          200: { description: "Admin profile" },
        },
      },
      put: {
        tags: ["17. Admin Console Operations"],
        summary: "Update Admin Profile Details",
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  fullName: { type: "string", example: "Rajesh Varma" },
                  profileImage: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Admin profile updated" },
        },
      },
    },
    "/admin/change-password": {
      put: {
        tags: ["17. Admin Console Operations"],
        summary: "Change Admin Master Password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["currentPassword", "newPassword"],
                properties: {
                  currentPassword: { type: "string", example: "Admin@123" },
                  newPassword: { type: "string", example: "NewAdmin@123" },
                  confirmPassword: { type: "string", example: "NewAdmin@123" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Password changed successfully" },
        },
      },
    },

    // =========================================================================
    // 18. UNIFIED TRADING (BUY & SELL QUOTES)
    // =========================================================================
    "/trade/buy": {
      post: {
        tags: ["18. Unified Trading (Buy & Sell Quotes)"],
        summary: "Unified Buy Rate & Calculate Quote (Gold & Silver)",
        description:
          "Single master endpoint for buying either GOLD or SILVER. If amount/grams is passed, calculates total payable with GST & markup. If omitted, returns live rates and markup info.",
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  metalType: {
                    type: "string",
                    enum: ["GOLD", "SILVER"],
                    default: "GOLD",
                    description: "Target bullion metal",
                  },
                  amount: {
                    type: "number",
                    example: 1000,
                    description: "INR amount to buy (optional)",
                  },
                  grams: {
                    type: "number",
                    example: 0.5,
                    description: "Weight in grams to buy (optional)",
                  },
                  buyType: {
                    type: "string",
                    enum: ["VIRTUAL", "PHYSICAL"],
                    default: "VIRTUAL",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description:
              "Buy rate, dynamic markup, and calculated payable value",
          },
          400: { description: "Invalid metalType or calculation parameters" },
        },
      },
      get: {
        tags: ["18. Unified Trading (Buy & Sell Quotes)"],
        summary: "Unified Buy Rate & Calculate Quote via GET query",
        parameters: [
          {
            name: "metalType",
            in: "query",
            schema: {
              type: "string",
              enum: ["GOLD", "SILVER"],
              default: "GOLD",
            },
          },
          { name: "amount", in: "query", schema: { type: "number" } },
          { name: "grams", in: "query", schema: { type: "number" } },
          {
            name: "buyType",
            in: "query",
            schema: {
              type: "string",
              enum: ["VIRTUAL", "PHYSICAL"],
              default: "VIRTUAL",
            },
          },
        ],
        responses: {
          200: {
            description:
              "Buy rate, dynamic markup, and calculated payable value",
          },
        },
      },
    },
    "/trade/sell": {
      post: {
        tags: ["18. Unified Trading (Buy & Sell Quotes)"],
        summary: "Unified Sell Rate & Calculate Quote (Gold & Silver)",
        description:
          "Single master endpoint for selling either GOLD or SILVER. If amount/grams is passed, calculates exact liquidation payout. If omitted, returns live sell rate, discount %, and user's available holdings.",
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  metalType: {
                    type: "string",
                    enum: ["GOLD", "SILVER"],
                    default: "GOLD",
                    description: "Target bullion metal",
                  },
                  grams: {
                    type: "number",
                    example: 0.5,
                    description: "Weight in grams to sell (optional)",
                  },
                  amount: {
                    type: "number",
                    example: 2500,
                    description: "Desired INR payout amount (optional)",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description:
              "Sell rate, discount %, user holdings, and calculated net payout",
          },
          400: { description: "Invalid metalType or calculation parameters" },
        },
      },
      get: {
        tags: ["18. Unified Trading (Buy & Sell Quotes)"],
        summary: "Unified Sell Rate & Calculate Quote via GET query",
        parameters: [
          {
            name: "metalType",
            in: "query",
            schema: {
              type: "string",
              enum: ["GOLD", "SILVER"],
              default: "GOLD",
            },
          },
          { name: "grams", in: "query", schema: { type: "number" } },
          { name: "amount", in: "query", schema: { type: "number" } },
        ],
        responses: {
          200: {
            description:
              "Sell rate, discount %, user holdings, and calculated net payout",
          },
        },
      },
    },

    // =========================================================================
    // 19. PAYMENT GATEWAY (RAZORPAY)
    // =========================================================================
    "/payment/config": {
      get: {
        tags: ["19. Payment Gateway (Razorpay)"],
        summary: "Get Razorpay Gateway Configuration & Public Key",
        description:
          "Returns the Razorpay Key ID and currency so mobile or web app frontend can initialize the Razorpay checkout popup.",
        security: [],
        responses: {
          200: {
            description: "Razorpay Key ID and configuration",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        keyId: {
                          type: "string",
                          example: "rzp_test_Tb5IgNzWYoM8XZ",
                        },
                        currency: { type: "string", example: "INR" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/payment/create-order": {
      post: {
        tags: ["19. Payment Gateway (Razorpay)"],
        summary: "Create Razorpay Order for Any Payment",
        description:
          "Creates a server-side Razorpay order ID for any transaction (physical product, wallet top-up, or digital bullion buy).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["amount"],
                properties: {
                  amount: {
                    type: "number",
                    description: "Amount in INR",
                    example: 2250,
                  },
                  purpose: {
                    type: "string",
                    enum: [
                      "PHYSICAL_PRODUCT",
                      "WALLET_TOPUP",
                      "GOLD_BUY",
                      "SILVER_BUY",
                    ],
                    default: "PHYSICAL_PRODUCT",
                    example: "PHYSICAL_PRODUCT",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Razorpay Order ID and details returned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        orderId: {
                          type: "string",
                          example: "order_Qz2345abcdef",
                        },
                        amount: {
                          type: "integer",
                          description: "Amount in paise",
                          example: 225000,
                        },
                        amountInRupees: { type: "number", example: 2250 },
                        currency: { type: "string", example: "INR" },
                        keyId: {
                          type: "string",
                          example: "rzp_test_Tb5IgNzWYoM8XZ",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: "Invalid amount" },
        },
      },
    },
    "/payment/verify": {
      post: {
        tags: ["19. Payment Gateway (Razorpay)"],
        summary: "Verify Razorpay Payment Signature",
        description:
          "Cryptographically verifies the HMAC-SHA256 signature returned by Razorpay checkout SDK.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "razorpay_order_id",
                  "razorpay_payment_id",
                  "razorpay_signature",
                ],
                properties: {
                  razorpay_order_id: {
                    type: "string",
                    example: "order_Qz2345abcdef",
                  },
                  razorpay_payment_id: {
                    type: "string",
                    example: "pay_Qz2345abcdef",
                  },
                  razorpay_signature: {
                    type: "string",
                    example: "9f8a3c4b...",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Payment verified successfully" },
          400: { description: "Invalid signature" },
        },
      },
    },
  },
};

// Luxury Custom Dark & Gold Theme for Swagger UI
const customCss = `
  .swagger-ui {
    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  }
  .swagger-ui .topbar {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    border-bottom: 2px solid #D4AF37;
    padding: 12px 0;
  }
  .swagger-ui .topbar-wrapper img {
    content: url('/logo.png');
    height: 42px;
    width: 42px;
    border-radius: 50%;
    border: 1px solid #D4AF37;
  }
  .swagger-ui .topbar-wrapper .link span {
    font-weight: 800;
    letter-spacing: 0.5px;
    color: #F8FAFC !important;
    font-size: 18px;
    margin-left: 10px;
  }
  .swagger-ui .info {
    margin: 25px 0;
  }
  .swagger-ui .info .title {
    font-family: serif;
    font-weight: 800;
    color: #0f172a;
  }
  .swagger-ui .btn.authorize {
    background-color: #D4AF37 !important;
    border-color: #D4AF37 !important;
    color: #0f172a !important;
    font-weight: bold;
    border-radius: 8px;
  }
  .swagger-ui .btn.authorize svg {
    fill: #0f172a !important;
  }
  .swagger-ui .opblock.opblock-post {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.05);
  }
  .swagger-ui .opblock.opblock-get {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.05);
  }
  .swagger-ui .opblock.opblock-put {
    border-color: #f59e0b;
    background: rgba(245, 158, 11, 0.05);
  }
  .swagger-ui .opblock.opblock-delete {
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.05);
  }
  .swagger-ui .opblock-tag {
    font-size: 16px;
    font-weight: 700;
    border-bottom: 2px solid #e2e8f0;
    padding: 10px 0;
    color: #0f172a;
  }
`;

const swaggerOptions = {
  customCss,
  customSiteTitle: "Tia'z Digital Gold & Silver API Documentation",
  customfavIcon: "/logo.png",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: "none",
    filter: true,
    tryItOutEnabled: true,
  },
};

const jsDocOptions = {
  definition: baseSpec,
  apis: [
    path.join(__dirname, "../routes/*.js"),
    path.join(__dirname, "../controllers/*.js"),
  ],
};

const swaggerSpec = swaggerJsDoc(jsDocOptions);

module.exports = {
  swaggerSpec,
  swaggerOptions,
};
