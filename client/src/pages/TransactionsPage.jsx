import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Card from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import SearchBar from '../components/common/SearchBar.jsx';
import Select from '../components/common/Select.jsx';
import Pagination from '../components/common/Pagination.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Modal from '../components/common/Modal.jsx';
import StatCard from '../components/dashboard/StatCard.jsx';
import { transactionsApi } from '../services/api.js';
import { formatINR, formatGrams, formatDate } from '../utils/formatters.js';
import {
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  Download,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Coins,
  Package,
  Sparkles,
  MapPin,
  Truck,
  Copy,
  Check,
  FilterX
} from 'lucide-react';
import { useToast } from '../components/common/Toast.jsx';

export default function TransactionsPage() {
  const { addToast } = useToast();

  // State
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalCredits: 0,
    totalDebits: 0,
    totalGoldVolume: 0,
    totalSilverVolume: 0
  });
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [metalFilter, setMetalFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected Transaction for Inspect Modal
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  // Debounce search input by 350ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch transactions from real database API
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await transactionsApi.getTransactions({
        search: debouncedSearch,
        metalType: metalFilter,
        type: typeFilter,
        status: statusFilter,
        page: currentPage,
        limit: pageSize
      });

      if (res.success && res.data) {
        setTransactions(res.data.items || res.data.transactions || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      } else {
        throw new Error(res.message || 'Failed to fetch transactions');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Unable to connect to transactions ledger service');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, metalFilter, typeFilter, statusFilter, currentPage, pageSize]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setMetalFilter('ALL');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    debouncedSearch.trim() !== '' ||
    metalFilter !== 'ALL' ||
    typeFilter !== 'ALL' ||
    statusFilter !== 'ALL';

  // Export Ledger to CSV
  const handleExportCSV = () => {
    if (!transactions || transactions.length === 0) {
      addToast('No transaction records available to export', 'warning');
      return;
    }

    try {
      const headers = [
        'Transaction ID',
        'Date & Time',
        'Customer Name',
        'User ID',
        'Mobile',
        'Metal Type',
        'Buy Type',
        'Type',
        'Direction',
        'Quantity (g)',
        'Rate / g (₹)',
        'Amount (₹)',
        'Status',
        'Reference ID',
        'Description'
      ];

      const rows = transactions.map((t) => [
        `"${t.id || ''}"`,
        `"${formatDate(t.date, true)}"`,
        `"${t.userName || ''}"`,
        `"${t.userId || ''}"`,
        `"${t.userMobile || ''}"`,
        `"${t.metalType || ''}"`,
        `"${t.buyType || ''}"`,
        `"${t.typeLabel || t.type || ''}"`,
        `"${t.direction || ''}"`,
        t.quantity || 0,
        t.rate || 0,
        t.amount || 0,
        `"${t.status || ''}"`,
        `"${t.reference || ''}"`,
        `"${(t.description || '').replace(/"/g, '""')}"`
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `tiaz_transactions_ledger_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addToast('Transaction statement exported successfully', 'success');
    } catch (err) {
      console.error('Export error:', err);
      addToast('Failed to export transactions statement', 'danger');
    }
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    addToast('Transaction ID copied to clipboard', 'info');
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Financial Ledger & Bullion Transactions
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable transaction log across purchases, liquidations, peer transfers, and rewards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchTransactions}
            disabled={isLoading}
          >
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={handleExportCSV}
            disabled={isLoading || transactions.length === 0}
          >
            Export Ledger
          </Button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Transactions"
          value={stats.totalTransactions.toLocaleString()}
          change="Real-time settlement"
          trend="up"
          icon={ArrowLeftRight}
        />
        <StatCard
          title="Total Credits"
          value={formatINR(stats.totalCredits, true)}
          change="Incoming order volume"
          trend="up"
          icon={ArrowDownLeft}
        />
        <StatCard
          title="Total Debits"
          value={formatINR(stats.totalDebits, true)}
          change="Payout & transfer outflows"
          trend="neutral"
          icon={ArrowUpRight}
        />
        <StatCard
          title={metalFilter === 'SILVER' ? 'Total Silver Volume' : 'Total Gold Volume'}
          value={
            metalFilter === 'SILVER'
              ? formatGrams(stats.totalSilverVolume, 'auto')
              : formatGrams(stats.totalGoldVolume, 'auto')
          }
          change={
            metalFilter === 'SILVER'
              ? `${formatGrams(stats.totalGoldVolume, 'auto')} Gold in vault`
              : `${formatGrams(stats.totalSilverVolume, 'auto')} Silver in vault`
          }
          trend="up"
          icon={ShieldCheck}
        />
      </div>

      {/* Filter and Search Bar: Search on Left, Side-by-Side Filters on Right, Quick Tabs underneath */}
      <Card className="p-4 bg-white border border-slate-200 space-y-3.5 shadow-xs">
        {/* Row 1: Search Box (Left) + Dropdown Filters (Right) */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Bar */}
          <div className="flex-1 min-w-[220px]">
            <SearchBar
              value={search}
              onChange={(val) => setSearch(val)}
              placeholder="Search by transaction ID, investor, mobile, reference..."
              className="w-full text-xs"
            />
          </div>

          {/* Dropdown Filters (Strictly Side-by-Side, never upar-neeche) */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Filter 1: Type / Mode (Virtual vs Physical vs Sell) */}
            <Select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Transaction Types' },
                { value: 'VIRTUAL_BUY', label: 'Virtual Buy (Digital)' },
                { value: 'PHYSICAL_BUY', label: 'Physical Buy (Delivery)' },
                { value: 'SELL', label: 'Sell / Liquidation' }
              ]}
              className="text-xs min-w-[160px]"
            />

            {/* Filter 2: Metal Filter */}
            <Select
              value={metalFilter}
              onChange={(e) => {
                setMetalFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Metals' },
                { value: 'GOLD', label: 'Gold 24K' },
                { value: 'SILVER', label: 'Silver 999' }
              ]}
              className="text-xs min-w-[125px]"
            />

            {/* Filter 3: Status Filter */}
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'COMPLETED', label: 'Success / Settled' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'FAILED', label: 'Failed' }
              ]}
              className="text-xs min-w-[130px]"
            />

            {hasActiveFilters && (
              <Button
                size="xs"
                variant="outline"
                onClick={handleResetFilters}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Row 2: Quick Filter Tabs Strip for Virtual & Physical */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Quick Filter:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 max-w-full text-xs font-medium">
            {[
              { id: 'ALL', label: 'All Transactions', icon: ArrowLeftRight },
              { id: 'VIRTUAL_BUY', label: 'Virtual Buy', icon: Sparkles, color: 'blue' },
              { id: 'PHYSICAL_BUY', label: 'Physical Buy', icon: Package, color: 'orange' },
              { id: 'SELL', label: 'Sell', icon: Coins, color: 'purple' }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = typeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setTypeFilter(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg transition-all shrink-0 cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Error State */}
      {error && !isLoading && (
        <Card bodyClassName="p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Failed to load transactions</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md">{error}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={fetchTransactions} icon={RefreshCw}>
              Retry Loading
            </Button>
          </div>
        </Card>
      )}

      {/* Transactions Table */}
      {!error && (
        <Card bodyClassName="p-0 overflow-x-auto">
          {isLoading ? (
            /* Skeleton Loading State */
            <div className="p-4 space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4 py-3 animate-pulse">
                  <div className="w-28 h-4 bg-slate-200 rounded" />
                  <div className="w-36 h-4 bg-slate-200 rounded" />
                  <div className="w-20 h-4 bg-slate-200 rounded" />
                  <div className="w-16 h-4 bg-slate-200 rounded" />
                  <div className="w-20 h-4 bg-slate-200 rounded" />
                  <div className="w-20 h-4 bg-slate-200 rounded" />
                  <div className="w-16 h-4 bg-slate-200 rounded" />
                  <div className="w-16 h-4 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12">
              <EmptyState
                title="No transactions found"
                description={
                  hasActiveFilters
                    ? 'No transaction records match the selected filters. Try clearing some filters.'
                    : 'No customer bullion transactions have been recorded in the system yet.'
                }
                action={
                  hasActiveFilters ? (
                    <Button variant="outline" size="sm" onClick={handleResetFilters} icon={FilterX}>
                      Clear All Filters
                    </Button>
                  ) : null
                }
              />
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Txn ID</th>
                  <th className="py-2.5 px-3">Investor</th>
                  <th className="py-2.5 px-3">Metal</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Direction</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Rate / g</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => {
                  const isGold = t.metalType === 'GOLD';
                  const isSilver = t.metalType === 'SILVER';
                  const isPhysical = t.buyType === 'PHYSICAL';

                  // Shorten long transaction ID for clean display
                  const shortTxnId = t.id && t.id.length > 14
                    ? `${t.id.slice(0, 7)}…${t.id.slice(-5)}`
                    : t.id;

                  return (
                    <tr key={t.id || t.rawId} className="hover:bg-slate-50/80 transition-colors">
                      {/* Shortened Transaction ID */}
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span
                          className="text-amber-800 hover:text-amber-950 hover:underline cursor-pointer"
                          title={`Full ID: ${t.id} (Click to inspect)`}
                          onClick={() => setSelectedTxn(t)}
                        >
                          {shortTxnId}
                        </span>
                      </td>

                      {/* Investor */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <p className="font-semibold text-slate-900 text-xs">{t.userName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {t.userId} {t.userMobile ? `· ${t.userMobile}` : ''}
                        </p>
                      </td>

                      {/* Metal Badge */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {isGold && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100/80 text-amber-900 border border-amber-300">
                            Gold 24K
                          </span>
                        )}
                        {isSilver && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                            Silver 999
                          </span>
                        )}
                        {!isGold && !isSilver && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Wallet INR
                          </span>
                        )}
                      </td>

                      {/* Type */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {isPhysical ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-800 border border-orange-200">
                              <Package className="w-2.5 h-2.5 text-orange-600" />
                              Physical
                            </span>
                          ) : t.type === 'BUY' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                              <Sparkles className="w-2.5 h-2.5 text-blue-600" />
                              Virtual
                            </span>
                          ) : t.type === 'SELL' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                              <Coins className="w-2.5 h-2.5 text-purple-600" />
                              Sell
                            </span>
                          ) : (
                            <span className="font-semibold text-slate-800 text-[11px]">{t.typeLabel || t.type}</span>
                          )}
                        </div>
                      </td>

                      {/* Direction */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-0.5 font-bold text-xs ${
                            t.direction === 'Credit' ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {t.direction === 'Credit' ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          {t.direction}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 tabular-nums whitespace-nowrap">
                        {t.quantity > 0 ? formatGrams(t.quantity) : '—'}
                      </td>

                      {/* Rate / g */}
                      <td className="py-2.5 px-3 text-right tabular-nums text-slate-600 whitespace-nowrap">
                        {t.rate > 0 ? `${formatINR(t.rate)}/g` : '—'}
                      </td>

                      {/* Amount */}
                      <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 tabular-nums whitespace-nowrap">
                        {formatINR(t.amount)}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <Badge status={t.status} />
                      </td>

                      {/* Date & Time */}
                      <td className="py-2.5 px-3 text-[11px] text-slate-600 whitespace-nowrap">
                        <p className="font-medium text-slate-800">{formatDate(t.date, false)}</p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(t.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="xs"
                          icon={Eye}
                          onClick={() => setSelectedTxn(t)}
                          className="cursor-pointer text-xs inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border-slate-300"
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Strictly Page-by-page Pagination Bar */}
          {!isLoading && (
            <div className="border-t border-slate-200">
              <Pagination
                currentPage={currentPage}
                totalItems={pagination.totalItems || transactions.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </Card>
      )}

      {/* Transaction Detail Modal */}
      <Modal
        isOpen={!!selectedTxn}
        onClose={() => setSelectedTxn(null)}
        title="Transaction Ledger Details"
        subtitle={`Logged on ${formatDate(selectedTxn?.date, true)}`}
        maxWidth="max-w-lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-slate-400 font-mono">
              Ref: {selectedTxn?.referenceType || 'System'}
            </span>
            <Button variant="secondary" onClick={() => setSelectedTxn(null)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedTxn && (
          <div className="space-y-4 text-xs">
            {/* Top Status Header */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {selectedTxn.id}
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedTxn.id)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                    title="Copy Transaction ID"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Category:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedTxn.typeLabel || selectedTxn.type} ({selectedTxn.direction})
                  </span>
                </div>
              </div>
              <Badge status={selectedTxn.status} size="md" />
            </div>

            {/* 2 Stat Highlights */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                <span className="text-amber-900 font-bold uppercase text-[10px]">
                  {selectedTxn.metalType} Quantity
                </span>
                <p className="text-lg font-extrabold text-slate-900 tabular-nums mt-0.5">
                  {selectedTxn.quantity > 0 ? formatGrams(selectedTxn.quantity) : '—'}
                </p>
                <p className="text-[10px] text-amber-700 mt-0.5">
                  {selectedTxn.metalType === 'GOLD'
                    ? '24K (99.9% Pure Gold)'
                    : selectedTxn.metalType === 'SILVER'
                    ? '999 Fine Pure Silver'
                    : 'Fiat Wallet'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 uppercase text-[10px] font-semibold">
                  Transaction Amount
                </span>
                <p className="text-lg font-extrabold text-slate-900 tabular-nums mt-0.5">
                  {formatINR(selectedTxn.amount)}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Settled via {selectedTxn.direction === 'Credit' ? 'Wallet / Bank Payout' : 'Gateway / Wallet'}
                </p>
              </div>
            </div>

            {/* Investor Information */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5 shadow-xs">
              <h4 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-1.5 flex items-center justify-between">
                <span>Investor Details</span>
                <span className="font-mono text-slate-500 text-[11px]">{selectedTxn.userId}</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Full Name</span>
                  <span className="font-semibold text-slate-900">{selectedTxn.userName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Mobile</span>
                  <span className="font-medium text-slate-800">{selectedTxn.userMobile || '—'}</span>
                </div>
                {selectedTxn.userEmail && (
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">Email Address</span>
                    <span className="font-medium text-slate-800">{selectedTxn.userEmail}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bullion & Financial Breakdown */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
              <h4 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-1.5">
                Financial & Bullion Breakdown
              </h4>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Benchmark Rate:</span>
                  <span className="font-mono text-slate-900 font-semibold">
                    {selectedTxn.rate > 0 ? `${formatINR(selectedTxn.rate)} / gram` : '—'}
                  </span>
                </div>
                {selectedTxn.makingCharges > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Making Charges:</span>
                    <span className="font-mono text-slate-900 font-semibold">
                      {formatINR(selectedTxn.makingCharges)}
                    </span>
                  </div>
                )}
                {selectedTxn.gstAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">GST (3% Bullion GST):</span>
                    <span className="font-mono text-slate-900 font-semibold">
                      {formatINR(selectedTxn.gstAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-1.5 border-t border-slate-100 font-bold text-slate-900">
                  <span>Total Amount Paid / Settled:</span>
                  <span className="font-mono text-sm">{formatINR(selectedTxn.amount)}</span>
                </div>
              </div>
            </div>

            {/* Physical Delivery Details (If Physical Buy) */}
            {selectedTxn.buyType === 'PHYSICAL' && selectedTxn.deliveryAddress && (
              <div className="p-3.5 rounded-xl bg-orange-50/60 border border-orange-200 space-y-2.5">
                <h4 className="font-bold text-orange-950 text-xs border-b border-orange-200/60 pb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-orange-700" />
                    Physical Delivery & Shipment
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-800">
                    {selectedTxn.deliveryStatus || 'Processing'}
                  </span>
                </h4>
                <div className="text-xs space-y-1 text-slate-700">
                  <p className="font-semibold text-slate-900">
                    {selectedTxn.deliveryAddress.recipientName} ({selectedTxn.deliveryAddress.recipientPhone})
                  </p>
                  <p className="text-slate-600 flex items-start gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                    <span>
                      {selectedTxn.deliveryAddress.addressLine}, {selectedTxn.deliveryAddress.city},{' '}
                      {selectedTxn.deliveryAddress.state} - {selectedTxn.deliveryAddress.pincode}
                    </span>
                  </p>
                  {(selectedTxn.courierPartner || selectedTxn.trackingNumber) && (
                    <div className="flex items-center justify-between pt-2 border-t border-orange-200/50 text-[11px]">
                      <span>Courier: <strong>{selectedTxn.courierPartner || 'Assigned'}</strong></span>
                      <span className="font-mono">AWB: <strong>{selectedTxn.trackingNumber || 'Pending'}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reference & Remarks */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Order / Reference ID:</span>
                <div className="flex items-center gap-1.5 font-mono text-amber-900 font-bold">
                  <span>{selectedTxn.reference}</span>
                  <button
                    onClick={() => copyToClipboard(selectedTxn.reference)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                    title="Copy Reference ID"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
              {selectedTxn.productName && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Product:</span>
                  <span className="font-semibold text-slate-800">{selectedTxn.productName}</span>
                </div>
              )}
              {selectedTxn.description && (
                <div className="pt-1.5 border-t border-slate-200/60 text-slate-600 text-[11px]">
                  <span className="text-slate-400 block text-[10px]">Description:</span>
                  <p className="mt-0.5 font-medium">{selectedTxn.description}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
