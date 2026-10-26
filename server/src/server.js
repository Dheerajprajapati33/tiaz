const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = require("./app");
const env = require("./config/env");
const connectDB = require("./config/db");
const logger = require("./config/logger");
const rateScraperService = require("./services/rateScraper.service");

const { colors } = logger;

const startServer = async () => {
  try {
    // Connect to Database
    await connectDB();

    // Start Real-Time Live Bullion Rate Scraper (MMTC-PAMP digital-gold feed, refreshes every 5 seconds)
    rateScraperService.startScheduler(5 * 1000);

    const PORT = env.PORT || 5000;
    const server = app.listen(PORT, () => {
      const modeText = (env.NODE_ENV || "development").toUpperCase();
      const apiUrl = `http://localhost:${PORT}/api/v1`;
      const healthUrl = `http://localhost:${PORT}/api/v1/health`;

      console.log(
        "\n" +
          colors.cyan +
          "┌──────────────────────────────────────────────────────────────────┐" +
          colors.reset,
      );
      console.log(
        colors.cyan +
          "│" +
          colors.reset +
          colors.bold +
          colors.brightGreen +
          "   ✨ DIGITAL GOLD PLATFORM - BACKEND REST API SERVER RUNNING   " +
          colors.reset +
          colors.cyan +
          "│" +
          colors.reset,
      );
      console.log(
        colors.cyan +
          "├──────────────────────────────────────────────────────────────────┤" +
          colors.reset,
      );
      console.log(
        `${colors.cyan}│${colors.reset}   🚀 ${colors.bold}Environment:${colors.reset}   ${colors.brightYellow}${modeText}${colors.reset}${" ".repeat(Math.max(1, 48 - modeText.length))}${colors.cyan}│${colors.reset}`,
      );
      console.log(
        `${colors.cyan}│${colors.reset}   🌐 ${colors.bold}Port:${colors.reset}          ${colors.brightCyan}${PORT}${colors.reset}${" ".repeat(Math.max(1, 48 - String(PORT).length))}${colors.cyan}│${colors.reset}`,
      );
      console.log(
        `${colors.cyan}│${colors.reset}   📡 ${colors.bold}Base URL:${colors.reset}      ${colors.brightWhite}${colors.underline}${apiUrl}${colors.reset}${" ".repeat(Math.max(1, 48 - apiUrl.length))}${colors.cyan}│${colors.reset}`,
      );
      console.log(
        `${colors.cyan}│${colors.reset}   ❤️  ${colors.bold}Health Check:${colors.reset}  ${colors.brightGreen}${colors.underline}${healthUrl}${colors.reset}${" ".repeat(Math.max(1, 48 - healthUrl.length))}${colors.cyan}│${colors.reset}`,
      );
      console.log(
        colors.cyan +
          "└──────────────────────────────────────────────────────────────────┘\n" +
          colors.reset,
      );
    });

    const shutdown = () => {
      logger.info("Shutting down server gracefully...");
      rateScraperService.stopScheduler();
      server.close(() => {
        logger.info("HTTP server closed.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", { promise, reason });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

startServer();
