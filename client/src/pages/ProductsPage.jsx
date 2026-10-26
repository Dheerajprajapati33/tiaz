import React, { useState, useEffect, useCallback } from "react";
import {
  Package,
  Plus,
  Search,
  Filter,
  Coins,
  Disc,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  DollarSign,
  Image as ImageIcon,
  Check,
  X,
  Layers,
  Upload,
  Star,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import { productsApi, getMediaUrl } from "../services/api.js";
import { formatINR } from "../utils/formatters.js";
import Card from "../components/common/Card.jsx";
import Button from "../components/common/Button.jsx";
import Badge from "../components/common/Badge.jsx";
import Select from "../components/common/Select.jsx";
import Pagination from "../components/common/Pagination.jsx";

/**
 * Compresses an image file strictly to under 600 KB using browser Canvas.
 * No external binaries needed, runs fast and client-side before upload.
 */
async function compressImageToMax600KB(file) {
  return new Promise((resolve) => {
    const MAX_BYTES = 600 * 1024; // 600 KB limit
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const maxDimension = 1600;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.85;

        const attemptCompression = (q) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return resolve(file);
              }
              if (blob.size <= MAX_BYTES || q <= 0.3) {
                const cleanName = (file.name || "image").replace(/\.[^/.]+$/, "") + ".jpg";
                const compressedFile = new File([blob], cleanName, {
                  type: "image/jpeg",
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                attemptCompression(q - 0.15);
              }
            },
            "image/jpeg",
            q
          );
        };

        attemptCompression(quality);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Filters & Search
  const [metalFilter, setMetalFilter] = useState("ALL"); // ALL, GOLD, SILVER
  const [stockFilter, setStockFilter] = useState("ALL"); // ALL, IN_STOCK, OUT_OF_STOCK
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, hasMore: false });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("CREATE"); // 'CREATE' | 'EDIT'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    metalType: "GOLD",
    weightGrams: "",
    price: "",
    inStock: true,
    images: [], // array of up to 4 images
    imageUrl: "",
    description: ""
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [manualUrlInput, setManualUrlInput] = useState("");

  // Delete Confirmation State
  const [deleteProductTarget, setDeleteProductTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Products
  const fetchProducts = useCallback(async (resetPage = false) => {
    setLoading(true);
    setError(null);
    try {
      const currentPage = resetPage ? 1 : page;
      if (resetPage) setPage(1);

      const res = await productsApi.getProducts({
        metalType: metalFilter === "ALL" ? "" : metalFilter,
        inStock: stockFilter === "ALL" ? "" : (stockFilter === "IN_STOCK" ? "true" : "false"),
        search: searchQuery,
        page: currentPage,
        limit: 10,
        includeInactive: true
      });

      if (res && res.success && res.data) {
        setProducts(res.data.products || []);
        setPagination(res.data.pagination || { total: 0, totalPages: 1, hasMore: false });
      } else {
        throw new Error(res?.message || "Failed to load products");
      }
    } catch (err) {
      console.error("Fetch products error:", err);
      setError(err.message || "Could not retrieve products");
    } finally {
      setLoading(false);
    }
  }, [metalFilter, stockFilter, searchQuery, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode("CREATE");
    setSelectedProduct(null);
    setFormData({
      name: "",
      metalType: "GOLD",
      weightGrams: "",
      price: "",
      inStock: true,
      images: [],
      imageUrl: "",
      description: ""
    });
    setModalError(null);
    setUploadError(null);
    setManualUrlInput("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (p) => {
    setModalMode("EDIT");
    setSelectedProduct(p);
    const existingImages = Array.isArray(p.images) && p.images.length > 0
      ? p.images
      : (p.imageUrl ? [p.imageUrl] : []);

    setFormData({
      name: p.name || "",
      metalType: p.metalType || "GOLD",
      weightGrams: p.weightGrams || "",
      price: p.price || "",
      inStock: p.inStock !== false,
      images: existingImages,
      imageUrl: existingImages[0] || "",
      description: p.description || ""
    });
    setModalError(null);
    setUploadError(null);
    setManualUrlInput("");
    setIsModalOpen(true);
  };

  // Multi-Image Upload & Compression Handler
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const currentImages = formData.images || [];
    const remainingSlots = 4 - currentImages.length;

    if (remainingSlots <= 0) {
      setUploadError("Maximum 4 images allowed per product. Remove an image to add another.");
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      setUploadError(`Selected ${files.length} images, but only ${remainingSlots} could be added (Max 4 total).`);
    } else {
      setUploadError(null);
    }

    setUploadingImages(true);
    try {
      // 1. Auto-compress every file to strictly under 600 KB
      const compressedFiles = await Promise.all(
        filesToProcess.map((f) => compressImageToMax600KB(f))
      );

      // 2. Upload to server: uploads/products folder
      const uploadData = new FormData();
      compressedFiles.forEach((file) => {
        uploadData.append("images", file);
      });

      const res = await productsApi.uploadImages(uploadData);
      if (res && res.success && res.data?.urls) {
        const updated = [...currentImages, ...res.data.urls].slice(0, 4);
        setFormData((prev) => ({
          ...prev,
          images: updated,
          imageUrl: updated[0] || ""
        }));
      } else {
        throw new Error(res?.message || "Failed to upload images");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError(err.message || "Failed to compress and upload images to uploads/products");
    } finally {
      setUploadingImages(false);
      e.target.value = "";
    }
  };

  // Image Reordering Functions (Change Index)
  const handleMoveImage = (fromIndex, toIndex) => {
    const current = [...(formData.images || [])];
    if (toIndex < 0 || toIndex >= current.length) return;
    const [moved] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, moved);
    setFormData((prev) => ({
      ...prev,
      images: current,
      imageUrl: current[0] || "" // Index 0 is always the primary display image
    }));
  };

  const handleSetPrimary = (index) => {
    handleMoveImage(index, 0);
  };

  const handleRemoveImage = (index) => {
    const current = [...(formData.images || [])];
    current.splice(index, 1);
    setFormData((prev) => ({
      ...prev,
      images: current,
      imageUrl: current[0] || ""
    }));
  };

  const handleAddManualUrl = () => {
    if (!manualUrlInput.trim()) return;
    const current = formData.images || [];
    if (current.length >= 4) {
      setUploadError("Maximum 4 images allowed per product.");
      return;
    }
    const updated = [...current, manualUrlInput.trim()];
    setFormData((prev) => ({
      ...prev,
      images: updated,
      imageUrl: updated[0] || ""
    }));
    setManualUrlInput("");
    setUploadError(null);
  };

  // Submit Create or Edit
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);

    try {
      if (!formData.name.trim()) throw new Error("Product name is required");
      if (!formData.weightGrams || parseFloat(formData.weightGrams) <= 0) {
        throw new Error("Please enter a valid weight in grams");
      }
      if (!formData.price || parseFloat(formData.price) < 0) {
        throw new Error("Please enter a valid direct price (₹)");
      }

      const imageList = formData.images || [];

      const payload = {
        name: formData.name.trim(),
        metalType: formData.metalType,
        weightGrams: parseFloat(formData.weightGrams),
        price: parseFloat(formData.price),
        inStock: Boolean(formData.inStock),
        images: imageList,
        imageUrl: imageList[0] || null, // Index 0 is always the primary cover image
        description: formData.description.trim()
      };

      if (modalMode === "CREATE") {
        await productsApi.createProduct(payload);
        setActionSuccess("Product added successfully to catalog!");
      } else {
        await productsApi.updateProduct(selectedProduct._id, payload);
        setActionSuccess("Product updated successfully!");
      }

      setIsModalOpen(false);
      fetchProducts();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setModalError(err.message || "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle inStock directly
  const handleToggleStock = async (product) => {
    try {
      await productsApi.updateProduct(product._id, { inStock: !product.inStock });
      setProducts((prev) =>
        prev.map((item) =>
          item._id === product._id ? { ...item, inStock: !item.inStock } : item
        )
      );
      setActionSuccess(`Stock status updated for ${product.name}`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      alert("Failed to update stock status: " + err.message);
    }
  };

  // Delete Product
  const handleConfirmDelete = async () => {
    if (!deleteProductTarget) return;
    setDeleting(true);
    try {
      await productsApi.deleteProduct(deleteProductTarget._id);
      setActionSuccess("Product deleted successfully");
      setDeleteProductTarget(null);
      fetchProducts();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      alert("Failed to delete product: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Summary Metrics
  const goldCount = products.filter((p) => p.metalType === "GOLD").length;
  const silverCount = products.filter((p) => p.metalType === "SILVER").length;
  const inStockCount = products.filter((p) => p.inStock).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/30 border border-amber-300 flex items-center justify-center text-amber-800 shadow-xs">
              <Package className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Products Catalog
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage physical Gold & Silver coins/bars, direct pricing, weight, stock, and descriptions
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchProducts()}
            disabled={loading}
            className="flex items-center gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-600" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </Button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionSuccess && (
        <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Metrics Mini-Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Catalog
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-slate-900">{pagination.total || products.length}</span>
            <span className="text-xs text-slate-500 font-medium">Items</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <Coins className="w-3 h-3 text-amber-600" /> Gold Products
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-amber-900">{goldCount}</span>
            <span className="text-xs text-amber-700 font-medium">Coins & Bars</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1">
            <Disc className="w-3 h-3 text-slate-500" /> Silver Products
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-slate-900">{silverCount}</span>
            <span className="text-xs text-slate-500 font-medium">Coins & Bars</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            Ready in Stock
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-emerald-700">{inStockCount}</span>
            <span className="text-xs text-emerald-600 font-medium">Available</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar: Search box + 3 Dropdown Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Live Search Input (Left, flex-1) */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products by title, coin, gram..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 2 Dropdown Filters (Strictly Side-by-Side, never upar-neeche) */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* 1. Metal Filter */}
            <Select
              value={metalFilter}
              onChange={(e) => {
                setMetalFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "ALL", label: "All Metals" },
                { value: "GOLD", label: "Gold Bullion" },
                { value: "SILVER", label: "Silver Bullion" }
              ]}
              className="text-xs min-w-[130px]"
            />

            {/* 2. Stock Filter */}
            <Select
              value={stockFilter}
              onChange={(e) => {
                setStockFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "ALL", label: "All Stock Status" },
                { value: "IN_STOCK", label: "In Stock Only" },
                { value: "OUT_OF_STOCK", label: "Out of Stock" }
              ]}
              className="text-xs min-w-[145px]"
            />

            {(metalFilter !== "ALL" || stockFilter !== "ALL" || searchQuery) && (
              <Button
                size="xs"
                variant="outline"
                onClick={() => {
                  setMetalFilter("ALL");
                  setStockFilter("ALL");
                  setSearchQuery("");
                  setPage(1);
                }}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Metal Quick Badges Strip */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Quick Filter:</span>
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setMetalFilter("ALL");
                setPage(1);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                metalFilter === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              All Products
            </button>
            <button
              type="button"
              onClick={() => {
                setMetalFilter("GOLD");
                setPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                metalFilter === "GOLD"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Gold</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMetalFilter("SILVER");
                setPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                metalFilter === "SILVER"
                  ? "bg-slate-700 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Disc className="w-3.5 h-3.5" />
              <span>Silver</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => fetchProducts(true)}>
            Try Again
          </Button>
        </div>
      )}

      {/* Products Table Card */}
      <Card noPadding>
        {loading && products.length === 0 ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-7 h-7 text-amber-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading bullion products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No products found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? `No products matched "${searchQuery}". Try a different keyword.`
                : "Your product catalog is currently empty. Click 'Add New Product' to create one."}
            </p>
            <Button size="sm" onClick={handleOpenCreate} className="bg-amber-600 text-white">
              <Plus className="w-4 h-4 mr-1" /> Add Product
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Product Info</th>
                  <th className="py-3 px-4">Metal Type</th>
                  <th className="py-3 px-4">Weight</th>
                  <th className="py-3 px-4">Direct Price</th>
                  <th className="py-3 px-4">Stock Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const isGold = p.metalType === "GOLD";
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product Info & Thumbnail */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center relative">
                            {p.imageUrl || (p.images && p.images[0]) ? (
                              <img
                                src={getMediaUrl(p.imageUrl || (p.images && p.images[0]))}
                                alt={p.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src =
                                    "https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=150&q=80";
                                }}
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-slate-300" />
                            )}
                            {p.images && p.images.length > 1 && (
                              <span className="absolute bottom-0 right-0 bg-slate-900/80 text-white text-[9px] font-bold px-1 rounded-tl">
                                +{p.images.length - 1}
                              </span>
                            )}
                          </div>
                          <div className="max-w-xs">
                            <p className="font-bold text-slate-900 text-xs truncate" title={p.name}>
                              {p.name}
                            </p>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5" title={p.description}>
                              {p.description || "Physical bullion item for doorstep delivery"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Metal Type */}
                      <td className="py-3.5 px-4">
                        {isGold ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Coins className="w-3 h-3 text-amber-600" />
                            <span>Gold (24K)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                            <Disc className="w-3 h-3 text-slate-500" />
                            <span>Silver (999)</span>
                          </span>
                        )}
                      </td>

                      {/* Weight */}
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {p.formattedWeight || `${p.weightGrams} gm`}
                      </td>

                      {/* Direct Price */}
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-sm text-slate-900">
                          {p.formattedPrice || `₹${Number(p.price).toLocaleString("en-IN")}`}
                        </span>
                      </td>

                      {/* Stock Status with direct toggle */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStock(p)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                            p.inStock
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100"
                          }`}
                          title="Click to toggle in-stock / out-of-stock"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${p.inStock ? "bg-emerald-500" : "bg-rose-500"}`} />
                          <span>{p.inStock ? "In Stock" : "Out of Stock"}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            title="Edit Product"
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteProductTarget(p)}
                            title="Delete Product"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Strictly Page-by-page Pagination Bar */}
        <div className="border-t border-slate-200">
          <Pagination
            currentPage={page}
            totalItems={pagination.total || products.length}
            pageSize={10}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </div>
      </Card>

      {/* ==================== CREATE / EDIT MODAL ==================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {modalMode === "CREATE" ? "Add New Bullion Product" : "Edit Product Details"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Set direct price, weight, metal type, and image for physical delivery
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-5 overflow-y-auto space-y-4 flex-1">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10g 24K Gold Minted Coin"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Metal Type & Weight (Row) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Metal Type *
                  </label>
                  <select
                    value={formData.metalType}
                    onChange={(e) => setFormData({ ...formData, metalType: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="GOLD">Gold (24K Pure)</option>
                    <option value="SILVER">Silver (999 Fine)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Weight (in grams) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="e.g. 5"
                    value={formData.weightGrams}
                    onChange={(e) => setFormData({ ...formData, weightGrams: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Direct Price (₹) & In Stock Toggle (Row) */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Direct Price (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="e.g. 38500"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      className="w-full pl-7 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-bold"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    User will pay exactly this amount
                  </p>
                </div>

                <div className="pt-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.inStock}
                      onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                      className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      In Stock (Available for buy)
                    </span>
                  </label>
                </div>
              </div>

              {/* Multi-Image Upload & Index Management (Max 4 images) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Product Images ({formData.images.length}/4) *
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Max 4 images • Under 600 KB each (auto-compressed)
                  </span>
                </div>

                {uploadError && (
                  <p className="text-[11px] text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{uploadError}</span>
                  </p>
                )}

                {/* Image Gallery Slots with Index Control */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    {formData.images.map((imgUrl, idx) => {
                      const isPrimary = idx === 0;
                      return (
                        <div
                          key={idx}
                          className={`relative group rounded-xl overflow-hidden border bg-white shadow-2xs flex flex-col transition-all ${
                            isPrimary ? "border-amber-400 ring-2 ring-amber-400/20" : "border-slate-200"
                          }`}
                        >
                          {/* Image Thumbnail */}
                          <div className="h-24 w-full bg-slate-100 flex items-center justify-center overflow-hidden">
                            <img
                              src={getMediaUrl(imgUrl)}
                              alt={`Product image ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=150&q=80";
                              }}
                            />
                          </div>

                          {/* Index Badge */}
                          <div className="absolute top-1.5 left-1.5">
                            {isPrimary ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white flex items-center gap-1 shadow-xs">
                                <Star className="w-2.5 h-2.5 fill-current" />
                                #1 Cover
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-900/70 text-white">
                                #{idx + 1}
                              </span>
                            )}
                          </div>

                          {/* Reorder / Action Buttons Toolbar */}
                          <div className="p-1.5 bg-white border-t border-slate-100 flex items-center justify-between gap-1">
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                title="Move Left (Show earlier)"
                                disabled={idx === 0}
                                onClick={() => handleMoveImage(idx, idx - 1)}
                                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded disabled:opacity-20 cursor-pointer"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                title="Move Right (Show later)"
                                disabled={idx === formData.images.length - 1}
                                onClick={() => handleMoveImage(idx, idx + 1)}
                                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded disabled:opacity-20 cursor-pointer"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="flex items-center gap-0.5">
                              {!isPrimary && (
                                <button
                                  type="button"
                                  title="Set as First / Cover Image"
                                  onClick={() => handleSetPrimary(idx)}
                                  className="p-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded cursor-pointer"
                                >
                                  <Star className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                type="button"
                                title="Delete Image"
                                onClick={() => handleRemoveImage(idx)}
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Upload Trigger Area (if less than 4 images) */}
                {formData.images.length < 4 && (
                  <div className="space-y-2">
                    <label className="border-2 border-dashed border-amber-300 hover:border-amber-500 hover:bg-amber-50/30 rounded-xl p-3.5 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors text-center bg-slate-50/50">
                      <input
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleFileSelect}
                        disabled={uploadingImages}
                        className="hidden"
                      />
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                        {uploadingImages ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          {uploadingImages ? "Compressing & Uploading to uploads/products..." : "Click to Upload Product Images"}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Select up to {4 - formData.images.length} more file(s) • Auto-compressed to &lt; 600 KB • Saved to uploads/products
                        </p>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Details regarding hallmark certification, assay packaging, purity..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                ></textarea>
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  {submitting ? "Saving..." : modalMode === "CREATE" ? "Add Product" : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      {deleteProductTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Product?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong>"{deleteProductTarget.name}"</strong>? This item will no longer appear in the app catalog.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteProductTarget(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
