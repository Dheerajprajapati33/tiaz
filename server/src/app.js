const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const env = require("./config/env");
const routes = require("./routes/index");
const { apiLimiter } = require("./middleware/rateLimiter.middleware");
const errorHandler = require("./middleware/error.middleware");
const swaggerUi = require("swagger-ui-express");
const { swaggerSpec, swaggerOptions } = require("./docs/swagger");

const app = express();

// Trust reverse proxy / devtunnels headers (X-Forwarded-For)
app.set("trust proxy", 1);

// 1. Universal CORS Configuration - MUST run before ANY other middleware
app.use((req, res, next) => {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Tunnel-Skip-Anti-Abuse, Cache-Control, Pragma"
  );
  res.setHeader("Access-Control-Expose-Headers", "Content-Range, X-Content-Range");

  // Instantly handle preflight OPTIONS requests without running downstream middleware
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// Also configure standard cors package as secondary guarantee
app.use(
  cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "X-Tunnel-Skip-Anti-Abuse",
      "Cache-Control",
      "Pragma"
    ]
  })
);

// 2. Favicon handler to prevent annoying 404 logs from browsers
app.get("/favicon.ico", (req, res) => res.status(204).end());

// 3. Security HTTP headers (configured to never block cross-origin requests & allow Swagger UI)
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  })
);

// 4. Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 5. Clean API Request Logger
morgan.token("clean-timestamp", () => {
  return new Date().toLocaleTimeString();
});

app.use(morgan("[:clean-timestamp] :method :url :status :response-time ms"));

// 6. Global Rate Limiting for API routes
app.use("/api", apiLimiter);

// 7. Static uploads directory & logo asset
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.get("/logo.png", (req, res) => {
  res.sendFile(path.join(__dirname, "../uploads/logo.png"));
});

// 8. Swagger Interactive API Documentation UI (Folder-wise with Authorize JWT support)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// 9. Mount main API router
app.use("/api/v1", routes);

// 9. 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// 10. Centralized Error Handler
app.use(errorHandler);

module.exports = app;
