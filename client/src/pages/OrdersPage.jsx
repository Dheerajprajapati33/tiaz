import React, { useState, useEffect, useCallback } from 'react';
import Card from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import SearchBar from '../components/common/SearchBar.jsx';
import Select from '../components/common/Select.jsx';
import Pagination from '../components/common/Pagination.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Modal from '../components/common/Modal.jsx';
import StatCard from '../components/dashboard/StatCard.jsx';
import { ordersApi } from '../services/api.js';
import { formatINR, formatDate } from '../utils/formatters.js';
import { useToast } from '../components/common/Toast.jsx';
import {
  Package,
  PhoneCall,
  Phone,
  CheckCircle2,
  XCircle,
  Truck,
  Coins,
  Disc,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  Clock,
  Eye,
  CreditCard,
  Banknote,
  MapPin,
  ShieldCheck,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function OrdersPage() {
  const { addToast } = useToast();

  // State
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingVerification: 0,
    inProgress: 0,
    dispatched: 0,
    delivered: 0,
    cancelled: 0,
    codCount: 0,
    onlineCount: 0
  });

  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10
  });

  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [metalFilter, setMetalFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Selected Order for Inspect/Action Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('PLACED');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [courierPartner, setCourierPartner] = useState('Sequel Logistics');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [rejectionReason, setRejectionReason] = useState('Customer cancelled during phone verification');
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await ordersApi.getPurchaseRequests({
        status: statusFilter,
        metalType: metalFilter,
        paymentMethod: paymentFilter,
        search: debouncedSearch,
        page: currentPage,
        limit: 10
      });

      if (res.success && res.data) {
        setOrders(res.data.items || res.data.orders || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      addToast(err.message || 'Failed to load purchase requests', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, metalFilter, paymentFilter, debouncedSearch, currentPage, addToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Open inspection modal
  const handleOpenInspect = (order) => {
    setSelectedOrder(order);
    setSelectedStatus(order.status || 'PLACED');
    setAdminNotes(order.adminNotes || '');
    setCourierPartner(order.courierDetails?.partner || 'Sequel Logistics');
    setTrackingNumber(order.courierDetails?.trackingNumber || '');
    setCopiedPhone(false);
  };

  // Copy phone number
  const handleCopyPhone = (phone) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    addToast('Phone number copied to clipboard', 'success');
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  // Action: Update Order Status (Pending, Placed, Confirmed, Delivered, Cancelled)
  const handleUpdateStatus = async () => {
    if (!selectedOrder || !selectedStatus) return;
    setIsActionLoading(true);
    try {
      const res = await ordersApi.updateOrderStatus(selectedOrder.orderId || selectedOrder._id, {
        status: selectedStatus,
        adminNotes,
        courierPartner,
        trackingNumber
      });
      if (res.success) {
        addToast(`Order #${selectedOrder.orderNumber} status successfully changed to ${selectedStatus}!`, 'success');
        setSelectedOrder(null);
        fetchOrders();
      }
    } catch (err) {
      addToast(err.message || 'Failed to update order status', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Action: Accept Order
  const handleAcceptOrder = async () => {
    if (!selectedOrder) return;
    setIsActionLoading(true);
    try {
      const res = await ordersApi.acceptOrder(selectedOrder.orderId || selectedOrder._id, {
        adminNotes: adminNotes || 'Call confirmed by admin'
      });
      if (res.success) {
        addToast(`Order #${selectedOrder.orderNumber} confirmed after customer verification!`, 'success');
        setSelectedOrder(null);
        fetchOrders();
      }
    } catch (err) {
      addToast(err.message || 'Failed to accept order', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Action: Reject Order
  const handleRejectOrder = async () => {
    if (!selectedOrder) return;
    setIsActionLoading(true);
    try {
      const res = await ordersApi.rejectOrder(selectedOrder.orderId || selectedOrder._id, {
        reason: rejectionReason,
        adminNotes
      });
      if (res.success) {
        addToast(`Order #${selectedOrder.orderNumber} has been rejected/cancelled.`, 'warning');
        setSelectedOrder(null);
        fetchOrders();
      }
    } catch (err) {
      addToast(err.message || 'Failed to reject order', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Action: Dispatch Order
  const handleDispatchOrder = async () => {
    if (!selectedOrder) return;
    setIsActionLoading(true);
    try {
      const res = await ordersApi.dispatchOrder(selectedOrder.orderId || selectedOrder._id, {
        partner: courierPartner,
        trackingNumber: trackingNumber || `TRK-${Date.now().toString().slice(-8)}`
      });
      if (res.success) {
        addToast('Order marked as dispatched with tracking number!', 'success');
        setSelectedOrder(null);
        fetchOrders();
      }
    } catch (err) {
      addToast(err.message || 'Failed to dispatch order', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Action: Complete Delivery
  const handleCompleteDelivery = async () => {
    if (!selectedOrder) return;
    setIsActionLoading(true);
    try {
      const res = await ordersApi.completeDelivery(selectedOrder.orderId || selectedOrder._id, {
        adminNotes
      });
      if (res.success) {
        addToast(`Order #${selectedOrder.orderNumber} successfully marked as delivered!`, 'success');
        setSelectedOrder(null);
        fetchOrders();
      }
    } catch (err) {
      addToast(err.message || 'Failed to complete delivery', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Format Status Badge: Pending, Placed, Confirmed, Delivered, Cancelled
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
      case 'PENDING_CONFIRMATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending
          </span>
        );
      case 'PLACED':
      case 'REQUESTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-sky-50 text-sky-800 border border-sky-300">
            <Package className="w-3 h-3 text-sky-600" />
            Placed
          </span>
        );
      case 'CONFIRMED':
      case 'ACCEPTED':
      case 'PROCESSING':
      case 'MINTING':
      case 'DISPATCHED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-800 border border-indigo-300">
            <CheckCircle2 className="w-3 h-3 text-indigo-600" />
            Confirmed
          </span>
        );
      case 'DELIVERED':
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Delivered
          </span>
        );
      case 'REJECTED':
      case 'CANCELLED':
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-800 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-600" />
            Cancelled
          </span>
        );
      default:
        return <Badge status={status} />;
    }
  };

  // Payment Badge
  const renderPaymentBadge = (method, status) => {
    if (method === 'COD') {
      const isPaid = status === 'PAID';
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border ${
            isPaid
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-amber-50 text-amber-900 border-amber-200'
          }`}
        >
          <Banknote className="w-3 h-3" />
          COD ({isPaid ? 'Paid' : 'Unpaid'})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
        <CreditCard className="w-3 h-3" />
        Online Paid
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 font-serif">Purchase Requests</h1>
            {stats.pendingVerification > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full animate-bounce">
                {stats.pendingVerification} Needs Call
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Physical Gold & Silver order requests. Verify user confirmation over phone call, approve purchase orders, and mark doorstep delivery completion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            disabled={isLoading}
            className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* 2. Top Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Physical Orders"
          value={stats.totalOrders}
          icon={Package}
          accentColor="amber"
          subtitle={`${stats.codCount} COD • ${stats.onlineCount} Online Paid`}
        />
        <StatCard
          title="Needs Verification Call"
          value={stats.pendingVerification}
          icon={PhoneCall}
          accentColor="rose"
          subtitle="Call user to confirm before order dispatch"
        />
        <StatCard
          title="In Transit / Processing"
          value={stats.inProgress + stats.dispatched}
          icon={Truck}
          accentColor="sky"
          subtitle={`${stats.dispatched} dispatched on road`}
        />
        <StatCard
          title="Delivered Successfully"
          value={stats.delivered}
          icon={CheckCircle2}
          accentColor="emerald"
          subtitle="Doorstep delivery verified"
        />
      </div>

      {/* 3. Attention Banner if pending requests exist */}
      {stats.pendingVerification > 0 && (
        <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-500 rounded-r-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <PhoneCall className="w-5 h-5 text-amber-700 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-950">
                Action Required: {stats.pendingVerification} New Physical Order Request{stats.pendingVerification > 1 ? 's' : ''} Awaiting Phone Call
              </p>
              <p className="text-xs text-amber-800">
                Call the customer to confirm order details and delivery address. Upon confirmation, accept the order to issue the confirmed Purchase Order.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setStatusFilter('REQUESTED');
              setCurrentPage(1);
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 text-xs font-semibold cursor-pointer"
          >
            View Pending Calls
          </Button>
        </div>
      )}

      {/* 4. Filters & Controls */}
      <Card className="p-4 bg-white border border-slate-200 space-y-3.5 shadow-xs">
        {/* Row 1: Search Box (Left) + 3 Dropdown Filters (Right) */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Box */}
          <div className="flex-1 min-w-[220px]">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by order ID, customer name, mobile..."
              className="w-full text-xs"
            />
          </div>

          {/* 2 Dropdown Filters (Strictly Side-by-Side, never upar-neeche) */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Filter 1: Metal Dropdown */}
            <Select
              value={metalFilter}
              onChange={(e) => {
                setMetalFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Metals' },
                { value: 'GOLD', label: 'Gold Bullion' },
                { value: 'SILVER', label: 'Silver Bullion' }
              ]}
              className="text-xs min-w-[130px]"
            />

            {/* Filter 2: Payment Dropdown */}
            <Select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Payments' },
                { value: 'COD', label: 'Cash on Delivery (COD)' },
                { value: 'ONLINE', label: 'Online Paid' }
              ]}
              className="text-xs min-w-[150px]"
            />

            {(metalFilter !== 'ALL' || paymentFilter !== 'ALL' || search) && (
              <Button
                size="xs"
                variant="outline"
                onClick={() => {
                  setMetalFilter('ALL');
                  setPaymentFilter('ALL');
                  setSearch('');
                  setCurrentPage(1);
                }}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Row 2: Status Quick Filter Tabs */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Quick Filter:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 max-w-full text-xs font-medium">
            {[
              { id: 'ALL', label: 'All Orders', count: stats.totalOrders },
              { id: 'PENDING', label: 'Pending', count: stats.pending ?? stats.pendingVerification, isAlert: true },
              { id: 'PLACED', label: 'Placed', count: stats.placed ?? stats.pendingVerification },
              { id: 'CONFIRMED', label: 'Confirmed', count: stats.confirmed ?? stats.inProgress },
              { id: 'DELIVERED', label: 'Delivered', count: stats.delivered },
              { id: 'CANCELLED', label: 'Cancelled', count: stats.cancelled }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg transition-all shrink-0 cursor-pointer flex items-center gap-1.5 text-xs ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      statusFilter === tab.id
                        ? 'bg-white/20 text-white'
                        : tab.isAlert && tab.count > 0
                        ? 'bg-amber-500 text-white font-bold'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* 5. Orders Table */}
      <Card className="overflow-hidden bg-white border border-slate-200 shadow-xs">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-[#D4AF37]" />
            <p className="text-sm font-medium">Loading physical orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No physical purchase orders found"
            description="No orders match your selected filters. When users place physical buy requests, they will appear here with customer call details."
            action={
              statusFilter !== 'ALL' || metalFilter !== 'ALL' || paymentFilter !== 'ALL' || search ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setStatusFilter('ALL');
                    setMetalFilter('ALL');
                    setPaymentFilter('ALL');
                    setSearch('');
                  }}
                >
                  Clear Filters
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Order & Time</th>
                  <th className="px-5 py-3.5">Customer & Phone (Call)</th>
                  <th className="px-5 py-3.5">Product & Weight</th>
                  <th className="px-5 py-3.5">Amount & Payment</th>
                  <th className="px-5 py-3.5">Destination</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {orders.map((o) => {
                  const isGold = o.metalType === 'GOLD';
                  const isPendingCall = ['REQUESTED', 'PENDING_CONFIRMATION', 'PENDING'].includes(o.status);

                  return (
                    <tr
                      key={o._id || o.orderId}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isPendingCall ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* Order Number & Metal */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isGold
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-slate-200 text-slate-800 border border-slate-300'
                            }`}
                          >
                            {isGold ? <Coins className="w-3.5 h-3.5" /> : <Disc className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-xs font-mono">{o.orderNumber}</p>
                            <p className="text-[11px] text-slate-500">{formatDate(o.createdAt)}</p>
                          </div>
                        </div>
                      </td>

                      {/* Customer Info & Direct Call Button */}
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-slate-900 text-xs">{o.customer?.fullName || 'Customer'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {o.customer?.mobile ? (
                              <>
                                <a
                                  href={`tel:${o.customer.mobile}`}
                                  title="Click to call customer"
                                  className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800 font-medium hover:underline bg-amber-50 px-2 py-0.5 rounded border border-amber-200"
                                >
                                  <Phone className="w-3 h-3 text-amber-600" />
                                  {o.customer.mobile}
                                </a>
                                <button
                                  onClick={() => handleCopyPhone(o.customer.mobile)}
                                  title="Copy phone number"
                                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <span className="text-slate-400 text-xs italic">No phone registered</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Product Name & Weight */}
                      <td className="px-5 py-4">
                        <div className="max-w-[200px]">
                          <p className="font-medium text-slate-900 text-xs truncate" title={o.productName}>
                            {o.productName}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {o.formattedGrams || `${o.weightGrams} gm`} • {o.productDetails?.purity || (isGold ? '24K' : '999 Fine')}
                          </p>
                        </div>
                      </td>

                      {/* Amount & Payment Status */}
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{formatINR(o.finalAmount)}</p>
                          <div className="mt-1">
                            {renderPaymentBadge(o.paymentMethod, o.paymentStatus)}
                          </div>
                        </div>
                      </td>

                      {/* Destination City */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 text-xs text-slate-600 max-w-[150px] truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {o.deliveryAddress?.city ? `${o.deliveryAddress.city}, ${o.deliveryAddress.state || ''}` : 'Pending details'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {renderStatusBadge(o.status)}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleOpenInspect(o)}
                          className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border-slate-300"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-600" />
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination - Always visible page-by-page */}
        <div className="border-t border-slate-200">
          <Pagination
            currentPage={currentPage}
            totalItems={pagination.totalItems || orders.length}
            pageSize={pagination.limit || 10}
            onPageChange={setCurrentPage}
          />
        </div>
      </Card>

      {/* 6. Inspection & Verification Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => !isActionLoading && setSelectedOrder(null)}
          title={`Order Verification: ${selectedOrder.orderNumber}`}
          size="lg"
        >
          <div className="space-y-5">
            {/* Step 1 Verification Banner for pending calls */}
            {['REQUESTED', 'PENDING_CONFIRMATION', 'PENDING'].includes(selectedOrder.status) && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                    <PhoneCall className="w-4 h-4 text-amber-800" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-amber-950">
                      Step 1: Call Customer to Confirm Order & Address
                    </h4>
                    <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                      Please call <strong>{selectedOrder.customer?.fullName}</strong> at{' '}
                      <span className="font-mono font-bold text-slate-900">{selectedOrder.customer?.mobile || selectedOrder.deliveryAddress?.recipientPhone}</span>{' '}
                      to confirm whether they wish to proceed with this purchase and verify their shipping address.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <a
                        href={`tel:${selectedOrder.customer?.mobile || selectedOrder.deliveryAddress?.recipientPhone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Call Now: {selectedOrder.customer?.mobile || selectedOrder.deliveryAddress?.recipientPhone}
                      </a>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleCopyPhone(selectedOrder.customer?.mobile || selectedOrder.deliveryAddress?.recipientPhone)}
                        className="text-xs"
                      >
                        {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedPhone ? 'Copied' : 'Copy Number'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Customer & Delivery Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Customer Profile</p>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{selectedOrder.customer?.fullName}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{selectedOrder.customer?.email || 'No email registered'}</p>
                  <p className="text-xs font-mono font-medium text-slate-900 mt-1">{selectedOrder.customer?.mobile}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Delivery Address</p>
                <div className="text-xs text-slate-700 space-y-0.5">
                  <p className="font-semibold text-slate-900">{selectedOrder.deliveryAddress?.recipientName}</p>
                  <p>{selectedOrder.deliveryAddress?.addressLine}</p>
                  <p>
                    {selectedOrder.deliveryAddress?.city}, {selectedOrder.deliveryAddress?.state} - {selectedOrder.deliveryAddress?.pincode}
                  </p>
                  <p className="font-mono text-slate-500">Phone: {selectedOrder.deliveryAddress?.recipientPhone}</p>
                </div>
              </div>
            </div>

            {/* Product & Financial Breakdown */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Product & Pricing Breakdown</p>
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedOrder.metalType === 'GOLD'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {selectedOrder.metalType === 'GOLD' ? <Coins className="w-5 h-5" /> : <Disc className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{selectedOrder.productName}</p>
                    <p className="text-xs text-slate-500">
                      {selectedOrder.formattedGrams} • {selectedOrder.productDetails?.purity} • {selectedOrder.productDetails?.mintPartner}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500">Live Rate / gm</p>
                  <p className="text-xs font-mono font-medium text-slate-900">{selectedOrder.formattedRate}</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                <div className="flex justify-between">
                  <span>Gross Metal Amount:</span>
                  <span className="font-mono">{formatINR(selectedOrder.grossAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Making / Minting Charges:</span>
                  <span className="font-mono">
                    {selectedOrder.makingCharges > 0 ? formatINR(selectedOrder.makingCharges) : '₹0.00 (FREE)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>GST (3% Bullion Tax):</span>
                  <span className="font-mono">{formatINR(selectedOrder.gstAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Insured Doorstep Delivery:</span>
                  <span className="font-mono text-emerald-600 font-semibold">FREE (Covered by Tia'z)</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                  <span>Total Payable:</span>
                  <span className="font-mono text-base text-amber-900">{formatINR(selectedOrder.finalAmount)}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500">Payment Mode:</span>
                <div>{renderPaymentBadge(selectedOrder.paymentMethod, selectedOrder.paymentStatus)}</div>
              </div>
            </div>

            {/* Update Order Status Action Card */}
            <div className="p-4 rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50/70 via-orange-50/30 to-amber-50/50 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                  Update Order Status
                </p>
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span>Current:</span>
                  {renderStatusBadge(selectedOrder.status)}
                </div>
              </div>

              {/* Status Selection Buttons: Pending, Placed, Confirmed, Delivered */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: 'PENDING', label: 'Pending', desc: 'Awaiting Call / Verification' },
                  { value: 'PLACED', label: 'Placed', desc: 'Order Placed by Customer' },
                  { value: 'CONFIRMED', label: 'Confirmed', desc: 'Verified & Processing' },
                  { value: 'DELIVERED', label: 'Delivered', desc: 'Delivered to Customer' }
                ].map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSelectedStatus(s.value)}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      selectedStatus === s.value
                        ? 'border-amber-600 bg-amber-100/90 text-amber-950 font-bold shadow-xs ring-2 ring-amber-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{s.label}</span>
                      {selectedStatus === s.value && <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />}
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{s.desc}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-amber-200/60">
                <button
                  type="button"
                  onClick={() => setSelectedStatus('CANCELLED')}
                  className={`text-xs px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                    selectedStatus === 'CANCELLED'
                      ? 'bg-rose-100 text-rose-800 border-rose-400 font-bold ring-2 ring-rose-400'
                      : 'text-rose-600 border-rose-200 hover:bg-rose-50'
                  }`}
                >
                  Mark as Cancelled
                </button>

                <Button
                  size="sm"
                  onClick={handleUpdateStatus}
                  disabled={isActionLoading}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  Apply Status ({selectedStatus})
                </Button>
              </div>
            </div>

            {/* Courier Dispatch Details */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Logistics & Courier Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Courier Partner</label>
                  <input
                    type="text"
                    value={courierPartner}
                    onChange={(e) => setCourierPartner(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white"
                    placeholder="e.g. Sequel Logistics, Brinks Secure"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Tracking Number / AWB</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white font-mono"
                    placeholder="e.g. TRK-84920194"
                  />
                </div>
              </div>
            </div>

            {/* Admin Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Admin Verification Notes</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Called customer on 02/10 at 11:30 AM. User confirmed order interest and confirmed delivery to Pune office."
                className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Action Buttons based on order lifecycle */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedOrder(null)}
                disabled={isActionLoading}
              >
                Close
              </Button>

              <div className="flex items-center gap-2">
                {/* 1. If Pending Call: Accept or Reject */}
                {['REQUESTED', 'PENDING_CONFIRMATION', 'PENDING'].includes(selectedOrder.status) && (
                  <>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleRejectOrder}
                      disabled={isActionLoading}
                      className="flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject / User Denied
                    </Button>

                    <Button
                      size="sm"
                      onClick={handleAcceptOrder}
                      disabled={isActionLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Accept & Confirm Order
                    </Button>
                  </>
                )}

                {/* 2. If Accepted / Confirmed: Dispatch */}
                {['ACCEPTED', 'PROCESSING'].includes(selectedOrder.status) && (
                  <Button
                    size="sm"
                    onClick={handleDispatchOrder}
                    disabled={isActionLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5"
                  >
                    <Truck className="w-4 h-4" />
                    Dispatch Courier
                  </Button>
                )}

                {/* 3. If Dispatched: Complete Delivery */}
                {selectedOrder.status === 'DISPATCHED' && (
                  <Button
                    size="sm"
                    onClick={handleCompleteDelivery}
                    disabled={isActionLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark Delivery Completed
                  </Button>
                )}

                {/* 4. If Delivered */}
                {selectedOrder.status === 'DELIVERED' && (
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Order Completed on {formatDate(selectedOrder.deliveredAt || selectedOrder.updatedAt)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
