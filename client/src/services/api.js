// Base API URL: In browser environments, use relative '/api/v1' to route through the local Vite proxy.
// This completely eliminates CORS preflight issues, Dev Tunnel anti-abuse splash blocks, and network mismatch.
let API_BASE_URL = "/api/v1";

if (typeof window === "undefined" && import.meta.env.VITE_API_BASE_URL) {
  API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
}

export async function apiRequest(endpoint, options = {}) {
  const token =
    localStorage.getItem("tiaz_admin_token") ||
    sessionStorage.getItem("tiaz_admin_token");

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers = {
    "X-Tunnel-Skip-Anti-Abuse": "true",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMessage =
        data?.message ||
        data?.error ||
        `Request failed with status ${res.status}`;
      const err = new Error(errorMessage);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export const authApi = {
  adminLogin: (email, password) =>
    apiRequest("/auth/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
};

export const dashboardApi = {
  getAdminDashboard: (assetType = "gold", period = "1M") =>
    apiRequest(`/admin/dashboard?assetType=${assetType}&period=${period}`, {
      method: "GET",
    }),
};

export const adminUsersApi = {
  getUsers: ({
    search = "",
    status = "All",
    kycStatus = "All",
    page = 1,
    limit = 10,
  } = {}) => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (status && status !== "All") params.append("status", status);
    if (kycStatus && kycStatus !== "All") params.append("kycStatus", kycStatus);
    params.append("page", page);
    params.append("limit", limit);
    return apiRequest(`/admin/users?${params.toString()}`, { method: "GET" });
  },
  toggleBlockUser: (userId, isBlocked) =>
    apiRequest(`/admin/users/${userId}/block`, {
      method: "PUT",
      body: JSON.stringify({ isBlocked }),
    }),
  updateKycStatus: (userId, status, rejectionReason = "") =>
    apiRequest(`/admin/users/${userId}/kyc`, {
      method: "PUT",
      body: JSON.stringify({ status, rejectionReason }),
    }),
  getUserReferrals: (userId) =>
    apiRequest(`/admin/users/${userId}/referrals`, { method: "GET" }),
};

export const bullionApi = {
  getGoldOverview: (fresh = false) =>
    apiRequest(`/admin/gold${fresh ? "?fresh=1" : ""}`, { method: "GET" }),
  getSilverOverview: (fresh = false) =>
    apiRequest(`/admin/silver${fresh ? "?fresh=1" : ""}`, { method: "GET" }),
  getAssetOverview: (assetType) =>
    apiRequest(`/admin/asset/${assetType}`, { method: "GET" }),
};

export const rateSettingsApi = {
  getRateSettings: () => apiRequest("/admin/rate-settings", { method: "GET" }),
  updateRateSettings: (data) =>
    apiRequest("/admin/rate-settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

export const transactionsApi = {
  getTransactions: ({
    search = "",
    metalType = "ALL",
    type = "ALL",
    buyType = "ALL",
    status = "ALL",
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = {}) => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (metalType && metalType !== "ALL") params.append("metalType", metalType);
    if (type && type !== "ALL") params.append("type", type);
    if (buyType && buyType !== "ALL") params.append("buyType", buyType);
    if (status && status !== "ALL") params.append("status", status);
    params.append("page", page);
    params.append("limit", limit);
    if (sortBy) params.append("sortBy", sortBy);
    if (sortOrder) params.append("sortOrder", sortOrder);
    return apiRequest(`/admin/transactions?${params.toString()}`, {
      method: "GET",
    });
  },
};

export const withdrawalsApi = {
  getWithdrawals: ({
    search = "",
    status = "ALL",
    page = 1,
    limit = 10,
  } = {}) => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (status && status !== "ALL") params.append("status", status);
    params.append("page", page);
    params.append("limit", limit);
    return apiRequest(`/admin/withdrawals?${params.toString()}`, {
      method: "GET",
    });
  },

  approveWithdrawal: (id, { adminNotes = "" } = {}) =>
    apiRequest(`/admin/withdrawals/${id}/approve`, {
      method: "PUT",
      body: JSON.stringify({ adminNotes }),
    }),

  rejectWithdrawal: (id, { reason = "", adminNotes = "" } = {}) =>
    apiRequest(`/admin/withdrawals/${id}/reject`, {
      method: "PUT",
      body: JSON.stringify({ reason, adminNotes }),
    }),
};

export const ordersApi = {
  getPurchaseRequests: ({
    status = "ALL",
    metalType = "ALL",
    paymentMethod = "ALL",
    search = "",
    page = 1,
    limit = 10,
  } = {}) => {
    const params = new URLSearchParams();
    if (status && status !== "ALL") params.append("status", status);
    if (metalType && metalType !== "ALL") params.append("metalType", metalType);
    if (paymentMethod && paymentMethod !== "ALL")
      params.append("paymentMethod", paymentMethod);
    if (search) params.append("search", search);
    params.append("page", page);
    params.append("limit", limit);
    return apiRequest(`/admin/purchase-requests?${params.toString()}`, {
      method: "GET",
    });
  },

  getOrderDetails: (orderId) =>
    apiRequest(`/admin/purchase-requests/${orderId}`, { method: "GET" }),

  acceptOrder: (orderId, { adminNotes = "" } = {}) =>
    apiRequest(`/admin/purchase-requests/${orderId}/accept`, {
      method: "PUT",
      body: JSON.stringify({ adminNotes }),
    }),

  rejectOrder: (
    orderId,
    { reason = "Cancelled upon call verification", adminNotes = "" } = {},
  ) =>
    apiRequest(`/admin/purchase-requests/${orderId}/reject`, {
      method: "PUT",
      body: JSON.stringify({ reason, adminNotes }),
    }),

  dispatchOrder: (
    orderId,
    { partner = "Sequel Logistics", trackingNumber = "" } = {},
  ) =>
    apiRequest(`/admin/purchase-requests/${orderId}/dispatch`, {
      method: "PUT",
      body: JSON.stringify({ partner, trackingNumber }),
    }),

  completeDelivery: (orderId, { adminNotes = "" } = {}) =>
    apiRequest(`/admin/purchase-requests/${orderId}/deliver`, {
      method: "PUT",
      body: JSON.stringify({ adminNotes }),
    }),

  updateOrderStatus: (
    orderId,
    { status, adminNotes = "", courierPartner = "", trackingNumber = "" } = {},
  ) =>
    apiRequest(`/admin/purchase-requests/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify({
        status,
        adminNotes,
        courierPartner,
        trackingNumber,
      }),
    }),
};

export const userOrdersApi = {
  getMyOrders: ({
    status = "ALL",
    metalType = "ALL",
    buyType = "ALL",
    search = "",
    page = 1,
    limit = 10,
  } = {}) => {
    const params = new URLSearchParams();
    if (status && status !== "ALL") params.append("status", status);
    if (metalType && metalType !== "ALL") params.append("metalType", metalType);
    if (buyType && buyType !== "ALL") params.append("buyType", buyType);
    if (search) params.append("search", search);
    params.append("page", page);
    params.append("limit", limit);
    return apiRequest(`/orders/my-orders?${params.toString()}`, {
      method: "GET",
    });
  },

  getOrderDetails: (orderId) =>
    apiRequest(`/orders/${orderId}`, { method: "GET" }),

  getCheckoutPreview: (productId, quantity = 1) =>
    apiRequest(`/orders/checkout-preview/${productId}?quantity=${quantity}`, {
      method: "GET",
    }),

  buyPhysicalProduct: ({
    productId,
    quantity = 1,
    paymentMode = "COD",
    deliveryAddress,
    paymentDetails,
  } = {}) =>
    apiRequest("/orders/buy", {
      method: "POST",
      body: JSON.stringify({
        productId,
        quantity,
        paymentMode,
        deliveryAddress,
        paymentDetails,
      }),
    }),
};

export const adminProfileApi = {
  getProfile: () => apiRequest("/admin/profile", { method: "GET" }),
  updateProfile: (data) => {
    const isFormData =
      typeof FormData !== "undefined" && data instanceof FormData;
    return apiRequest("/admin/profile", {
      method: "PUT",
      body: isFormData ? data : JSON.stringify(data),
    });
  },
  changePassword: (currentPassword, newPassword, confirmPassword) =>
    apiRequest("/admin/change-password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    }),
};

export const contentApi = {
  getContent: (type) => {
    const endpoint = type ? `/content?type=${type}` : "/content";
    return apiRequest(endpoint, { method: "GET" });
  },
  saveContent: (type, content, title) =>
    apiRequest("/content", {
      method: "POST",
      body: JSON.stringify({ type, content, title }),
    }),
};

export const productsApi = {
  getProducts: ({
    metalType = "",
    search = "",
    page = 1,
    limit = 10,
    inStock = "",
    includeInactive = true,
  } = {}) => {
    const params = new URLSearchParams();
    if (metalType && metalType !== "ALL") params.append("metalType", metalType);
    if (search) params.append("search", search);
    if (inStock !== "" && inStock !== null && inStock !== undefined)
      params.append("inStock", inStock);
    if (includeInactive) params.append("includeInactive", "true");
    params.append("page", page);
    params.append("limit", limit);
    return apiRequest(`/products?${params.toString()}`, { method: "GET" });
  },
  uploadImages: (formData) =>
    apiRequest("/products/upload-images", {
      method: "POST",
      body: formData,
    }),
  createProduct: (data) =>
    apiRequest("/products", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateProduct: (id, data) =>
    apiRequest(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteProduct: (id) => apiRequest(`/products/${id}`, { method: "DELETE" }),
};

export const getMediaUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const cleanPath = path.replace(/\\/g, "/");
  const slash = cleanPath.startsWith("/") ? "" : "/";
  return `${slash}${cleanPath}`;
};
