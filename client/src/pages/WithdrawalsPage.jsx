import React, { useState, useEffect, useCallback } from "react";
import Card from "../components/common/Card.jsx";
import Badge from "../components/common/Badge.jsx";
import Button from "../components/common/Button.jsx";
import SearchBar from "../components/common/SearchBar.jsx";
import Select from "../components/common/Select.jsx";
import Pagination from "../components/common/Pagination.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import Modal from "../components/common/Modal.jsx";
import StatCard from "../components/dashboard/StatCard.jsx";
import { withdrawalsApi } from "../services/api.js";
import { formatINR, formatDate } from "../utils/formatters.js";
import { useToast } from "../components/common/Toast.jsx";
import {
  Landmark,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  AlertCircle,
  Smartphone,
  ShieldCheck,
  PhoneCall,
  Mail,
  Banknote,
} from "lucide-react";

const STATUS_TABS = [
  { id: "ALL", label: "All Requests" },
  { id: "PENDING", label: "Pending" },
  { id: "APPROVED", label: "Approved" },
  { id: "REJECTED", label: "Rejected" },
];

export default function WithdrawalsPage() {
  const { addToast } = useToast();

  const [withdrawals, setWithdrawals] = useState([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingCount: 0,
    pendingAmount: 0,
    approvedCount: 0,
    approvedAmount: 0,
    rejectedCount: 0,
    rejectedAmount: 0,
  });
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchWithdrawals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await withdrawalsApi.getWithdrawals({
        search: debouncedSearch,
        status: statusFilter,
        page: currentPage,
        limit: pageSize,
      });
      if (res.success && res.data) {
        setWithdrawals(res.data.items || []);
        if (res.data.stats) setStats(res.data.stats);
        if (res.data.pagination) setPagination(res.data.pagination);
      } else {
        throw new Error(res.message || "Failed to fetch withdrawal requests");
      }
    } catch (err) {
      console.error("Error fetching withdrawals:", err);
      setError(err.message || "Unable to connect to withdrawal service");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, currentPage, pageSize]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const handleApprove = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      const res = await withdrawalsApi.approveWithdrawal(selected.id, {
        adminNotes: rejectReason.trim(),
      });
      if (res.success) {
        addToast(res.message || "Withdrawal approved", "success");
        setSelected(null);
        setRejectReason("");
        fetchWithdrawals();
      } else {
        throw new Error(res.message || "Failed to approve withdrawal");
      }
    } catch (err) {
      console.error("Approve error:", err);
      addToast(err.message || "Failed to approve withdrawal", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    if (!rejectReason.trim()) {
      addToast("Please provide a rejection reason", "warning");
      return;
    }
    setActionLoading(true);
    try {
      const res = await withdrawalsApi.rejectWithdrawal(selected.id, {
        reason: rejectReason.trim(),
        adminNotes: rejectReason.trim(),
      });
      if (res.success) {
        addToast(res.message || "Withdrawal rejected & refunded", "success");
        setSelected(null);
        setRejectReason("");
        fetchWithdrawals();
      } else {
        throw new Error(res.message || "Failed to reject withdrawal");
      }
    } catch (err) {
      console.error("Reject error:", err);
      addToast(err.message || "Failed to reject withdrawal", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const openDetail = (w) => {
    setSelected(w);
    setRejectReason("");
  };

  const hasActiveFilters =
    debouncedSearch.trim() !== "" || statusFilter !== "ALL";
  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("ALL");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Cash Withdrawal Requests
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review, approve, or reject customer payout requests to their linked
            bank / UPI accounts.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={fetchWithdrawals}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Requests"
          value={stats.totalRequests.toLocaleString()}
          change="All withdrawal activity"
          trend="neutral"
          icon={Banknote}
        />
        <StatCard
          title="Pending"
          value={stats.pendingCount.toLocaleString()}
          subvalue={formatINR(stats.pendingAmount, true)}
          change="Awaiting admin action"
          trend="neutral"
          icon={Clock}
        />
        <StatCard
          title="Approved"
          value={formatINR(stats.approvedAmount, true)}
          subvalue={`${stats.approvedCount.toLocaleString()} payouts`}
          change="Settled to customers"
          trend="up"
          icon={CheckCircle2}
        />
        <StatCard
          title="Rejected"
          value={formatINR(stats.rejectedAmount, true)}
          subvalue={`${stats.rejectedCount.toLocaleString()} refunded`}
          change="Returned to wallet"
          trend="down"
          icon={XCircle}
        />
      </div>

      {/* Filters */}
      <Card className="p-4 bg-white border border-slate-200 space-y-3.5 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex-1 min-w-[220px]">
            <SearchBar
              value={search}
              onChange={(val) => setSearch(val)}
              placeholder="Search by withdrawal #, customer name, mobile, email..."
              className="w-full text-xs"
            />
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: "ALL", label: "All Statuses" },
                { value: "PENDING", label: "Pending" },
                { value: "APPROVED", label: "Approved" },
                { value: "REJECTED", label: "Rejected" },
                { value: "PAID", label: "Paid" },
              ]}
              className="text-xs min-w-[150px]"
            />
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="outline"
                onClick={resetFilters}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
            Quick Filter:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 max-w-full text-xs font-medium">
            {STATUS_TABS.map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg transition-all shrink-0 cursor-pointer text-xs font-semibold ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && !isLoading && (
        <Card bodyClassName="p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Failed to load withdrawal requests
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md">{error}</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchWithdrawals}
              icon={RefreshCw}
            >
              Retry Loading
            </Button>
          </div>
        </Card>
      )}

      {/* Table */}
      {!error && (
        <Card bodyClassName="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4 py-3 animate-pulse"
                >
                  <div className="w-28 h-4 bg-slate-200 rounded" />
                  <div className="w-36 h-4 bg-slate-200 rounded" />
                  <div className="w-28 h-4 bg-slate-200 rounded" />
                  <div className="w-20 h-4 bg-slate-200 rounded" />
                  <div className="w-20 h-4 bg-slate-200 rounded" />
                  <div className="w-24 h-4 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={Landmark}
                title="No withdrawal requests found"
                description={
                  hasActiveFilters
                    ? "No withdrawal requests match the selected filters. Try clearing some filters."
                    : "Customers have not requested any cash withdrawals yet."
                }
                actionLabel={hasActiveFilters ? "Clear All Filters" : undefined}
                onAction={hasActiveFilters ? resetFilters : undefined}
              />
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Withdrawal #</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Payout Destination</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3">Requested</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {withdrawals.map((w) => {
                  const isPending = w.status === "PENDING";
                  return (
                    <tr
                      key={w.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-800 whitespace-nowrap">
                        <span
                          className="hover:text-amber-950 hover:underline cursor-pointer"
                          onClick={() => openDetail(w)}
                        >
                          {w.withdrawalNumber}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <p className="font-semibold text-slate-900 text-xs">
                          {w.user?.fullName || "Customer"}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {w.user?.mobile || "—"}
                        </p>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {w.payoutMethod === "UPI" ? (
                            <Smartphone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          ) : (
                            <Landmark className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          )}
                          <div>
                            <p className="font-semibold text-slate-800 text-[11px]">
                              {w.payoutMethod === "UPI"
                                ? w.upiId
                                : w.bankName || "Bank Transfer"}
                            </p>
                            {w.payoutMethod !== "UPI" && (
                              <p className="text-[10px] text-slate-500">
                                ****{w.accountNumberLast4 || "XXXX"}
                                {w.ifsc ? ` · ${w.ifsc}` : ""}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 tabular-nums whitespace-nowrap">
                        {formatINR(w.amount)}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <Badge status={w.status} />
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-600 whitespace-nowrap">
                        {formatDate(w.createdAt, true)}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Eye}
                          onClick={() => openDetail(w)}
                          className="cursor-pointer text-xs font-semibold"
                        >
                          {isPending ? "Review" : "View"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {!isLoading && withdrawals.length > 0 && (
            <div className="border-t border-slate-200">
              <Pagination
                currentPage={pagination.currentPage || currentPage}
                totalItems={pagination.totalItems || withdrawals.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </Card>
      )}

      {/* Detail / Review Modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Withdrawal Request Details"
        subtitle={
          selected
            ? `${selected.withdrawalNumber} · Requested ${formatDate(selected.createdAt, true)}`
            : ""
        }
        maxWidth="max-w-lg"
        footer={
          selected && selected.status === "PENDING" ? (
            <div className="flex items-center justify-end gap-3 w-full">
              <Button
                variant="danger"
                onClick={handleReject}
                disabled={actionLoading}
                icon={XCircle}
              >
                Reject &amp; Refund
              </Button>
              <Button
                variant="primary"
                onClick={handleApprove}
                disabled={actionLoading}
                icon={CheckCircle2}
              >
                Approve Payout
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-end w-full">
              <Button variant="secondary" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>
          )
        }
      >
        {selected && (
          <div className="space-y-4 text-xs">
            {/* Amount header */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">
                  Withdrawal Amount
                </span>
                <p className="text-2xl font-extrabold text-slate-900 tabular-nums mt-0.5">
                  {formatINR(selected.amount)}
                </p>
              </div>
              <Badge status={selected.status} size="md" />
            </div>

            {/* Customer */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
              <h4 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-1.5">
                Customer Details
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">
                    Full Name
                  </span>
                  <span className="font-semibold text-slate-900">
                    {selected.user?.fullName || "Customer"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">
                    Mobile
                  </span>
                  <span className="font-medium text-slate-800 flex items-center gap-1">
                    <PhoneCall className="w-3 h-3 text-slate-400" />
                    {selected.user?.mobile || "—"}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px]">
                    Email
                  </span>
                  <span className="font-medium text-slate-800 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    {selected.user?.email || "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Payout destination */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
              <h4 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-amber-700" />
                Payout Destination
              </h4>
              {selected.payoutMethod === "UPI" ? (
                <div className="space-y-1">
                  <span className="text-slate-400 block text-[10px]">
                    UPI ID
                  </span>
                  <span className="font-mono font-semibold text-slate-900">
                    {selected.upiId || "—"}
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      Bank
                    </span>
                    <span className="font-semibold text-slate-900">
                      {selected.bankName || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      Account Holder
                    </span>
                    <span className="font-medium text-slate-800">
                      {selected.accountHolderName || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      Account No.
                    </span>
                    <span className="font-mono text-slate-800">
                      ****{selected.accountNumberLast4 || "XXXX"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      IFSC
                    </span>
                    <span className="font-mono text-slate-800">
                      {selected.ifsc || "—"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Wallet snapshot */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">
                  Wallet Before
                </span>
                <span className="font-semibold text-slate-900">
                  {formatINR(selected.balanceBefore)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">
                  Wallet After (Held)
                </span>
                <span className="font-semibold text-slate-900">
                  {formatINR(selected.balanceAfter)}
                </span>
              </div>
            </div>

            {/* Outcome info for non-pending */}
            {selected.status !== "PENDING" && (
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-[11px] space-y-1">
                <p className="font-bold text-amber-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {selected.status === "REJECTED"
                    ? "Rejected"
                    : "Processed"} on {formatDate(selected.processedAt, true)}
                </p>
                {selected.rejectionReason && (
                  <p className="text-slate-600">
                    Reason: {selected.rejectionReason}
                  </p>
                )}
                {selected.adminNotes && (
                  <p className="text-slate-600">Notes: {selected.adminNotes}</p>
                )}
              </div>
            )}

            {/* Action input for pending */}
            {selected.status === "PENDING" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Note / Rejection Reason (optional for approve, required for
                  reject)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={2}
                  placeholder="e.g. Paid via IMPS, UTR 1234567890 — or reason for rejection"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  On reject, the held amount is instantly refunded to the
                  customer's wallet.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
