# TIA'Z DIGITAL GOLD & BULLION — COMPLETE PURCHASE FLOW INTEGRATION GUIDE
> **Target Audience:** Frontend & Mobile Application Developers (React / React Native / Flutter / Web)  
> **Base API URL:** `{{baseUrl}}/api/v1` (e.g., `http://localhost:5000/api/v1` or production server)  
> **Authentication Header:** `Authorization: Bearer <JWT_ACCESS_TOKEN>` (Required for all buy endpoints)

---

## 📌 1. Essential Concepts & Golden Rules

### ⚠️ Golden Rule #1: `create-order` is ONLY for Razorpay, NOT the final purchase!
- Calling `POST /api/v1/orders/create-order` or `POST /api/v1/gold/create-order` **ONLY creates a Razorpay gateway order**.
- **No purchase record is created in the database at this step.**
- After Razorpay payment popup succeeds, the client **MUST call the corresponding `/buy` API** with payment signatures. Only then is the order saved in the database!

### ⚠️ Golden Rule #2: Physical Buy vs. Virtual Buy
| Feature | Physical Buy (Coins / Bars) | Virtual / Digital Buy (Vault) |
| :--- | :--- | :--- |
| **Metal Type** | Gold Coins, Silver Bars, etc. | 24K Digital Gold, 999 Fine Silver |
| **Delivery** | Physical courier to doorstep (requires delivery address) | Instant digital credit into user's vault |
| **Order API** | `POST /api/v1/orders/buy` | `POST /api/v1/gold/buy` or `POST /api/v1/silver/buy` |
| **Payment Options** | `ONLINE` (Razorpay), `COD` (Cash on delivery), `WALLET` | `ONLINE` (Razorpay), `WALLET` |
| **Admin Panel Location** | **Orders (`/orders`)** tab (Requires call verification & dispatch) | **Transactions (`/transactions`)** & **Gold/Silver Vault** overview |

---

## 📦 2. Physical Buy Flow (Gold & Silver Coins / Bars)

Use this flow when a customer purchases physical products like gold coins or silver bars for doorstep delivery.

### 🔄 End-to-End Sequence

```
1. GET /products                      --> User views coin/bar catalogue
2. GET /orders/checkout-preview/:id   --> Calculates total price, weights & delivery
3. Payment Branching:
   - If COD:     --> Skip Razorpay, directly call POST /orders/buy
   - If WALLET:  --> Skip Razorpay, directly call POST /orders/buy
   - If ONLINE:  --> (a) POST /orders/create-order
                     (b) Open Razorpay SDK on mobile/web
                     (c) Upon success, call POST /orders/buy with paymentDetails
4. Order appears instantly in Admin Panel (/orders) with status "PLACED" or "CONFIRMED".
```

---

### Step 2.1: Fetch Products Catalogue
- **Method & Route:** `GET /products`
- **Headers:** Optional
- **Query Params:**
  - `metalType`: `GOLD` | `SILVER` | `ALL` (Optional)
  - `inStock`: `true` (Optional)

#### Response Example:
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "673abc1234567890abcdef12",
        "name": "2g 24K Gold BAR",
        "metalType": "GOLD",
        "weightGrams": 2.0,
        "purity": "24K (99.9%)",
        "price": 15470.44,
        "inStock": true,
        "images": ["https://.../goldbar2g.png"]
      }
    ]
  }
}
```

---

### Step 2.2: Checkout Preview (Price Calculation)
Call before showing the final checkout screen to display exact taxes, delivery fees, and breakdown.
- **Method & Route:** `GET /orders/checkout-preview/:productId?quantity=1`
- **Headers:** `Authorization: Bearer <TOKEN>`

#### Response Example:
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "673abc1234567890abcdef12",
      "name": "2g 24K Gold BAR",
      "metalType": "GOLD",
      "weightGrams": 2,
      "purity": "24K (99.9%)"
    },
    "quantity": 1,
    "pricing": {
      "unitPrice": 15470.44,
      "itemTotal": 15470.44,
      "deliveryFee": 0,
      "deliveryFeeText": "FREE",
      "transitInsurance": "100% Insured",
      "totalPayable": 15470.44
    }
  }
}
```

---

### Step 2.3 (Online Only): Create Razorpay Order
If the user selects **Online / UPI Payment**, call this endpoint to get the Razorpay `order_id`:
- **Method & Route:** `POST /orders/create-order`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Request Body:**
```json
{
  "productId": "673abc1234567890abcdef12",
  "quantity": 1
}
```

#### Response Example:
```json
{
  "success": true,
  "message": "Razorpay order created for product purchase",
  "data": {
    "id": "order_P191aBcDeFgHiJ",
    "amount": 1547044,
    "currency": "INR",
    "status": "created",
    "product": {
      "id": "673abc1234567890abcdef12",
      "name": "2g 24K Gold BAR",
      "totalPayable": 15470.44
    }
  }
}
```

---

### Step 2.4: Execute Final Physical Purchase (`/orders/buy`)
Once payment is completed (or directly if COD/WALLET), call this API to save the order to the database:
- **Method & Route:** `POST /orders/buy`
- **Headers:** `Authorization: Bearer <TOKEN>`

#### Case A: Online / UPI Payment (`paymentMode: "ONLINE"`)
```json
{
  "productId": "673abc1234567890abcdef12",
  "quantity": 1,
  "paymentMode": "ONLINE",
  "deliveryAddress": {
    "recipientName": "Rahul Sharma",
    "recipientPhone": "9876543210",
    "addressLine": "Flat 204, Royal Palms, MG Road",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pincode": "560001"
  },
  "paymentDetails": {
    "razorpay_order_id": "order_P191aBcDeFgHiJ",
    "razorpay_payment_id": "pay_P192xYzA1B2C3D",
    "razorpay_signature": "e6a0d48f7634f18d7285bf8a48b..."
  }
}
```

#### Case B: Cash On Delivery (`paymentMode: "COD"`)
```json
{
  "productId": "673abc1234567890abcdef12",
  "quantity": 1,
  "paymentMode": "COD",
  "deliveryAddress": {
    "recipientName": "Rahul Sharma",
    "recipientPhone": "9876543210",
    "addressLine": "Flat 204, Royal Palms, MG Road",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pincode": "560001"
  }
}
```

#### Case C: Tia'z Cash Wallet Balance (`paymentMode: "WALLET"`)
```json
{
  "productId": "673abc1234567890abcdef12",
  "quantity": 1,
  "paymentMode": "WALLET",
  "deliveryAddress": {
    "recipientName": "Rahul Sharma",
    "recipientPhone": "9876543210",
    "addressLine": "Flat 204, Royal Palms, MG Road",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pincode": "560001"
  }
}
```

#### Response Example:
```json
{
  "success": true,
  "message": "Physical product order placed successfully via Online Payment!",
  "data": {
    "orderId": "673acc9876543210fedcba98",
    "orderNumber": "GO-PHY-1790833733683A080E6",
    "status": "CONFIRMED",
    "statusLabel": "Confirmed",
    "product": {
      "id": "673abc1234567890abcdef12",
      "name": "2g 24K Gold BAR",
      "metalType": "GOLD",
      "weightGrams": 2,
      "quantity": 1
    },
    "pricing": {
      "totalPayable": 15470.44,
      "formattedTotalPayable": "₹15,470.44"
    },
    "deliveryAddress": {
      "recipientName": "Rahul Sharma",
      "recipientPhone": "9876543210",
      "city": "Bengaluru",
      "state": "Karnataka",
      "pincode": "560001"
    },
    "payment": {
      "mode": "ONLINE",
      "status": "COMPLETED"
    }
  }
}
```

---

### Step 2.5: User Orders History
- **Method & Route:** `GET /orders/my-orders?page=1&limit=10&buyType=PHYSICAL`
- **Headers:** `Authorization: Bearer <TOKEN>`

---

## ⚡ 3. Virtual Buy Flow (Digital Gold & Silver)

Use this flow when a customer buys digital gold or silver directly into their secure digital vault (No physical shipping required).

### 🔄 End-to-End Sequence

```
1. GET /gold/rates OR /silver/rates     --> Fetch live buy & sell market rates
2. User enters amount in ₹ OR grams
3. Payment Branching:
   - If WALLET:  --> Skip Razorpay, directly call POST /gold/buy or /silver/buy
   - If ONLINE:  --> (a) POST /gold/create-order OR /silver/create-order
                     (b) Open Razorpay SDK
                     (c) Upon success, call POST /gold/buy OR /silver/buy with paymentDetails
4. Instantly credited to user's Gold/Silver vault.
5. Transaction record generated in Admin Panel (/transactions).
```

---

### 🌟 Part A: Virtual Gold Buy

#### Step 3.A.1: Get Live Gold Rates
- **Method & Route:** `GET /gold/rates` (Public, no auth needed)
- **Response:**
```json
{
  "success": true,
  "data": {
    "rate24k": {
      "purity": "24K",
      "pricePerGram": 7735.22,
      "buyPricePerGram": 8121.98,
      "sellPricePerGram": 7735.22,
      "buyMarkupPercentage": 5
    }
  }
}
```

#### Step 3.A.2: Create Razorpay Order for Virtual Gold
- **Method & Route:** `POST /gold/create-order`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Request Body (Specify either amount OR grams):**
```json
{
  "amount": 500
}
```
*Or by weight:*
```json
{
  "grams": 0.0615
}
```

#### Step 3.A.3: Execute Virtual Gold Purchase (`/gold/buy`)
- **Method & Route:** `POST /gold/buy`
- **Headers:** `Authorization: Bearer <TOKEN>`

##### Request Body (Online Payment):
```json
{
  "amount": 500,
  "paymentMethod": "ONLINE",
  "paymentDetails": {
    "razorpay_order_id": "order_P191aBcDeFgHiJ",
    "razorpay_payment_id": "pay_P192xYzA1B2C3D",
    "razorpay_signature": "e6a0d48f7634f18d7285bf8a48b..."
  }
}
```

##### Request Body (Wallet Payment):
```json
{
  "amount": 500,
  "paymentMethod": "WALLET"
}
```

#### Response Example:
```json
{
  "success": true,
  "message": "Gold purchased successfully",
  "data": {
    "buyType": "VIRTUAL",
    "order": {
      "orderNumber": "GO-VIR-17908339912A3B4",
      "status": "COMPLETED",
      "purity": "24K Gold",
      "grams": 0.0615,
      "totalPayable": 500,
      "paymentMethod": "Online Payment"
    },
    "wallet": {
      "availableGold": 0.1255,
      "formattedAvailableGold": "0.1255 gm",
      "virtualGold": 0.1255,
      "totalInvested": 1000
    }
  }
}
```

---

### 🪙 Part B: Virtual Silver Buy

#### Step 3.B.1: Get Live Silver Rates
- **Method & Route:** `GET /silver/rates` (Public, no auth needed)
- **Response:**
```json
{
  "success": true,
  "data": {
    "rate999": {
      "purity": "999 Fine Silver",
      "pricePerGram": 94.50,
      "buyPricePerGram": 99.22,
      "sellPricePerGram": 94.50
    }
  }
}
```

#### Step 3.B.2: Create Razorpay Order for Virtual Silver
- **Method & Route:** `POST /silver/create-order`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Request Body:**
```json
{
  "amount": 500
}
```

#### Step 3.B.3: Execute Virtual Silver Purchase (`/silver/buy`)
- **Method & Route:** `POST /silver/buy`
- **Headers:** `Authorization: Bearer <TOKEN>`

##### Request Body (Online Payment):
```json
{
  "amount": 500,
  "paymentMethod": "ONLINE",
  "paymentDetails": {
    "razorpay_order_id": "order_P191aBcDeFgHiJ",
    "razorpay_payment_id": "pay_P192xYzA1B2C3D",
    "razorpay_signature": "e6a0d48f7634f18d7285bf8a48b..."
  }
}
```

##### Request Body (Wallet Payment):
```json
{
  "amount": 500,
  "paymentMethod": "WALLET"
}
```

#### Response Example:
```json
{
  "success": true,
  "message": "Silver purchased successfully",
  "data": {
    "buyType": "VIRTUAL",
    "order": {
      "orderNumber": "SO-VIR-17908339912A3B4",
      "status": "COMPLETED",
      "purity": "999 Fine (99.9%)",
      "grams": 5.0393,
      "totalPayable": 500,
      "paymentMethod": "Online Payment"
    },
    "wallet": {
      "availableSilver": 15.25,
      "formattedAvailableSilver": "15.2500 gm",
      "totalInvested": 1500
    }
  }
}
```

---

## 💻 4. Frontend Integration Example (React / React Native)

Here is a ready-to-use utility snippet for handling the complete Razorpay + API flow:

```javascript
import RazorpayCheckout from 'react-native-razorpay'; // Or window.Razorpay on Web

/**
 * Buy Physical Product (Gold/Silver Coin or Bar)
 */
async function purchasePhysicalProduct({ productId, quantity, deliveryAddress, paymentMode, userToken, userProfile }) {
  try {
    // 1. If Cash On Delivery or Wallet, execute directly:
    if (paymentMode === 'COD' || paymentMode === 'WALLET') {
      const response = await fetch('http://YOUR_SERVER/api/v1/orders/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ productId, quantity, paymentMode, deliveryAddress })
      });
      return await response.json();
    }

    // 2. If ONLINE: First create Razorpay order
    const orderInitRes = await fetch('http://YOUR_SERVER/api/v1/orders/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({ productId, quantity })
    });
    const orderInitData = await orderInitRes.json();
    if (!orderInitData.success) throw new Error(orderInitData.message);

    const rzpOrder = orderInitData.data;

    // 3. Open Razorpay Checkout Gateway
    const options = {
      description: `Purchase ${rzpOrder.product?.name}`,
      currency: 'INR',
      key: 'YOUR_RAZORPAY_KEY_ID', // Razorpay Public Key
      amount: rzpOrder.amount, // in paise
      name: "TIA'Z Digital Gold",
      order_id: rzpOrder.id,
      prefill: {
        name: userProfile.fullName,
        contact: userProfile.mobile,
        email: userProfile.email
      },
      theme: { color: '#F59E0B' }
    };

    // Trigger payment popup
    const paymentResponse = await RazorpayCheckout.open(options);

    // 4. CRITICAL STEP: Call /orders/buy with signature to save order in Database
    const finalOrderRes = await fetch('http://YOUR_SERVER/api/v1/orders/buy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        productId,
        quantity,
        paymentMode: 'ONLINE',
        deliveryAddress,
        paymentDetails: {
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature
        }
      })
    });

    return await finalOrderRes.json();
  } catch (error) {
    console.error('Physical purchase failed:', error);
    throw error;
  }
}
```

---

## 📋 5. Summary Cheat Sheet for Developers

| Goal | Endpoint | Method | Required Payload Keys |
| :--- | :--- | :--- | :--- |
| **Catalog Products** | `/products` | `GET` | - |
| **Physical Checkout Calc** | `/orders/checkout-preview/:productId` | `GET` | `quantity` (Query) |
| **Physical Razorpay Order** | `/orders/create-order` | `POST` | `productId`, `quantity` |
| **Final Physical Buy** | `/orders/buy` | `POST` | `productId`, `quantity`, `paymentMode`, `deliveryAddress`, (`paymentDetails` if ONLINE) |
| **Live Gold Rates** | `/gold/rates` | `GET` | - |
| **Virtual Gold Razorpay Order**| `/gold/create-order` | `POST` | `amount` OR `grams` |
| **Final Virtual Gold Buy** | `/gold/buy` | `POST` | `amount` OR `grams`, `paymentMethod`, (`paymentDetails` if ONLINE) |
| **Live Silver Rates** | `/silver/rates` | `GET` | - |
| **Virtual Silver Razorpay Order**| `/silver/create-order` | `POST` | `amount` OR `grams` |
| **Final Virtual Silver Buy** | `/silver/buy` | `POST` | `amount` OR `grams`, `paymentMethod`, (`paymentDetails` if ONLINE) |
| **User Orders History** | `/orders/my-orders` | `GET` | `buyType` (PHYSICAL / VIRTUAL) |
