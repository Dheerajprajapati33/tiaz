// Currency, weight, date and status formatters

export const formatINR = (val, compact = false) => {
  if (val === undefined || val === null) return '₹0';
  const num = Number(val);
  if (isNaN(num)) return '₹0';

  if (compact) {
    if (Math.abs(num) >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    }
    if (Math.abs(num) >= 100000) {
      return `₹${(num / 100000).toFixed(2)} L`;
    }
    if (Math.abs(num) >= 1000) {
      return `₹${(num / 1000).toFixed(1)}k`;
    }
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(num);
};

export const formatGrams = (grams, unit = 'auto') => {
  if (grams === undefined || grams === null) return '0.000 g';
  const num = Number(grams);
  if (isNaN(num)) return '0.000 g';

  if (unit === 'kg' || (unit === 'auto' && num >= 1000)) {
    return `${(num / 1000).toFixed(3)} KG`;
  }
  return `${num.toFixed(3)} g`;
};

export const formatDate = (dateStr, includeTime = false) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const options = {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  };
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.hour12 = true;
  }
  return new Intl.DateTimeFormat('en-IN', options).format(date);
};

export const maskAccountNumber = (accNumber) => {
  if (!accNumber) return 'XXXX XXXX 0000';
  const str = String(accNumber).trim();
  const last4 = str.slice(-4);
  return `XXXX XXXX ${last4}`;
};

export const getStatusBadgeColor = (status) => {
  const s = String(status).toLowerCase();
  switch (s) {
    case 'verified':
    case 'completed':
    case 'success':
    case 'active':
    case 'approved':
    case 'resolved':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200'
      };
    case 'pending':
    case 'under review':
    case 'open':
    case 'in progress':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200'
      };
    case 'rejected':
    case 'failed':
    case 'blocked':
    case 'inactive':
    case 'closed':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200'
      };
    case 're-upload requested':
    case 'processing':
    case 'refunded':
      return {
        bg: 'bg-sky-50',
        text: 'text-sky-700',
        border: 'border-sky-200'
      };
    default:
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200'
      };
  }
};
