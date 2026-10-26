const fs = require('fs');
const path = require('path');

const collection = {
  info: {
    _postman_id: "tiaz-digital-gold-silver-api-v2",
    name: "Tia'z Digital Gold & Silver API",
    description: "Complete, production-ready REST API collection for Tia'z Digital Gold & Silver investment platform. Includes Authentication, Profile, Home Screen (Gold & Silver live rates, holdings & overviews), Gold Buy/Sell (5% margin on purchase, actual value on sale), Silver Buy/Sell (5% margin on purchase, actual value on sale), Transactions, Referrals, Wallet, Banks, KYC, and Support.\n\nCRITICAL BUSINESS RULE:\n- Gold / Silver PURCHASE (BUY): Calculated with 5% margin (+5% markup) added to the base market rate, plus 3% GST.\n- Gold / Silver SALE (SELL): Executed at 100% actual market rate (no markup applied).",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  variable: [
    {
      key: "baseUrl",
      value: "http://localhost:8000/api/v1",
      type: "string",
      description: "API Base URL (e.g. http://localhost:8000/api/v1 or https://your-domain.com/api/v1)"
    },
    {
      key: "token",
      value: "",
      type: "string",
      description: "JWT Bearer Authentication Token (Auto-populated on successful Login / Verify OTP)"
    }
  ],
  item: [
    // -------------------------------------------------------------
    // FOLDER 1: AUTHENTICATION
    // -------------------------------------------------------------
    {
      name: "1. Authentication",
      item: [
        {
          name: "Send Login OTP",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                mobile: "9876543210"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/auth/send-otp",
              host: ["{{baseUrl}}"],
              path: ["auth", "send-otp"]
            },
            description: "Sends 6-digit OTP via SMS to user's registered mobile number. Note: KYC must be verified to login."
          }
        },
        {
          name: "Verify OTP & Login",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "if (pm.response.code === 200) {",
                  "    var json = pm.response.json();",
                  "    if (json.data && json.data.token) {",
                  "        pm.collectionVariables.set('token', json.data.token);",
                  "        console.log('Token auto-saved to collection variable:', json.data.token);",
                  "    }",
                  "}"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                mobile: "9876543210",
                otp: "123456"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/auth/verify-otp",
              host: ["{{baseUrl}}"],
              path: ["auth", "verify-otp"]
            },
            description: "Verifies the 6-digit OTP and logs in the user. Automatically saves JWT token into {{token}} collection variable."
          }
        },
        {
          name: "Register User (Multipart Form-Data with KYC)",
          request: {
            method: "POST",
            header: [],
            body: {
              mode: "formdata",
              formdata: [
                { key: "fullName", value: "Rahul Sharma", type: "text" },
                { key: "mobile", value: "9876543210", type: "text" },
                { key: "email", value: "rahul@example.com", type: "text" },
                { key: "dob", value: "1995-05-15", type: "text" },
                { key: "gender", value: "male", type: "text" },
                { key: "panNumber", value: "ABCDE1234F", type: "text" },
                { key: "address", value: "123, MG Road, Landmark Colony", type: "text" },
                { key: "nationality", value: "Indian", type: "text" },
                { key: "referralCode", value: "GOLD9B3A2F", type: "text", description: "Optional referral code of inviting friend" },
                { key: "password", value: "Secret@123", type: "text", description: "Optional password for password login" },
                { key: "profileImage", type: "file", description: "Profile photo (JPG/PNG)" },
                { key: "aadhaarFront", type: "file", description: "Aadhaar Card Front (Required)" },
                { key: "aadhaarBack", type: "file", description: "Aadhaar Card Back (Optional)" },
                { key: "panCard", type: "file", description: "PAN Card Image (Required)" }
              ]
            },
            url: {
              raw: "{{baseUrl}}/auth/register",
              host: ["{{baseUrl}}"],
              path: ["auth", "register"]
            },
            description: "Registers a new user and uploads their KYC documents into user-specific folder. Returns user ID, name, and kycStatus ('pending')."
          }
        },
        {
          name: "Password Login (Optional fallback)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "if (pm.response.code === 200) {",
                  "    var json = pm.response.json();",
                  "    if (json.data && json.data.token) {",
                  "        pm.collectionVariables.set('token', json.data.token);",
                  "        console.log('Token auto-saved to collection variable:', json.data.token);",
                  "    }",
                  "}"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                mobile: "9876543210",
                password: "Secret@123"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/auth/login",
              host: ["{{baseUrl}}"],
              path: ["auth", "login"]
            },
            description: "Logs in with registered mobile and password. Auto-saves bearer token."
          }
        }
      ]
    },

    // -------------------------------------------------------------
    // FOLDER 2: USER PROFILE
    // -------------------------------------------------------------
    {
      name: "2. User Profile",
      item: [
        {
          name: "Get My Profile",
          request: {
            method: "GET",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" }
            ],
            url: {
              raw: "{{baseUrl}}/user/profile",
              host: ["{{baseUrl}}"],
              path: ["user", "profile"]
            },
            description: "Fetches full profile of the logged-in user including referral code, KYC status, and verification details."
          }
        },
        {
          name: "Update Profile Details",
          request: {
            method: "PUT",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                fullName: "Rahul S. Sharma",
                email: "rahul.sharma@example.com",
                address: "Flat 402, Sunshine Heights, Mumbai"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/user/profile",
              host: ["{{baseUrl}}"],
              path: ["user", "profile"]
            },
            description: "Updates editable profile fields (Name, Email, Address, Nominee)."
          }
        },
        {
          name: "Upload Profile Image",
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" }
            ],
            body: {
              mode: "formdata",
              formdata: [
                { key: "profileImage", type: "file", description: "Avatar image (JPG/PNG)" }
              ]
            },
            url: {
              raw: "{{baseUrl}}/user/profile-image",
              host: ["{{baseUrl}}"],
              path: ["user", "profile-image"]
            },
            description: "Uploads or updates user profile avatar photo."
          }
        },
        {
          name: "Change Password",
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                oldPassword: "Secret@123",
                newPassword: "NewSecret@456"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/user/change-password",
              host: ["{{baseUrl}}"],
              path: ["user", "change-password"]
            },
            description: "Changes the account password for password-based logins."
          }
        }
      ]
    },

    // -------------------------------------------------------------
    // FOLDER 3: HOME SCREEN
    // -------------------------------------------------------------
    {
      name: "3. Home Screen",
      item: [
        {
          name: "Get Home Screen Data (Gold & Silver Live Rates, Holdings & Overviews)",
          request: {
            method: "GET",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" }
            ],
            url: {
              raw: "{{baseUrl}}/home?period=all_time",
              host: ["{{baseUrl}}"],
              path: ["home"],
              query: [
                {
                  key: "period",
                  value: "all_time",
                  description: "Performance chart timeframe: all_time | 1y | 1m | 1w | 1d"
                }
              ]
            },
            description: "Fetches all components for Tia'z Home screen:\n1. liveGoldRate: Live 24K gold rate with 5% purchase markup (buyPricePerGram), actual sell rate (sellPricePerGram), 24h change amount and percentage.\n2. liveSilverRate: Live 999 silver rate with 5% purchase markup (buyPricePerGram), actual sell rate (sellPricePerGram), per-gram and per-kg prices, 24h change.\n3. myWallet: Combined wallet balances for Gold (gm & ₹ value), Silver (gm & ₹ value), Tia'z Wallet cash balance, reward points, and total portfolio value (totalHoldingsValue).\n4. goldOverview: User's gold investment, current valuation, profit/loss, and historical trend points for interactive chart.\n5. silverOverview: User's silver investment, current valuation, profit/loss, and historical trend points for interactive chart.\n6. recentGoldPurchases & recentSilverPurchases: Up to 5 completed purchases for each metal with grams, rate, gain, and formatted amounts."
          }
        }
      ]
    },

    // -------------------------------------------------------------
    // FOLDER 4: GOLD (BUY & SELL)
    // -------------------------------------------------------------
    {
      name: "4. Gold (Buy & Sell)",
      item: [
        {
          name: "Live Gold Rates (Public)",
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{baseUrl}}/gold/rates",
              host: ["{{baseUrl}}"],
              path: ["gold", "rates"]
            },
            description: "Fetches current live 24K and 22K gold rates per gram in INR. Includes actualPricePerGram, buyPricePerGram (+5% margin), and sellPricePerGram (100% actual value)."
          }
        },
        {
          name: "Buy: Live Calculation / Quote (By Amount ₹)",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{token}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                amount: 1000
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/gold/calculate-buy",
              host: ["{{baseUrl}}"],
              path: ["gold", "calculate-buy"]
            },
            description: "Real-time calculation as user types amount in ₹. Purchases are calculated with 5% margin (+5% markup) on base rate + 3% GST. Returns grams, 3% GST, total payable, preset chips, and payment methods with Tia'z Wallet balance."
          }
        },
        {
          name: "Buy: Live Calculation / Quote (By Grams gm)",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{token}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                grams: 0.5
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/gold/calculate-buy",
              host: ["{{baseUrl}}"],
              path: ["gold", "calculate-buy"]
            },
            description: "Real-time calculation as user types weight in grams. Rate applied includes 5% margin + 3% GST. Returns conversionText, 3% GST, gross amount, and total payable."
          }
        },
        {
          name: "Buy Gold Order: Pay via Tia'z Wallet",
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                amount: 1000,
                paymentMethod: "WALLET"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/gold/buy",
              host: ["{{baseUrl}}"],
              path: ["gold", "buy"]
            },
            description: "Executes gold purchase using Tia'z Wallet cash balance (5% margin added). Automatically verifies sufficient wallet balance, deducts cash, credits gold grams to vault, and logs transaction."
          }
        },
        {
          name: "Buy Gold Order: Pay via UPI / Bank",
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                amount: 1000,
                paymentMethod: "UPI"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/gold/buy",
              host: ["{{baseUrl}}"],
              path: ["gold", "buy"]
            },
            description: "Executes buy order via UPI / Gateway (5% margin added). Credits gold grams to wallet and creates completed transaction."
          }
        },
        {
          name: "Sell: Get Sell Gold Screen Data",
          request: {
            method: "GET",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" }
            ],
            url: {
              raw: "{{baseUrl}}/gold/sell-screen",
              host: ["{{baseUrl}}"],
              path: ["gold", "sell-screen"]
            },
            description: "Fetches all components for Sell Gold screen: Live price (100% actual rate, NO 5% margin), user's sellable gold balance, preset chips (0.5g, 1g, 1.5g, Max), default quote, and payout destinations (Tia'z Wallet + Bank accounts)."
          }
        },
        {
          name: "Sell: Live Calculation / Quote",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{token}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                grams: 0.5
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/gold/calculate-sell",
              host: ["{{baseUrl}}"],
              path: ["gold", "calculate-sell"]
            },
            description: "Calculates estimated received amount when selling specified grams at 100% actual rate (no margin). Verifies sufficient sellable gold balance."
          }
        },
        {
          name: "Sell Gold: Credit to Tia'z Wallet",
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                grams: 0.5,
                payoutDestination: "WALLET"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/gold/sell",
              host: ["{{baseUrl}}"],
              path: ["gold", "sell"]
            },
            description: "Executes gold sale at actual value (no margin) and instantly credits cash into user's Tia'z Wallet."
          }
        },
        {
          name: "Sell Gold: Payout to Bank Account",
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                grams: 0.5,
                payoutDestination: "BANK",
                bankAccountId: "6aba71d1a00625e85e64aa37"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/gold/sell",
              host: ["{{baseUrl}}"],
              path: ["gold", "sell"]
            },
            description: "Executes gold sale at actual value and initiates bank transfer to user's selected linked bank account."
          }
        },
        {
          name: "Get User Gold Orders History",
          request: {
            method: "GET",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" }
            ],
            url: {
              raw: "{{baseUrl}}/gold/orders?page=1&limit=10&type=BUY",
              host: ["{{baseUrl}}"],
              path: ["gold", "orders"],
              query: [
                { key: "page", value: "1" },
                { key: "limit", value: "10" },
                { key: "type", value: "BUY", description: "Optional: BUY | SELL" }
              ]
            },
            description: "Paginated list of user's gold buy/sell orders."
          }
        },
        {
          name: "Admin: Update Gold Rate",
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                purity: "24K",
                pricePerGram: 7250.00,
                source: "manual"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/gold/rates",
              host: ["{{baseUrl}}"],
              path: ["gold", "rates"]
            },
            description: "Admin endpoint to update live 24K or 22K gold rate."
          }
        }
      ]
    },

    // -------------------------------------------------------------
    // FOLDER 5: SILVER (BUY & SELL)
    // -------------------------------------------------------------
    {
      name: "5. Silver (Buy & Sell)",
      item: [
        {
          name: "Live Silver Rates (Public)",
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{baseUrl}}/silver/rates",
              host: ["{{baseUrl}}"],
              path: ["silver", "rates"]
            },
            description: "Fetches current live 999 Fine Silver and 925 Sterling Silver rates per gram and per kg in INR. Includes actualPricePerGram, buyPricePerGram (+5% margin), and sellPricePerGram (100% actual value)."
          }
        },
        {
          name: "Buy: Live Calculation / Quote (By Amount ₹)",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{token}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                amount: 1000
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/silver/calculate-buy",
              host: ["{{baseUrl}}"],
              path: ["silver", "calculate-buy"]
            },
            description: "Real-time calculation as user types amount in ₹. Purchases are calculated with 5% margin (+5% markup) on base rate + 3% GST. Returns silver grams, 3% GST, total payable, preset chips (₹500, ₹1000, ₹2000, ₹5000), and payment methods with Tia'z Wallet balance."
          }
        },
        {
          name: "Buy: Live Calculation / Quote (By Grams gm)",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{token}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                grams: 10.0
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/silver/calculate-buy",
              host: ["{{baseUrl}}"],
              path: ["silver", "calculate-buy"]
            },
            description: "Real-time calculation as user types weight in grams. Rate applied includes 5% margin + 3% GST. Returns conversionText, 3% GST, gross amount, and total payable."
          }
        },
        {
          name: "Buy Silver Order: Pay via Tia'z Wallet",
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                amount: 1000,
                paymentMethod: "WALLET"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/silver/buy",
              host: ["{{baseUrl}}"],
              path: ["silver", "buy"]
            },
            description: "Executes silver purchase using Tia'z Wallet cash balance (5% margin added). Automatically checks wallet balance, deducts cash, credits 999 silver grams into vault, and logs transaction."
          }
        },
        {
          name: "Buy Silver Order: Pay via UPI / Bank",
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                amount: 1000,
                paymentMethod: "UPI"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/silver/buy",
              host: ["{{baseUrl}}"],
              path: ["silver", "buy"]
            },
            description: "Executes buy order via UPI / Gateway (5% margin added). Credits 999 fine silver grams to SilverWallet and creates completed transaction."
          }
        },
        {
          name: "Sell: Get Sell Silver Screen Data",
          request: {
            method: "GET",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" }
            ],
            url: {
              raw: "{{baseUrl}}/silver/sell-screen",
              host: ["{{baseUrl}}"],
              path: ["silver", "sell-screen"]
            },
            description: "Fetches all components for Sell Silver screen: Live sell price (100% actual rate, NO 5% margin), user's available silver balance, preset chips (10g, 25g, 50g, 100g, Max), default quote, and payout destinations (Tia'z Wallet + Bank accounts)."
          }
        },
        {
          name: "Sell: Live Calculation / Quote",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "Authorization", value: "Bearer {{token}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                grams: 10.0
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/silver/calculate-sell",
              host: ["{{baseUrl}}"],
              path: ["silver", "calculate-sell"]
            },
            description: "Calculates estimated payout when selling specified silver grams at 100% actual rate (no margin). Verifies sufficient available silver balance."
          }
        },
        {
          name: "Sell Silver: Credit to Tia'z Wallet",
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                grams: 10.0,
                payoutDestination: "WALLET"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/silver/sell",
              host: ["{{baseUrl}}"],
              path: ["silver", "sell"]
            },
            description: "Executes silver sale at 100% actual rate (no margin) and instantly credits cash into user's Tia'z Wallet."
          }
        },
        {
          name: "Sell Silver: Payout to Bank Account",
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                grams: 10.0,
                payoutDestination: "BANK",
                bankAccountId: "6aba71d1a00625e85e64aa37"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/silver/sell",
              host: ["{{baseUrl}}"],
              path: ["silver", "sell"]
            },
            description: "Executes silver sale at 100% actual rate and initiates bank payout to user's selected linked bank account."
          }
        },
        {
          name: "Get User Silver Orders History",
          request: {
            method: "GET",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" }
            ],
            url: {
              raw: "{{baseUrl}}/silver/orders?page=1&limit=10&type=BUY",
              host: ["{{baseUrl}}"],
              path: ["silver", "orders"],
              query: [
                { key: "page", value: "1" },
                { key: "limit", value: "10" },
                { key: "type", value: "BUY", description: "Optional: BUY | SELL" }
              ]
            },
            description: "Paginated list of user's silver buy/sell orders."
          }
        },
        {
          name: "Admin: Update Silver Rate",
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                purity: "999",
                pricePerGram: 94.50,
                source: "manual"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/silver/rates",
              host: ["{{baseUrl}}"],
              path: ["silver", "rates"]
            },
            description: "Admin endpoint to update live 999 or 925 silver rate."
          }
        }
      ]
    },

    // -------------------------------------------------------------
    // FOLDER 6: TRANSACTIONS
    // -------------------------------------------------------------
    {
      name: "6. Transactions",
      item: [
        {
          name: "Get All Transactions (with Filters & Sort)",
          request: {
            method: "GET",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" }
            ],
            url: {
              raw: "{{baseUrl}}/transactions?type=ALL&period=all_time&sortBy=latest&page=1&limit=10",
              host: ["{{baseUrl}}"],
              path: ["transactions"],
              query: [
                { key: "type", value: "ALL", description: "Category filter: ALL | BUY | SELL | TRANSFER" },
                { key: "period", value: "all_time", description: "Date filter: all_time | today | this_week | this_month | last_month | custom" },
                { key: "sortBy", value: "latest", description: "Sort order: latest | oldest | amount_high | amount_low" },
                { key: "page", value: "1", description: "Page number" },
                { key: "limit", value: "10", description: "Items per page" },
                { key: "startDate", value: "2026-09-01", disabled: true, description: "Custom start date (YYYY-MM-DD)" },
                { key: "endDate", value: "2026-09-30", disabled: true, description: "Custom end date (YYYY-MM-DD)" }
              ]
            },
            description: "Fetches logged-in user's transactions matching UI: 4 Metric cards summary (Purchases, Sales, Transfers, Total Spent), formatted transactions list, and groupedByDate for date section headers."
          }
        },
        {
          name: "Get Single Transaction Details",
          request: {
            method: "GET",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" }
            ],
            url: {
              raw: "{{baseUrl}}/transactions/TXN17906048332319D4376",
              host: ["{{baseUrl}}"],
              path: ["transactions", "TXN17906048332319D4376"]
            },
            description: "Fetches detailed information for a single transaction by its transactionNumber or MongoDB _id."
          }
        }
      ]
    },

    // -------------------------------------------------------------
    // FOLDER 7: REFERRALS
    // -------------------------------------------------------------
    {
      name: "7. Referrals",
      item: [
        {
          name: "Get Refer & Earn Screen Data",
          request: {
            method: "GET",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" }
            ],
            url: {
              raw: "{{baseUrl}}/referrals",
              host: ["{{baseUrl}}"],
              path: ["referrals"]
            },
            description: "Fetches referral screen data: Returns yourEarnings (Total Gold Earned, Total Referrals, Successful Referrals, Rewards Value) and referredFriends list."
          }
        }
      ]
    },

    // -------------------------------------------------------------
    // FOLDER 8: WALLET
    // -------------------------------------------------------------
    {
      name: "8. Wallet",
      item: [
        {
          name: "Get Wallet Details (Gold, Silver & Cash)",
          request: {
            method: "GET",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" }
            ],
            url: {
              raw: "{{baseUrl}}/wallet",
              host: ["{{baseUrl}}"],
              path: ["wallet"]
            },
            description: "Fetches user's complete holdings across Gold (available & locked grams), Silver (available & locked grams), and Tia'z Wallet cash balance."
          }
        },
        {
          name: "Add Cash to Tia'z Wallet",
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                amount: 5000
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/wallet/add-cash",
              host: ["{{baseUrl}}"],
              path: ["wallet", "add-cash"]
            },
            description: "Top up cash into user's Tia'z Wallet. Increases cashBalance and creates WALLET_CREDIT transaction."
          }
        }
      ]
    },

    // -------------------------------------------------------------
    // FOLDER 9: BANK ACCOUNTS
    // -------------------------------------------------------------
    {
      name: "9. Bank Accounts",
      item: [
        {
          name: "Get Linked Bank Accounts",
          request: {
            method: "GET",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" }
            ],
            url: {
              raw: "{{baseUrl}}/banks",
              host: ["{{baseUrl}}"],
              path: ["banks"]
            },
            description: "Fetches list of all linked bank accounts for payouts."
          }
        },
        {
          name: "Add Bank Account",
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                accountHolderName: "Rahul Sharma",
                bankName: "HDFC Bank",
                accountNumber: "50100123456789",
                ifsc: "HDFC0001234",
                accountType: "savings"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/banks",
              host: ["{{baseUrl}}"],
              path: ["banks"]
            },
            description: "Adds a new bank account. Account number is securely encrypted and last 4 digits are saved."
          }
        },
        {
          name: "Set Primary Bank Account",
          request: {
            method: "PUT",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" }
            ],
            url: {
              raw: "{{baseUrl}}/banks/:accountId/primary",
              host: ["{{baseUrl}}"],
              path: ["banks", ":accountId", "primary"],
              variable: [
                { key: "accountId", value: "6aba71d1a00625e85e64aa37" }
              ]
            },
            description: "Marks a bank account as default primary for selling gold and silver payouts."
          }
        },
        {
          name: "Delete Bank Account",
          request: {
            method: "DELETE",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" }
            ],
            url: {
              raw: "{{baseUrl}}/banks/:accountId",
              host: ["{{baseUrl}}"],
              path: ["banks", ":accountId"],
              variable: [
                { key: "accountId", value: "6aba71d1a00625e85e64aa37" }
              ]
            },
            description: "Removes a linked bank account from the user profile."
          }
        }
      ]
    },

    // -------------------------------------------------------------
    // FOLDER 10: KYC
    // -------------------------------------------------------------
    {
      name: "10. KYC",
      item: [
        {
          name: "Get KYC Status",
          request: {
            method: "GET",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" }
            ],
            url: {
              raw: "{{baseUrl}}/kyc/status",
              host: ["{{baseUrl}}"],
              path: ["kyc", "status"]
            },
            description: "Fetches user's KYC verification status: 'pending', 'under_review', 'verified', or 'rejected' (with rejectionReason)."
          }
        },
        {
          name: "Re-upload KYC Documents",
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" }
            ],
            body: {
              mode: "formdata",
              formdata: [
                { key: "aadhaarFront", type: "file", description: "Aadhaar Card Front" },
                { key: "aadhaarBack", type: "file", description: "Aadhaar Card Back" },
                { key: "panCard", type: "file", description: "PAN Card Image" }
              ]
            },
            url: {
              raw: "{{baseUrl}}/kyc/upload",
              host: ["{{baseUrl}}"],
              path: ["kyc", "upload"]
            },
            description: "Re-uploads KYC documents if previously rejected. Updates status to 'under_review'."
          }
        }
      ]
    },

    // -------------------------------------------------------------
    // FOLDER 11: NOTIFICATIONS
    // -------------------------------------------------------------
    {
      name: "11. Notifications",
      item: [
        {
          name: "Get Notifications List",
          request: {
            method: "GET",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" }
            ],
            url: {
              raw: "{{baseUrl}}/notifications",
              host: ["{{baseUrl}}"],
              path: ["notifications"]
            },
            description: "Fetches notifications list and unread count for the user."
          }
        },
        {
          name: "Mark Notification as Read",
          request: {
            method: "PUT",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" }
            ],
            url: {
              raw: "{{baseUrl}}/notifications/:id/read",
              host: ["{{baseUrl}}"],
              path: ["notifications", ":id", "read"],
              variable: [
                { key: "id", value: "6aba71d1a00625e85e64aa38" }
              ]
            },
            description: "Marks a specific notification as read."
          }
        },
        {
          name: "Mark All Notifications as Read",
          request: {
            method: "PUT",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" }
            ],
            url: {
              raw: "{{baseUrl}}/notifications/read-all",
              host: ["{{baseUrl}}"],
              path: ["notifications", "read-all"]
            },
            description: "Marks all unread notifications of the user as read."
          }
        }
      ]
    },

    // -------------------------------------------------------------
    // FOLDER 12: SUPPORT & FAQS
    // -------------------------------------------------------------
    {
      name: "12. Support & FAQs",
      item: [
        {
          name: "Get FAQs (Public)",
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{baseUrl}}/support/faqs",
              host: ["{{baseUrl}}"],
              path: ["support", "faqs"]
            },
            description: "Fetches frequently asked questions categorized by topic."
          }
        },
        {
          name: "Create Support Ticket",
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                subject: "Question about gold or silver withdrawal / delivery",
                category: "GOLD",
                message: "How can I request delivery or sell my vault holdings?"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/support/tickets",
              host: ["{{baseUrl}}"],
              path: ["support", "tickets"]
            },
            description: "Opens a customer support ticket."
          }
        },
        {
          name: "Get User Support Tickets",
          request: {
            method: "GET",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" }
            ],
            url: {
              raw: "{{baseUrl}}/support/tickets",
              host: ["{{baseUrl}}"],
              path: ["support", "tickets"]
            },
            description: "Fetches all tickets opened by the logged-in user."
          }
        }
      ]
    }
  ]
};

const outputPath = path.join(__dirname, '../../postman_collection.json');
fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2), 'utf-8');
console.log('Postman collection successfully generated at:', outputPath);
