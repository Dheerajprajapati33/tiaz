import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Card from "../components/common/Card.jsx";
import Badge from "../components/common/Badge.jsx";
import Button from "../components/common/Button.jsx";
import SearchBar from "../components/common/SearchBar.jsx";
import Select from "../components/common/Select.jsx";
import Pagination from "../components/common/Pagination.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import ConfirmDialog from "../components/common/ConfirmDialog.jsx";
import UserDetails from "../components/users/UserDetails.jsx";
import { adminUsersApi, getMediaUrl } from "../services/api.js";
import { formatINR, formatGrams, formatDate } from "../utils/formatters.js";
import { useToast } from "../components/common/Toast.jsx";
import {
  Eye,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  User,
  Users as UsersIcon,
  ShieldCheck,
  Clock,
  UserX
} from "lucide-react";

export default function UsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlStatus = searchParams.get("status");
  const urlKyc = searchParams.get("kyc");

  const { addToast } = useToast();

  // Filter States
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(urlStatus || "All");
  const [kycFilter, setKycFilter] = useState(urlKyc || "All");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Data & Request States
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    totalUsers: 0,
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Selected user for inspection drawer
  const [selectedUser, setSelectedUser] = useState(null);

  // Confirm block dialog target
  const [confirmTarget, setConfirmTarget] = useState(null);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Sync URL parameters when changed outside
  useEffect(() => {
    if (urlStatus && urlStatus !== statusFilter) {
      setStatusFilter(urlStatus);
      setCurrentPage(1);
    }
    if (urlKyc && urlKyc !== kycFilter) {
      setKycFilter(urlKyc);
      setCurrentPage(1);
    }
  }, [urlStatus, urlKyc]);

  // Fetch users from 100% Real Database API
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminUsersApi.getUsers({
        search: debouncedSearch,
        status: statusFilter,
        kycStatus: kycFilter,
        page: currentPage,
        limit: pageSize
      });

      if (response && response.success && response.data) {
        const userList = response.data.users || response.data.items || [];
        setUsers(userList);
        const p = response.data.pagination || {};
        setPagination({
          totalUsers: p.totalItems ?? p.totalUsers ?? userList.length,
          currentPage: p.currentPage || 1,
          totalPages: p.totalPages || 1,
          pageSize: p.limit || p.pageSize || 10,
          hasNextPage: !!p.hasNextPage,
          hasPrevPage: !!p.hasPrevPage
        });
      } else {
        throw new Error(response?.message || "Failed to load customer accounts");
      }
    } catch (err) {
      console.error("Users API fetch error:", err);
      setError(
        err.message ||
          "Failed to connect to users server. Please verify backend service is running."
      );
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, kycFilter, currentPage, pageSize]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Block / Unblock Confirmation
  const handleActionConfirm = async () => {
    if (!confirmTarget) return;
    const willBlock = confirmTarget.status === "Active";
    setActionLoadingId(confirmTarget.rawId || confirmTarget.id);

    try {
      await adminUsersApi.toggleBlockUser(
        confirmTarget.rawId || confirmTarget.id,
        willBlock
      );

      const newStatus = willBlock ? "Blocked" : "Active";
      setUsers((prev) =>
        prev.map((u) =>
          (u.rawId || u.id) === (confirmTarget.rawId || confirmTarget.id)
            ? { ...u, status: newStatus, isBlocked: willBlock }
            : u
        )
      );

      addToast(
        `User ${confirmTarget.name} has been ${willBlock ? "blocked" : "unblocked"} successfully`,
        willBlock ? "error" : "success"
      );
    } catch (err) {
      addToast(err.message || "Failed to change account status", "error");
    } finally {
      setActionLoadingId(null);
      setConfirmTarget(null);
    }
  };

  // Quick KYC Approval or Rejection
  const handleQuickKyc = async (user, newKycStatus) => {
    const targetId = user.rawId || user.id;
    setActionLoadingId(targetId);

    try {
      await adminUsersApi.updateKycStatus(targetId, newKycStatus.toLowerCase());

      setUsers((prev) =>
        prev.map((u) =>
          (u.rawId || u.id) === targetId ? { ...u, kycStatus: newKycStatus } : u
        )
      );

      addToast(
        `KYC for ${user.name} marked as ${newKycStatus}`,
        newKycStatus === "Verified" ? "success" : "error"
      );
    } catch (err) {
      addToast(err.message || "Failed to update KYC status", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Sync drawer update back into local list
  const handleUserUpdatedInDrawer = (userId, updates) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId || u.rawId === userId ? { ...u, ...updates } : u))
    );
    if (selectedUser && (selectedUser.id === userId || selectedUser.rawId === userId)) {
      setSelectedUser((prev) => ({ ...prev, ...updates }));
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("All");
    setKycFilter("All");
    setCurrentPage(1);
    setSearchParams({});
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Realtime Customer Count */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          User Accounts
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage account permissions, KYC tiers, vault holdings, and activity logs.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <Card bodyClassName="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2">
            <SearchBar
              value={search}
              onChange={(v) => {
                setSearch(v);
              }}
              placeholder="Search by user name, ID, mobile, or email..."
            />
          </div>

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { value: "All", label: "All Statuses" },
              { value: "Active", label: "Active Investors" },
              { value: "Blocked", label: "Blocked Accounts" },
            ]}
          />

          <Select
            value={kycFilter}
            onChange={(e) => {
              setKycFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { value: "All", label: "All KYC Statuses" },
              { value: "Pending", label: "Pending Review" },
              { value: "Verified", label: "Verified" },
              { value: "Rejected", label: "Rejected" },
            ]}
          />
        </div>
      </Card>

      {/* Error Banner */}
      {error && !loading && (
        <Card bodyClassName="p-6 text-center">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Failed to Load Users</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">{error}</p>
            </div>
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchUsers}>
              Retry Connection
            </Button>
          </div>
        </Card>
      )}

      {/* Users Table */}
      {!error && (
        <Card bodyClassName="p-0 overflow-x-auto">
          {loading ? (
            /* Skeleton Loading State */
            <div className="p-4 space-y-3">
              <div className="h-9 bg-slate-100/80 rounded-lg animate-pulse" />
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between px-4 gap-4 animate-pulse"
                >
                  <div className="h-4 w-14 bg-slate-200 rounded" />
                  <div className="space-y-1.5 flex-1 max-w-[160px]">
                    <div className="h-3.5 bg-slate-200 rounded w-28" />
                    <div className="h-2.5 bg-slate-150 rounded w-16" />
                  </div>
                  <div className="space-y-1.5 flex-1 max-w-[180px]">
                    <div className="h-3 bg-slate-200 rounded w-24" />
                    <div className="h-2.5 bg-slate-150 rounded w-36" />
                  </div>
                  <div className="h-6 w-20 bg-slate-200 rounded-full" />
                  <div className="h-4 w-16 bg-slate-200 rounded" />
                  <div className="h-4 w-20 bg-slate-200 rounded" />
                  <div className="h-6 w-16 bg-slate-200 rounded-full" />
                  <div className="h-3 w-20 bg-slate-200 rounded" />
                  <div className="h-8 w-24 bg-slate-200 rounded-lg" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            /* Empty State */
            <EmptyState
              title={
                search || statusFilter !== "All" || kycFilter !== "All"
                  ? "No users match the criteria"
                  : "No registered investors found"
              }
              description={
                search || statusFilter !== "All" || kycFilter !== "All"
                  ? "Try clearing your search query or filters to view all customer accounts."
                  : "Real customer accounts will appear here automatically when users register."
              }
              actionLabel={
                search || statusFilter !== "All" || kycFilter !== "All"
                  ? "Reset All Filters"
                  : "Refresh Table"
              }
              onAction={
                search || statusFilter !== "All" || kycFilter !== "All"
                  ? handleResetFilters
                  : fetchUsers
              }
            />
          ) : (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Name & Role</th>
                  <th className="py-3 px-4">Contact Details</th>
                  <th className="py-3 px-4">KYC Status</th>
                  <th className="py-3 px-4 text-right">Gold Balance</th>
                  <th className="py-3 px-4 text-right">Total Invested</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Created At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isBusy = actionLoadingId === (u.rawId || u.id);

                  return (
                    <tr
                      key={u.rawId || u.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-800">
                        {u.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="relative shrink-0 w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shadow-2xs">
                            {u.profileImage ? (
                              <img
                                src={getMediaUrl(u.profileImage)}
                                alt={u.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  if (e.target.nextElementSibling) {
                                    e.target.nextElementSibling.style.display = 'flex';
                                  }
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full items-center justify-center text-slate-400 ${u.profileImage ? 'hidden' : 'flex'}`}>
                              <User className="w-4 h-4" />
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-xs">
                              {u.name}
                            </p>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {u.role}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-slate-900 font-mono text-[11px]">
                          {u.mobile}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
                          {u.email}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge status={u.kycStatus} />
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 tabular-nums">
                        {formatGrams(u.goldBalance || 0)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-900 tabular-nums">
                        {formatINR(u.totalInvested || 0)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge status={u.status} />
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-slate-500">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={Eye}
                            disabled={isBusy}
                            onClick={() => setSelectedUser(u)}
                          >
                            Inspect
                          </Button>

                          {/* Quick KYC Verification Actions */}
                          {u.kycStatus === "Pending" && (
                            <>
                              <button
                                disabled={isBusy}
                                onClick={() => handleQuickKyc(u, "Verified")}
                                title="Accept / Verify KYC"
                                className="p-1.5 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                disabled={isBusy}
                                onClick={() => handleQuickKyc(u, "Rejected")}
                                title="Reject KYC"
                                className="p-1.5 rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {/* If KYC was Rejected, allow quick re-approval */}
                          {u.kycStatus === "Rejected" && (
                            <button
                              disabled={isBusy}
                              onClick={() => handleQuickKyc(u, "Verified")}
                              title="Re-approve KYC"
                              className="p-1.5 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Block / Unblock: Available for all customers */}
                          <button
                            disabled={isBusy}
                            onClick={() => setConfirmTarget(u)}
                            title={
                              u.status === "Active" ? "Block user" : "Unblock user"
                            }
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-50 ${
                              u.status === "Active"
                                ? "border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100"
                                : "border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                            }`}
                          >
                            {u.status === "Active" ? (
                              <Lock className="w-3.5 h-3.5" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Real Pagination Component */}
          {!loading && users.length > 0 && (
            <Pagination
              currentPage={pagination.currentPage || currentPage}
              totalItems={pagination.totalUsers || users.length}
              pageSize={pagination.pageSize || pageSize}
              onPageChange={(newPage) => {
                setCurrentPage(newPage);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}
        </Card>
      )}

      {/* User Details Drawer */}
      <UserDetails
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        onUserUpdate={handleUserUpdatedInDrawer}
      />

      {/* Confirmation Dialog for Block/Unblock */}
      <ConfirmDialog
        isOpen={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleActionConfirm}
        title={
          confirmTarget?.status === "Active"
            ? "Block User Account?"
            : "Unblock User Account?"
        }
        message={
          confirmTarget?.status === "Active"
            ? `Are you sure you want to block ${confirmTarget?.name} (${confirmTarget?.id})? They will be prevented from placing gold purchase and sell orders.`
            : `Are you sure you want to reactivate ${confirmTarget?.name} (${confirmTarget?.id})? Normal trading privileges will be restored.`
        }
        confirmText={
          confirmTarget?.status === "Active" ? "Yes, Block Account" : "Yes, Unblock"
        }
        variant={confirmTarget?.status === "Active" ? "danger" : "primary"}
      />
    </div>
  );
}
