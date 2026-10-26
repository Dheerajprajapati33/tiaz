import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import StatCard from "../components/dashboard/StatCard.jsx";
import GoldChart from "../components/dashboard/GoldChart.jsx";
import SilverChart from "../components/dashboard/SilverChart.jsx";
import TransactionChart from "../components/dashboard/TransactionChart.jsx";
import UserGrowthChart from "../components/dashboard/UserGrowthChart.jsx";
import KycChart from "../components/dashboard/KycChart.jsx";
import Card from "../components/common/Card.jsx";
import Badge from "../components/common/Badge.jsx";
import Button from "../components/common/Button.jsx";
import { dashboardApi } from "../services/api.js";
import { useLiveQuery } from "../hooks/useLiveQuery.js";
import { formatINR, formatGrams, formatDate } from "../utils/formatters.js";
import {
  Users,
  UserCheck,
  Clock,
  CheckCircle,
  Coins,
  Disc,
  TrendingUp,
  ArrowDownLeft,
  ArrowLeftRight,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Inbox,
  ShoppingBag,
  PhoneCall,
} from "lucide-react";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [assetFilter, setAssetFilter] = useState("gold"); // 'gold' | 'silver'

  // React Query Pattern - Live background auto-polling every 8 seconds
  const {
    data: dashboardData,
    loading,
    isFetching,
    error,
    refetch: fetchDashboard,
  } = useLiveQuery({
    queryKey: ["admin-dashboard", assetFilter],
    queryFn: () => dashboardApi.getAdminDashboard(assetFilter, "1M"),
    refetchInterval: 3000,
  });

  const handleAssetChange = (newAsset) => {
    if (newAsset !== assetFilter) {
      setAssetFilter(newAsset);
    }
  };

  // Safely extract stats with zero fallbacks
  const userStats = dashboardData?.userStats || {
    formattedTotalUsers: "0",
    userChange: "+0.0% MoM",
    formattedActiveUsers: "0",
    activeRatio: "0% active ratio",
    pendingKyc: 0,
    pendingKycBadge: "Queue priority",
    pendingKycChange: "All clear",
    formattedVerifiedKyc: "0",
    kycPassRate: "0% pass rate",
  };

  const assetStats = dashboardData?.assetStats || {
    holdings: {
      title: assetFilter === "gold" ? "Gold Holdings" : "Silver Holdings",
      value: "0.00 GM",
      subvalue: "≈ ₹0.00",
      change: "+0.00 GM this week",
      trend: "neutral",
    },
    totalPurchased: {
      title: "Total Purchased",
      value: "₹0.00",
      subvalue: "0.00 GM",
      change: "+0.0% this month",
      trend: "neutral",
    },
    totalSold: {
      title: "Total Sold",
      value: "₹0.00",
      subvalue: "0.00 GM",
      change: "Liquid payouts cleared",
      trend: "neutral",
    },
    transactions: {
      title:
        assetFilter === "gold" ? "Gold Transactions" : "Silver Transactions",
      value: "0",
      change: "99.8% Gateway SLA",
      trend: "neutral",
    },
  };

  const liveRate =
    dashboardData?.rates?.buyPricePerGram ||
    dashboardData?.rates?.actualPricePerGram ||
    (assetFilter === "gold" ? 7509.92 : 97.13);
  const recentTransactions = dashboardData?.recentTransactions || [];
  const buyVsSellVolume = dashboardData?.charts?.buyVsSellVolume;
  const userGrowth = dashboardData?.charts?.userGrowth;
  const kycDistribution = dashboardData?.charts?.kycDistribution;

  return (
    <div className="space-y-6">
      {/* Top Asset Filter & Dropdown View Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Bullion Asset Overview
            </h2>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border transition-colors ${
                assetFilter === "gold"
                  ? "bg-amber-50 text-amber-900 border-amber-300"
                  : "bg-slate-100 text-slate-800 border-slate-300"
              }`}
            >
              {assetFilter === "gold"
                ? "🟡 24K Digital Gold"
                : "⚪ 999 Fine Silver"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Filter dashboard metrics, price benchmark charts, and transaction
            volume by bullion asset.
          </p>
        </div>

        {/* Metal Filter Segmented Toggle & Refresh */}
        <div className="flex items-center gap-2">
          {/* Realtime Live Sync Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200/90 rounded-xl text-emerald-800 text-[11px] font-bold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isFetching ? "Syncing..." : "Live Feed"}</span>
          </div>

          <button
            type="button"
            onClick={() => fetchDashboard()}
            disabled={loading}
            title="Refresh dashboard metrics"
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${isFetching || loading ? "animate-spin text-amber-600" : ""}`}
            />
          </button>

          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => handleAssetChange("gold")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                assetFilter === "gold"
                  ? "bg-white text-amber-950 shadow-xs border border-amber-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-[#B45309]" />
              <span>Gold</span>
            </button>
            <button
              type="button"
              onClick={() => handleAssetChange("silver")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                assetFilter === "silver"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-300"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Disc className="w-3.5 h-3.5 text-slate-600" />
              <span>Silver</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner with Retry */}
      {error && (
        <div className="flex items-center justify-between gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-rose-300 text-rose-900 hover:bg-rose-100"
            onClick={() => fetchDashboard(assetFilter)}
          >
            Try Again
          </Button>
        </div>
      )}

      {/* 8 Top Summary Stat Cards (Skeleton or Live Content) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        {loading && !dashboardData ? (
          // Skeleton loader for 8 Stat Cards
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs animate-pulse space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="h-3 bg-slate-200 rounded w-20"></div>
                <div className="w-8 h-8 rounded-lg bg-slate-200"></div>
              </div>
              <div className="h-7 bg-slate-200 rounded w-28"></div>
              <div className="h-3 bg-slate-100 rounded w-16"></div>
            </div>
          ))
        ) : (
          <>
            {/* User Stats (Platform Wide) */}
            <StatCard
              title="Total Users"
              value={userStats.formattedTotalUsers}
              change={userStats.userChange}
              trend="up"
              icon={Users}
              onClick={() => navigate("/users")}
            />
            <StatCard
              title="Active Users"
              value={userStats.formattedActiveUsers}
              change={userStats.activeRatio}
              trend="neutral"
              icon={UserCheck}
              onClick={() => navigate("/users?status=Active")}
            />
            <StatCard
              title="KYC Pending"
              value={userStats.pendingKyc}
              badgeText={userStats.pendingKycBadge}
              change={userStats.pendingKycChange}
              trend={userStats.pendingKyc > 0 ? "down" : "neutral"}
              icon={Clock}
              onClick={() => navigate("/users?kyc=Pending")}
            />
            <StatCard
              title="KYC Verified"
              value={userStats.formattedVerifiedKyc}
              change={userStats.kycPassRate}
              trend="up"
              icon={CheckCircle}
              onClick={() => navigate("/users?kyc=Verified")}
            />

            {/* Dynamic Bullion Asset Stats (Gold / Silver) */}
            <StatCard
              title={assetStats.holdings.title}
              value={assetStats.holdings.value}
              subvalue={assetStats.holdings.subvalue}
              change={assetStats.holdings.change}
              trend={assetStats.holdings.trend}
              icon={assetFilter === "gold" ? Coins : Disc}
              onClick={() =>
                navigate(assetFilter === "gold" ? "/gold" : "/silver")
              }
            />
            <StatCard
              title={assetStats.totalPurchased.title}
              value={assetStats.totalPurchased.value}
              subvalue={assetStats.totalPurchased.subvalue}
              change={assetStats.totalPurchased.change}
              trend={assetStats.totalPurchased.trend}
              icon={TrendingUp}
              onClick={() =>
                navigate(assetFilter === "gold" ? "/gold" : "/silver")
              }
            />
            <StatCard
              title={assetStats.totalSold.title}
              value={assetStats.totalSold.value}
              subvalue={assetStats.totalSold.subvalue}
              change={assetStats.totalSold.change}
              trend={assetStats.totalSold.trend}
              icon={ArrowDownLeft}
              onClick={() =>
                navigate(assetFilter === "gold" ? "/gold" : "/silver")
              }
            />
            <StatCard
              title={assetStats.transactions.title}
              value={assetStats.transactions.value}
              change={assetStats.transactions.change}
              trend={assetStats.transactions.trend}
              icon={ArrowLeftRight}
              onClick={() => navigate("/transactions")}
            />
          </>
        )}
      </div>

      {/* Physical Buy Purchase Request Alert Banner */}
      <div className="bg-linear-to-r from-amber-500/10 via-amber-50/50 to-emerald-50/60 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
            <ShoppingBag className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">
                Physical Bullion Purchase Requests
              </h4>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                Call Verification Flow
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Review physical orders (Coins & Bars), call customers to verify
              requirement, and update dispatch/delivery.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/orders")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Open Purchase Requests</span>
        </button>
      </div>

      {/* Row 1: Charts - Bullion Price Benchmark & Buy vs Sell Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading && !dashboardData ? (
          <>
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 h-80 animate-pulse flex flex-col justify-between">
              <div className="h-5 bg-slate-200 rounded w-48"></div>
              <div className="h-48 bg-slate-100 rounded-xl"></div>
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 h-80 animate-pulse flex flex-col justify-between">
              <div className="h-5 bg-slate-200 rounded w-48"></div>
              <div className="h-48 bg-slate-100 rounded-xl"></div>
            </div>
          </>
        ) : (
          <>
            {assetFilter === "gold" ? (
              <GoldChart currentRate={liveRate} />
            ) : (
              <SilverChart currentRate={liveRate} />
            )}

            <TransactionChart
              data={buyVsSellVolume}
              assetName={assetFilter === "gold" ? "Gold" : "Silver"}
              buyColor={assetFilter === "gold" ? "#D4AF37" : "#64748B"}
              sellColor={assetFilter === "gold" ? "#10B981" : "#0D9488"}
            />
          </>
        )}
      </div>

      {/* Row 2: Charts - User Growth & KYC Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading && !dashboardData ? (
          <>
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 h-80 animate-pulse flex flex-col justify-between">
              <div className="h-5 bg-slate-200 rounded w-48"></div>
              <div className="h-48 bg-slate-100 rounded-xl"></div>
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 h-80 animate-pulse flex flex-col justify-between">
              <div className="h-5 bg-slate-200 rounded w-48"></div>
              <div className="h-48 bg-slate-100 rounded-xl"></div>
            </div>
          </>
        ) : (
          <>
            <UserGrowthChart data={userGrowth} />
            <KycChart data={kycDistribution} />
          </>
        )}
      </div>

      {/* Dynamic Recent Transactions Table */}
      <Card
        title={
          assetFilter === "gold"
            ? "Recent Gold Transactions"
            : "Recent Silver Transactions"
        }
        subtitle={
          assetFilter === "gold"
            ? "Live audit stream across 24K digital gold customer orders and physical purchases"
            : "Live audit stream across 999 Fine Silver customer acquisitions and physical purchases"
        }
        action={
          <div className="flex items-center gap-2">
            <Link to={assetFilter === "gold" ? "/gold" : "/silver"}>
              <Button variant="outline" size="sm">
                View {assetFilter === "gold" ? "Gold" : "Silver"} Custody
              </Button>
            </Link>
            <Link to="/transactions">
              <Button variant="ghost" size="sm" icon={ExternalLink}>
                Full Ledger
              </Button>
            </Link>
          </div>
        }
        bodyClassName="p-0 overflow-x-auto"
      >
        {loading && !dashboardData ? (
          // Skeleton table rows
          <div className="p-6 space-y-4 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-4 py-2 border-b border-slate-100"
              >
                <div className="h-4 bg-slate-200 rounded w-28"></div>
                <div className="h-4 bg-slate-200 rounded w-36"></div>
                <div className="h-4 bg-slate-200 rounded w-20"></div>
                <div className="h-4 bg-slate-200 rounded w-24"></div>
                <div className="h-4 bg-slate-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : recentTransactions.length === 0 ? (
          // Clean Zero State / No Data Found
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3 shadow-xs">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              No {assetFilter === "gold" ? "Gold" : "Silver"} Transactions Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              There are currently 0 transactions recorded for{" "}
              {assetFilter === "gold" ? "24K Gold" : "999 Silver"}. New
              purchases and sells will appear here in real-time.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">
                  {assetFilter === "gold" ? "Gold Qty" : "Silver Qty"}
                </th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTransactions.map((txn) => (
                <tr
                  key={txn.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {txn.id}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">
                      {txn.userName}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {txn.userId}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                        txn.type.includes("Buy")
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {txn.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">
                    {formatGrams(
                      assetFilter === "gold"
                        ? txn.goldQuantity
                        : txn.silverQuantity,
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-900 tabular-nums">
                    {formatINR(txn.amount)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge status={txn.status} />
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-[11px] text-slate-500">
                    {formatDate(txn.date, true)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => navigate("/transactions")}
                      className="text-xs text-amber-700 hover:text-amber-800 hover:underline font-semibold cursor-pointer"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
