import React, { useState, useEffect } from "react";
import Card from "../components/common/Card.jsx";
import Badge from "../components/common/Badge.jsx";
import Button from "../components/common/Button.jsx";
import StatCard from "../components/dashboard/StatCard.jsx";
import GoldChart from "../components/dashboard/GoldChart.jsx";
import { bullionApi } from "../services/api.js";
import { useLiveQuery } from "../hooks/useLiveQuery.js";
import { formatINR, formatDate } from "../utils/formatters.js";
import {
  Coins,
  TrendingUp,
  ArrowDownLeft,
  Shield,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export default function GoldOverviewPage() {
  // Live auto-polling every 5 seconds via React Query (cached data renders instantly)
  const {
    data,
    loading,
    isFetching,
    error,
    refetch: fetchGoldData,
  } = useLiveQuery({
    queryKey: ["admin-gold-overview"],
    queryFn: () => bullionApi.getGoldOverview(),
    refetchInterval: 2000,
  });

  // Forces the server to re-scrape MMTC-PAMP right now, then pulls the fresh overview
  const forceRefresh = async () => {
    try {
      await bullionApi.getGoldOverview(true);
    } catch (e) {
      // fall through to normal cached refetch
    }
    fetchGoldData();
  };

  const purityRates = data?.purityRates || [];
  const rate24K = purityRates.find(
    (r) => r.purity === "24K" || r.rawPurity === "24K",
  ) ||
    purityRates[0] || {
      buyRate: 0,
      sellRate: 0,
      change: 0,
      changePercentage: 0,
    };
  const rate22K = purityRates.find(
    (r) => r.purity === "22K" || r.rawPurity === "22K",
  ) ||
    purityRates[1] || {
      buyRate: 0,
      sellRate: 0,
      change: 0,
      changePercentage: 0,
    };
  const rate18K = purityRates.find(
    (r) => r.purity === "18K" || r.rawPurity === "18K",
  ) ||
    purityRates[2] || {
      buyRate: 0,
      sellRate: 0,
      change: 0,
      changePercentage: 0,
    };

  const dayChange = data?.dayChange || {
    formattedAmount: "+₹0.00",
    percentage: 0,
    isPositive: true,
  };

  const stats = data?.stats || {
    totalHeld: {
      value: "0.00 GM",
      subvalue: "≈ ₹0.00",
      change: "Vault insured",
      trend: "neutral",
    },
    totalPurchased: {
      value: "₹0.00",
      subvalue: "0.00 GM cumulative",
      change: "0 orders",
      trend: "neutral",
    },
    totalSold: {
      value: "₹0.00",
      subvalue: "0.00 GM settled",
      change: "Instant IMPS paid",
      trend: "neutral",
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Gold Bullion Overview & Vault Custody
            </h2>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200/90 rounded-xl text-emerald-800 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isFetching ? "Syncing..." : "Live Feed"}</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Physical bullion reserves insured in Brinks & Sequel vaults,
            benchmarked against live market feeds.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={forceRefresh}
          disabled={loading || isFetching}
          className="flex items-center gap-1.5 text-xs border-slate-200 shrink-0"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-amber-600" : ""}`}
          />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Error state with retry */}
      {error && !loading && (
        <Card bodyClassName="p-6 text-center">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Failed to Load Gold Overview
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {error}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={fetchGoldData}
            >
              Retry Connection
            </Button>
          </div>
        </Card>
      )}

      {/* 4 Live Bullion Rate Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-28 bg-white border border-slate-200/90 rounded-2xl p-4 animate-pulse space-y-2.5"
            >
              <div className="h-3 w-16 bg-slate-200 rounded" />
              <div className="h-6 w-24 bg-slate-200 rounded" />
              <div className="h-3 w-20 bg-slate-150 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Live Benchmark (24K)"
            value={formatINR(
              rate24K.actualRate ??
                data?.rates?.actualPricePerGram ??
                rate24K.buyRate,
            )}
            subvalue="/g"
            change="Pure Market Feed"
            trend="neutral"
            icon={Coins}
          />
          <StatCard
            title="Customer Buy Rate"
            value={formatINR(rate24K.buyRate ?? data?.rates?.buyPricePerGram)}
            subvalue="/g"
            change={`+${data?.rateSettings?.goldBuyMarkupPercent ?? data?.rates?.buyMarkupPercentage ?? 5}% Admin Markup`}
            trend="up"
            icon={TrendingUp}
          />
          <StatCard
            title="Customer Sell Rate"
            value={formatINR(rate24K.sellRate ?? data?.rates?.sellPricePerGram)}
            subvalue="/g"
            change={
              (data?.rateSettings?.goldSellDiscountPercent ||
                data?.rates?.sellDiscountPercentage ||
                0) > 0
                ? `-${data?.rateSettings?.goldSellDiscountPercent}% Discount`
                : "Fair Market Payout"
            }
            trend="neutral"
            icon={ArrowDownLeft}
          />
          <StatCard
            title="Day's Change"
            value={dayChange.formattedAmount}
            change="Bullion Index"
            trend={dayChange.isPositive ? "up" : "down"}
            icon={TrendingUp}
          />
        </div>
      )}

      {/* Gold Price Benchmark Chart */}
      <GoldChart
        currentRate={rate24K.buyRate}
        timeframeData={data?.charts?.benchmarkTimeframes}
      />

      {/* Active Purity Benchmark Rates Table */}
      <Card
        title="Active Benchmark Exchange Purity Rates"
        subtitle="Live wholesale spread matrix with Admin Buy Markup & Sell Discount applied"
        bodyClassName="p-0 overflow-x-auto"
      >
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4">Purity Grade</th>
              <th className="py-3.5 px-4">Fineness</th>
              <th className="py-3.5 px-4 text-right">Market Benchmark / g</th>
              <th className="py-3.5 px-4 text-right">Customer Buy Rate / g</th>
              <th className="py-3.5 px-4 text-right">Customer Sell Rate / g</th>
              <th className="py-3.5 px-4 text-right">Day Spread / Change</th>
              <th className="py-3.5 px-4">Price Source</th>
              <th className="py-3.5 px-4">Last Updated</th>
              <th className="py-3.5 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {purityRates.map((r) => (
              <tr
                key={r.purity}
                className="hover:bg-slate-50/80 transition-colors"
              >
                <td className="py-3.5 px-4">
                  <span className="font-extrabold text-amber-900 text-sm">
                    {r.purity}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                  {r.fineness} ({r.finenessValue}/1000)
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-slate-600 tabular-nums">
                  {formatINR(r.actualRate || r.buyRate)}
                </td>
                <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 tabular-nums text-sm">
                  {formatINR(r.buyRate)}
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-emerald-700 tabular-nums">
                  {formatINR(r.sellRate)}
                </td>
                <td className="py-3.5 px-4 text-right tabular-nums">
                  <span className="text-emerald-700 font-semibold">
                    +{formatINR(r.change)} (+{r.changePercentage}%)
                  </span>
                </td>
                <td className="py-3.5 px-4 text-[11px] text-slate-500">
                  {r.source}
                </td>
                <td className="py-3.5 px-4 text-[11px] text-slate-500 whitespace-nowrap">
                  {formatDate(r.updatedAt, true)}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <Badge status={r.status || "Live"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
