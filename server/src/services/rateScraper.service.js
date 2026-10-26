const logger = require("../config/logger");

// MMTC-PAMP live quote feed - the exact endpoint the https://www.mmtcpamp.com/digital-gold
// "Live Buy Price" widget polls every few seconds (per-minute live ticks, incl. GST)
const MMTCP_SITE_BASE =
  process.env.MMTCP_SITE_API_BASE || "https://www.mmtcpamp.com";
// CEM API - used for 30-day daily fixing history and as stale-fixing fallback
const MMTCP_API_BASE =
  process.env.MMTCP_RATE_API_BASE || "https://cem.mmtcpamp.com";
const MMTCP_SOURCE_LABEL = "MMTCP_PAMP_LIVE";

/**
 * RateScraperService - High-performance in-memory live bullion rate scraper.
 * Fetches real Indian market rates directly and caches in-memory without database clutter.
 */
class RateScraperService {
  constructor() {
    this.intervalId = null;
    this.isScraping = false;
    this.lastRefreshAt = null;
    this.lastHistoryFetchAt = 0;
    // Daily fixing history changes at most once a day - re-fetch every 60s only
    this.HISTORY_INTERVAL_MS = 60 * 1000;
    // Raw getMetalPricesRecord responses (needed for day-over-day change calc)
    this.rawHistory = { gold: [], silver: [] };
    // GST multiplier (totalAmount / preTaxAmount) learned live from MMTC quotes
    this.gstFactor = 1.03;

    // Startup placeholder on the GST-inclusive live-quote basis (replaced within seconds)
    this.currentRates = {
      gold: {
        gold24k: 15524.56,
        gold22k: 14230.85,
        gold18k: 11643.42,
        previous24k: 15536.74,
        change24k: -12.18,
        changePercentage24k: -0.08,
        source: MMTCP_SOURCE_LABEL,
        updatedAt: new Date(),
      },
      silver: {
        silver999: 223.0,
        silver925: 206.57,
        silverKg: 223000.0,
        previous999: 224.23,
        change999: -1.23,
        changePercentage999: -0.55,
        source: MMTCP_SOURCE_LABEL,
        updatedAt: new Date(),
      },
    };

    // Real MMTC-PAMP daily fixing history (newest-first): [{ date, rate, timestamp }]
    this.rateHistory = { gold: [], silver: [] };
  }

  /**
   * Generic JSON POST helper with browser-like headers (MMTC edge blocks default clients)
   */
  async postJson(url, body, timeoutMs = 7000) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: "https://www.mmtcpamp.com",
        Referer: "https://www.mmtcpamp.com/digital-gold",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      throw new Error(
        `MMTC-PAMP API ${new URL(url).pathname} responded ${res.status}`,
      );
    }

    return res.json();
  }

  /**
   * POST helper for the MMTC-PAMP CEM trade API (JSON in / JSON out)
   */
  async postMmtcp(path, body, timeoutMs = 7000) {
    return this.postJson(`${MMTCP_API_BASE}${path}`, body, timeoutMs);
  }

  /**
   * Fetch a live BUY quote for a currency pair - same call the digital-gold widget makes.
   * Returns GST-inclusive per-gram rate (totalAmount) plus preTaxAmount and createdAt.
   */
  async getBuyQuote(currencyPair) {
    return this.postJson(
      `${MMTCP_SITE_BASE}/api/getQuote`,
      { currencyPair, type: "BUY" },
      6000,
    );
  }

  /**
   * Parse MMTC-PAMP price record (amounts are GST-exclusive per gram, as strings)
   */
  parseMmtcpAmount(record) {
    if (!record) return null;
    const val = parseFloat(
      record.preTaxAmount ?? record.price ?? record.amount,
    );
    return Number.isFinite(val) && val > 0 ? val : null;
  }

  /**
   * Convert a GST-exclusive fixing value into the GST-inclusive basis used by
   * the live benchmark (matches the number shown on mmtcpamp.com/digital-gold)
   */
  withGst(val) {
    return val === null ? null : Math.round(val * this.gstFactor * 100) / 100;
  }

  /**
   * Extract day-over-day change from a getMetalPricesRecord list.
   * Records come newest-first; yesterday = first record belonging to a different calendar day.
   * If liveValue is given, change = liveValue - yesterday (keeps change exact vs the live rate).
   */
  extractChangeFromHistory(records, liveValue = null) {
    if (!Array.isArray(records) || records.length === 0) return null;

    const latest = records[0];
    const latestDate = new Date(latest.updatedAt);
    if (isNaN(latestDate.getTime())) return null;

    const dayKey = (d) =>
      `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
    const yesterdayRecord = records.slice(1).find((r) => {
      const d = new Date(r.updatedAt);
      return !isNaN(d.getTime()) && dayKey(d) !== dayKey(latestDate);
    });

    const todayVal =
      Number.isFinite(liveValue) && liveValue > 0
        ? liveValue
        : this.withGst(this.parseMmtcpAmount(latest));
    const yesterdayVal = this.withGst(this.parseMmtcpAmount(yesterdayRecord));
    if (todayVal === null || yesterdayVal === null) return null;

    return Math.round((todayVal - yesterdayVal) * 100) / 100;
  }

  /**
   * Normalize getMetalPricesRecord output into [{ date (IST dd-MM-yyyy), rate, timestamp }], newest-first, one entry per day
   */
  normalizeMmtcpHistory(records) {
    if (!Array.isArray(records)) return [];

    const istDayKey = (d) =>
      d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // yyyy-mm-dd

    const seen = new Set();
    const out = [];
    for (const r of records) {
      const rate = this.parseMmtcpAmount(r);
      const ts = new Date(r?.updatedAt);
      if (rate === null || isNaN(ts.getTime())) continue;
      const key = istDayKey(ts);
      if (seen.has(key)) continue; // keep newest fixing per day
      seen.add(key);
      out.push({
        date: ts.toLocaleDateString("en-IN", {
          timeZone: "Asia/Kolkata",
          day: "2-digit",
          month: "short",
        }),
        rate: this.withGst(rate),
        timestamp: ts,
      });
    }
    return out;
  }

  /**
   * Fetch live Gold and Silver buy rates from MMTC-PAMP's real-time quote feed
   * (the exact /api/getQuote call the mmtcpamp.com/digital-gold "Live Buy Price"
   * widget polls - GST-inclusive per-gram rate, refreshed every minute).
   * Falls back to the CEM session fixing (also GST-inclusive) if quotes fail.
   */
  async fetchLivePrices() {
    const parseTotal = (rec) => {
      const val = parseFloat(rec?.totalAmount);
      return Number.isFinite(val) && val > 0 ? val : null;
    };

    const [goldQuote, silverQuote] = await Promise.all([
      this.getBuyQuote("XAU/INR").catch((e) => {
        logger.warn(`[RateScraper] MMTC gold live quote: ${e.message}`);
        return null;
      }),
      this.getBuyQuote("XAG/INR").catch((e) => {
        logger.warn(`[RateScraper] MMTC silver live quote: ${e.message}`);
        return null;
      }),
    ]);

    // Keep the GST multiplier in sync with what MMTC actually charges today
    for (const q of [goldQuote, silverQuote]) {
      const pre = parseFloat(q?.preTaxAmount);
      const tot = parseFloat(q?.totalAmount);
      if (
        Number.isFinite(pre) &&
        Number.isFinite(tot) &&
        pre > 0 &&
        tot > pre
      ) {
        this.gstFactor = Math.round((tot / pre) * 10000) / 10000;
      }
    }

    let gold24k = parseTotal(goldQuote);
    let silver999 = parseTotal(silverQuote);
    let goldFeedAt = goldQuote?.createdAt || null;
    let silverFeedAt = silverQuote?.createdAt || null;

    // Fallback: CEM latest session fixing (GST-inclusive totalAmount)
    if (gold24k === null || silver999 === null) {
      const [goldFix, silverFix] = await Promise.all([
        gold24k === null
          ? this.postMmtcp(
              "/trade/getLatestMetalPrice",
              { currencyPair: "XAU/INR" },
              5000,
            ).catch(() => null)
          : null,
        silver999 === null
          ? this.postMmtcp(
              "/trade/getLatestMetalPrice",
              { currencyPair: "XAG/INR" },
              5000,
            ).catch(() => null)
          : null,
      ]);
      if (gold24k === null) {
        gold24k = parseTotal(goldFix);
        goldFeedAt = goldFix?.updatedAt || null;
      }
      if (silver999 === null) {
        silver999 = parseTotal(silverFix);
        silverFeedAt = silverFix?.updatedAt || null;
      }
    }

    return { gold24k, silver999, goldFeedAt, silverFeedAt };
  }

  /**
   * Fetch real MMTC-PAMP 30-day daily fixing history (max supported by the API)
   * for benchmark charts and day-over-day change calculation
   */
  async fetchRateHistory() {
    const [goldHistory, silverHistory] = await Promise.all([
      this.postMmtcp("/trade/getMetalPricesRecord", {
        currencyPair: "XAU/INR",
        days: 30,
        type: "BUY",
      }).catch((e) => {
        logger.warn(`[RateScraper] MMTC gold history check: ${e.message}`);
        return null;
      }),
      this.postMmtcp("/trade/getMetalPricesRecord", {
        currencyPair: "XAG/INR",
        days: 30,
        type: "BUY",
      }).catch((e) => {
        logger.warn(`[RateScraper] MMTC silver history check: ${e.message}`);
        return null;
      }),
    ]);

    return {
      gold: Array.isArray(goldHistory) ? goldHistory : null,
      silver: Array.isArray(silverHistory) ? silverHistory : null,
    };
  }

  /**
   * Refresh in-memory rates directly without database insertion
   * force=true allows on-demand refresh (e.g. admin Refresh button) with a short
   * cooldown so the MMTC-PAMP API is never hammered by repeated clicks.
   */
  async refreshRates(force = false) {
    if (this.isScraping) return this.currentRates;
    const nowMs = Date.now();
    const minGapMs = force ? 2 * 1000 : 4 * 1000;
    if (this.lastRefreshAt && nowMs - this.lastRefreshAt < minGapMs)
      return this.currentRates;
    this.isScraping = true;
    this.lastRefreshAt = nowMs;

    try {
      // 1. Live tick - fetched on every refresh cycle (every few seconds)
      const live = await this.fetchLivePrices();

      // 2. Daily fixing history - refreshed only once per minute (charts / change base)
      if (
        nowMs - this.lastHistoryFetchAt >= this.HISTORY_INTERVAL_MS ||
        this.rawHistory.gold.length === 0 ||
        this.rawHistory.silver.length === 0
      ) {
        const hist = await this.fetchRateHistory();
        if (hist.gold) {
          this.rawHistory.gold = hist.gold;
          this.rateHistory.gold = this.normalizeMmtcpHistory(hist.gold);
        }
        if (hist.silver) {
          this.rawHistory.silver = hist.silver;
          this.rateHistory.silver = this.normalizeMmtcpHistory(hist.silver);
        }
        this.lastHistoryFetchAt = nowMs;
      }

      // 3. Resolve final rates (live value first, last-good in-memory value as fallback)
      const gold24k = live.gold24k ?? this.currentRates.gold.gold24k;
      const gold22k = Math.round(gold24k * (22 / 24) * 100) / 100;
      const gold18k = Math.round(gold24k * (18 / 24) * 100) / 100;
      const goldDiff =
        this.extractChangeFromHistory(this.rawHistory.gold, gold24k) ??
        this.currentRates.gold.change24k ??
        0;
      const prevGold24k = Math.round((gold24k - goldDiff) * 100) / 100;
      const goldDiffPct =
        prevGold24k > 0
          ? Math.round((goldDiff / prevGold24k) * 10000) / 100
          : 0;

      const silver999 = live.silver999 ?? this.currentRates.silver.silver999;
      const silverKg = Math.round(silver999 * 1000 * 100) / 100;
      const silver925 = Math.round(silver999 * (925 / 999) * 100) / 100;
      const silverDiff =
        this.extractChangeFromHistory(this.rawHistory.silver, silver999) ??
        this.currentRates.silver.change999 ??
        0;
      const prevSilver999 = Math.round((silver999 - silverDiff) * 100) / 100;
      const silverDiffPct =
        prevSilver999 > 0
          ? Math.round((silverDiff / prevSilver999) * 10000) / 100
          : 0;

      const changed =
        gold24k !== this.currentRates.gold.gold24k ||
        silver999 !== this.currentRates.silver.silver999;
      const now = new Date();

      // Update in-memory state directly
      this.currentRates = {
        gold: {
          gold24k,
          gold22k,
          gold18k,
          previous24k: prevGold24k,
          change24k: goldDiff,
          changePercentage24k: goldDiffPct,
          source: MMTCP_SOURCE_LABEL,
          updatedAt: now,
        },
        silver: {
          silver999,
          silver925,
          silverKg,
          previous999: prevSilver999,
          change999: silverDiff,
          changePercentage999: silverDiffPct,
          source: MMTCP_SOURCE_LABEL,
          updatedAt: now,
        },
      };

      // Keep real MMTC-PAMP daily history in memory for benchmark charts
      // (already refreshed inside refreshRates via fetchRateHistory throttle)

      if (changed) {
        logger.info(
          `[RateScraper] In-Memory Live Rates Updated -> 24K Gold: ₹${gold24k}/g | 22K Gold: ₹${gold22k}/g | 18K Gold: ₹${gold18k}/g | 999 Silver: ₹${silver999}/g (₹${silverKg}/kg)`,
        );
      }

      return this.currentRates;
    } catch (error) {
      logger.error("[RateScraper] Refresh error:", error.message);
      return this.currentRates;
    } finally {
      this.isScraping = false;
    }
  }

  /**
   * Get all live rates in-memory
   */
  getLiveRates() {
    return this.currentRates;
  }

  /**
   * Get real MMTC-PAMP daily fixing history (newest-first) for charts
   */
  getGoldRateHistory() {
    return this.rateHistory.gold;
  }

  getSilverRateHistory() {
    return this.rateHistory.silver;
  }

  /**
   * Get live Gold rates in-memory
   */
  getLiveGoldRates() {
    return this.currentRates.gold;
  }

  /**
   * Get live Silver rates in-memory
   */
  getLiveSilverRates() {
    return this.currentRates.silver;
  }

  /**
   * Update Gold rate manually in-memory
   */
  updateManualGoldRate(rateData = {}) {
    const pricePerGram = parseFloat(
      rateData.pricePerGram || rateData.price24k || rateData.rate24k,
    );
    if (pricePerGram && pricePerGram > 0) {
      const prev = this.currentRates.gold.gold24k;
      const change = Math.round((pricePerGram - prev) * 100) / 100;
      const changePct =
        prev > 0 ? Math.round(((pricePerGram - prev) / prev) * 10000) / 100 : 0;

      this.currentRates.gold = {
        gold24k: pricePerGram,
        gold22k: Math.round(pricePerGram * (22 / 24) * 100) / 100,
        gold18k: Math.round(pricePerGram * (18 / 24) * 100) / 100,
        previous24k: prev,
        change24k: change,
        changePercentage24k: changePct,
        source: "MANUAL_ADMIN",
        updatedAt: new Date(),
      };
    }
    return this.currentRates.gold;
  }

  /**
   * Update Silver rate manually in-memory
   */
  updateManualSilverRate(rateData = {}) {
    const pricePerGram = parseFloat(
      rateData.pricePerGram || rateData.price999 || rateData.rate999,
    );
    if (pricePerGram && pricePerGram > 0) {
      const prev = this.currentRates.silver.silver999;
      const change = Math.round((pricePerGram - prev) * 100) / 100;
      const changePct =
        prev > 0 ? Math.round(((pricePerGram - prev) / prev) * 10000) / 100 : 0;

      this.currentRates.silver = {
        silver999: pricePerGram,
        silver925: Math.round(pricePerGram * (925 / 999) * 100) / 100,
        silverKg: Math.round(pricePerGram * 1000 * 100) / 100,
        previous999: prev,
        change999: change,
        changePercentage999: changePct,
        source: "MANUAL_ADMIN",
        updatedAt: new Date(),
      };
    }
    return this.currentRates.silver;
  }

  /**
   * Start recurring background in-memory refresher (every intervalMs, default 5 seconds)
   */
  startScheduler(intervalMs = 5 * 1000) {
    if (this.intervalId) return;

    logger.info(
      `[RateScraper] Starting live rate refresher (every ${intervalMs / 1000}s, purely in-memory)`,
    );

    // Run first refresh immediately
    this.refreshRates();

    this.intervalId = setInterval(() => {
      this.refreshRates();
    }, intervalMs);
  }

  /**
   * Stop recurring scheduler on shutdown
   */
  stopScheduler() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info("[RateScraper] Scheduler stopped.");
    }
  }
}

module.exports = new RateScraperService();
