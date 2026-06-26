"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, API_BASE_URL, Order, Product, Category, DeliveryArea, BulkOrder, Review, AuditLog } from "@/lib/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  BarChart3, 
  ShoppingBag, 
  Tag, 
  Settings, 
  Truck, 
  Calendar, 
  MessageSquare, 
  History,
  Check, 
  X, 
  Loader2, 
  AlertCircle,
  Eye,
  Trash2,
  Plus,
  RefreshCw,
  Power,
  Volume2,
  Search,
  SlidersHorizontal,
  Download,
  FileText
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Automatically clear toast after 3 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const [activeTab, setActiveTab] = useState<
    "overview" | "orders" | "products" | "settings" | "delivery" | "bulk" | "reviews" | "audit"
  >("overview");

  // Selected order details modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Search, filter, sorting, pagination states for Orders
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
  const [orderTypeFilter, setOrderTypeFilter] = useState("ALL");
  const [orderSortBy, setOrderSortBy] = useState("newest");
  const [orderPage, setOrderPage] = useState(1);
  const itemsPerPage = 10;

  // Search, filter, pagination states for Products
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("ALL");
  const [productPage, setProductPage] = useState(1);

  // Search, filter, pagination states for Bulk Inquiries
  const [bulkSearch, setBulkSearch] = useState("");
  const [bulkStatusFilter, setBulkStatusFilter] = useState("ALL");
  const [bulkPage, setBulkPage] = useState(1);

  // Search, pagination states for Audit Logs
  const [auditSearch, setAuditSearch] = useState("");
  const [auditPage, setAuditPage] = useState(1);

  // Confirmation modal states
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; type: "product" | "review" | "gallery" } | null>(null);
  const [statusTarget, setStatusTarget] = useState<{ id: number; status: string; type: "order" | "bulk" } | null>(null);

  // CSV download helper
  const downloadCsv = async (endpoint: string, filename: string) => {
    try {
      const token = localStorage.getItem("app_token");
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to download CSV");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Error downloading CSV: " + err.message);
    }
  };

  // New product form states
  const [showProductForm, setShowProductForm] = useState(false);
  const [prodName, setProdName] = useState("");
  const [prodNameTe, setProdNameTe] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodCat, setProdCat] = useState("1"); // Default to fresh chicken
  const [prodDesc, setProdDesc] = useState("");
  const [prodDescTe, setProdDescTe] = useState("");
  const [prodIsChicken, setProdIsChicken] = useState(true);

  // Business config settings form
  const [shopOpen, setShopOpen] = useState(true);
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementTextTe, setAnnouncementTextTe] = useState("");
  const [cookingCharge, setCookingCharge] = useState("");
  const [upiId, setUpiId] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // New delivery area form states
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [areaVillage, setAreaVillage] = useState("");
  const [areaCharge, setAreaCharge] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("app_token");
    const role = localStorage.getItem("app_role");
    
    if (!token || role !== "ROLE_ADMIN") {
      router.push("/login");
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch queries
  const { data: stats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ["adminStats"],
    queryFn: api.getAdminStats,
    enabled: !loading,
    refetchInterval: 15000, // Poll statistics every 15 seconds
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["adminOrders"],
    queryFn: api.getAdminOrders,
    enabled: !loading,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["adminProducts"],
    queryFn: api.getProducts,
    enabled: !loading,
  });

  const { data: settings = {} } = useQuery({
    queryKey: ["adminSettings"],
    queryFn: api.getSettings,
    enabled: !loading,
  });

  useEffect(() => {
    if (settings["shop_status"]) {
      setShopOpen(settings["shop_status"] === "OPEN");
      setCookingCharge(settings["cooking_charge_per_kg"] || "220");
      setUpiId(settings["upi_id"] || "9705525829@axl");
      setContactPhone(settings["contact_phone"] || "8977677193");
    }
  }, [settings]);

  // Announcements query
  const { data: announcements = [] } = useQuery({
    queryKey: ["adminAnnouncements"],
    queryFn: api.getAdminAnnouncements,
    enabled: !loading,
  });

  useEffect(() => {
    const activeAnn = announcements.find(a => a.isActive);
    if (activeAnn) {
      setAnnouncementText(activeAnn.text);
      setAnnouncementTextTe(activeAnn.textTelugu);
    }
  }, [announcements]);

  const { data: deliveryAreas = [], isLoading: areasLoading } = useQuery({
    queryKey: ["adminDeliveryAreas"],
    queryFn: api.getAdminDeliveryAreas,
    enabled: !loading,
  });

  const { data: bulkOrders = [], isLoading: bulkLoading } = useQuery({
    queryKey: ["adminBulkOrders"],
    queryFn: api.getAdminBulkOrders,
    enabled: !loading,
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ["adminReviews"],
    queryFn: api.getAdminReviews,
    enabled: !loading,
  });

  const { data: auditLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["adminAuditLogs"],
    queryFn: api.getAuditLogs,
    enabled: !loading,
  });

  // MUTATIONS
  // A. Order Status Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      showToast("Order status updated!");
    },
    onError: (err: any) => alert("Failed to update status: " + err.message)
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, payStatus }: { id: number; payStatus: string }) => api.updateOrderPayment(id, payStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
      showToast("Payment status updated!");
    },
    onError: (err: any) => alert("Failed to update payment: " + err.message)
  });

  // B. Product mutations
  const updatePriceMutation = useMutation({
    mutationFn: ({ id, details }: { id: number; details: any }) => api.updateProduct(id, details),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
      showToast("Product details updated!");
    },
    onError: (err: any) => alert("Failed to update price: " + err.message)
  });

  const deleteProductMutation = useMutation({
    mutationFn: api.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
      showToast("Product deleted!");
    },
    onError: (err: any) => alert("Failed to delete product: " + err.message)
  });

  const createProductMutation = useMutation({
    mutationFn: api.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
      setShowProductForm(false);
      setProdName("");
      setProdNameTe("");
      setProdPrice("");
      setProdDesc("");
      setProdDescTe("");
      showToast("New product created!");
    },
    onError: (err: any) => alert("Failed to create product: " + err.message)
  });

  // C. Settings mutations
  const updateSettingsMutation = useMutation({
    mutationFn: api.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminSettings"] });
      showToast("System configurations saved!");
    },
    onError: (err: any) => alert("Failed to save configuration: " + err.message)
  });

  const saveAnnouncementMutation = useMutation({
    // For simplicity, we just submit a new announcement or update setting
    mutationFn: (ann: any) => api.createAnnouncement(ann),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAnnouncements"] });
      showToast("Announcement published!");
    },
    onError: (err: any) => alert("Failed to publish: " + err.message)
  });

  // D. Delivery area mutations
  const createAreaMutation = useMutation({
    mutationFn: api.createDeliveryArea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDeliveryAreas"] });
      setShowAreaForm(false);
      setAreaVillage("");
      setAreaCharge("");
      showToast("Village charge rate added!");
    },
    onError: (err: any) => alert("Failed to add area: " + err.message)
  });

  const toggleAreaMutation = useMutation({
    mutationFn: ({ id, details }: { id: number; details: any }) => api.updateDeliveryArea(id, details),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDeliveryAreas"] });
      showToast("Delivery area updated!");
    },
    onError: (err: any) => alert("Failed to toggle area: " + err.message)
  });

  // E. Bulk order mutations
  const updateBulkMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.updateBulkOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminBulkOrders"] });
      showToast("Inquiry status updated!");
    },
    onError: (err: any) => alert("Failed: " + err.message)
  });

  // F. Reviews moderation
  const approveReviewMutation = useMutation({
    mutationFn: api.approveReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminReviews"] });
      showToast("Review approved!");
    },
    onError: (err: any) => alert("Failed: " + err.message)
  });

  const deleteReviewMutation = useMutation({
    mutationFn: api.deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminReviews"] });
      showToast("Review deleted!");
    },
    onError: (err: any) => alert("Failed: " + err.message)
  });

  // --- Filtered / Sorted / Paginated Data ---

  // 1. Orders
  const filteredOrders = orders
    .filter((o) => {
      const customerContact = o.user ? o.user.phone : o.guestPhone || "";
      const customerName = o.guestName || "";
      const matchesSearch = 
        o.id.toString().includes(orderSearch) ||
        customerContact.toLowerCase().includes(orderSearch.toLowerCase()) ||
        customerName.toLowerCase().includes(orderSearch.toLowerCase());
      
      const matchesStatus = orderStatusFilter === "ALL" || o.status === orderStatusFilter;
      const matchesType = orderTypeFilter === "ALL" || o.orderType === orderTypeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      if (orderSortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (orderSortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (orderSortBy === "total_desc") return b.grandTotal - a.grandTotal;
      if (orderSortBy === "total_asc") return a.grandTotal - b.grandTotal;
      return 0;
    });

  const totalOrderPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = filteredOrders.slice((orderPage - 1) * itemsPerPage, orderPage * itemsPerPage);

  // 2. Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.nameTelugu.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = 
      productCategoryFilter === "ALL" || 
      p.category.id.toString() === productCategoryFilter;
    return matchesSearch && matchesCategory;
  });
  
  const totalProductPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice((productPage - 1) * itemsPerPage, productPage * itemsPerPage);

  // 3. Bulk Catering Inquiries
  const filteredBulkOrders = bulkOrders.filter((b) => {
    const matchesSearch = 
      b.name.toLowerCase().includes(bulkSearch.toLowerCase()) ||
      b.phone.toLowerCase().includes(bulkSearch.toLowerCase()) ||
      b.eventType.toLowerCase().includes(bulkSearch.toLowerCase());
    const matchesStatus = bulkStatusFilter === "ALL" || b.status === bulkStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalBulkPages = Math.ceil(filteredBulkOrders.length / itemsPerPage) || 1;
  const paginatedBulkOrders = filteredBulkOrders.slice((bulkPage - 1) * itemsPerPage, bulkPage * itemsPerPage);

  // 4. Audit Logs
  const filteredAuditLogs = auditLogs.filter((l) => {
    const userPhone = l.user ? l.user.phone : "system";
    return (
      l.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
      userPhone.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.ipAddress.toLowerCase().includes(auditSearch.toLowerCase())
    );
  });

  const totalAuditPages = Math.ceil(filteredAuditLogs.length / itemsPerPage) || 1;
  const paginatedAuditLogs = filteredAuditLogs.slice((auditPage - 1) * itemsPerPage, auditPage * itemsPerPage);

  // SUBMIT HANDLERS
  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate({
      shop_status: shopOpen ? "OPEN" : "CLOSED",
      cooking_charge_per_kg: cookingCharge,
      upi_id: upiId,
      contact_phone: contactPhone,
    });
  };

  const handleAnnouncementPublish = (e: React.FormEvent) => {
    e.preventDefault();
    saveAnnouncementMutation.mutate({
      text: announcementText,
      textTelugu: announcementTextTe,
      isActive: true
    });
  };

  const handleProductCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createProductMutation.mutate({
      category: { id: parseInt(prodCat) },
      name: prodName,
      nameTelugu: prodNameTe,
      basePrice: parseFloat(prodPrice),
      description: prodDesc,
      descriptionTelugu: prodDescTe,
      isChicken: prodIsChicken,
      status: "AVAILABLE"
    });
  };

  const handleAreaCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createAreaMutation.mutate({
      villageName: areaVillage,
      chargeAmount: parseFloat(areaCharge),
      isActive: true
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  if (loading || statsLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-100">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      
      {/* Custom Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white py-3.5 px-6 rounded-2xl shadow-xl border border-slate-800 flex items-center space-x-3 text-xs font-black shadow-slate-950/20">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
          <span>{toastMessage}</span>
        </div>
      )}
      
      {/* 1. ADMIN HEADER BAR */}
      <div className="w-full bg-slate-900 text-white py-3 px-6 text-xs font-bold flex justify-between items-center border-b border-red-900">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping"></span>
          <span>ADMINISTRATOR PANEL • AMRUTHA CHICKEN CENTER</span>
        </div>
        <button 
          onClick={handleLogout}
          className="bg-red-950/60 hover:bg-red-800 text-red-100 border border-red-900/60 py-1 px-3.5 rounded transition-colors cursor-pointer"
        >
          Logout Admin
        </button>
      </div>

      <Header />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Admin Sidebar Links (Left Column) */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
              Dashboard Controls
            </h3>
            
            <nav className="flex flex-col space-y-1.5 text-xs font-bold text-slate-600">
              <button
                onClick={() => setActiveTab("overview")}
                className={`w-full text-left py-2.5 px-4 rounded-xl flex items-center space-x-2 transition-colors cursor-pointer ${
                  activeTab === "overview" ? "bg-primary text-white" : "hover:bg-slate-50"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Overview Stats</span>
              </button>
              
              <button
                onClick={() => setActiveTab("orders")}
                className={`w-full text-left py-2.5 px-4 rounded-xl flex items-center space-x-2 transition-colors cursor-pointer justify-between ${
                  activeTab === "orders" ? "bg-primary text-white" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Manage Orders</span>
                </div>
                {orders.filter(o => o.status === "PENDING").length > 0 && (
                  <span className="bg-secondary text-slate-900 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                    {orders.filter(o => o.status === "PENDING").length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("products")}
                className={`w-full text-left py-2.5 px-4 rounded-xl flex items-center space-x-2 transition-colors cursor-pointer ${
                  activeTab === "products" ? "bg-primary text-white" : "hover:bg-slate-50"
                }`}
              >
                <Tag className="w-4 h-4" />
                <span>Pricing & Stock</span>
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`w-full text-left py-2.5 px-4 rounded-xl flex items-center space-x-2 transition-colors cursor-pointer ${
                  activeTab === "settings" ? "bg-primary text-white" : "hover:bg-slate-50"
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Shop Configuration</span>
              </button>

              <button
                onClick={() => setActiveTab("delivery")}
                className={`w-full text-left py-2.5 px-4 rounded-xl flex items-center space-x-2 transition-colors cursor-pointer ${
                  activeTab === "delivery" ? "bg-primary text-white" : "hover:bg-slate-50"
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Delivery Zones</span>
              </button>

              <button
                onClick={() => setActiveTab("bulk")}
                className={`w-full text-left py-2.5 px-4 rounded-xl flex items-center space-x-2 transition-colors cursor-pointer justify-between ${
                  activeTab === "bulk" ? "bg-primary text-white" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Bulk Inquiries</span>
                </div>
                {bulkOrders.filter(b => b.status === "PENDING").length > 0 && (
                  <span className="bg-secondary text-slate-900 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    {bulkOrders.filter(b => b.status === "PENDING").length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("reviews")}
                className={`w-full text-left py-2.5 px-4 rounded-xl flex items-center space-x-2 transition-colors cursor-pointer ${
                  activeTab === "reviews" ? "bg-primary text-white" : "hover:bg-slate-50"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Reviews Moderation</span>
              </button>

              <button
                onClick={() => setActiveTab("audit")}
                className={`w-full text-left py-2.5 px-4 rounded-xl flex items-center space-x-2 transition-colors cursor-pointer ${
                  activeTab === "audit" ? "bg-primary text-white" : "hover:bg-slate-50"
                }`}
              >
                <History className="w-4 h-4" />
                <span>System Logs</span>
              </button>
            </nav>
          </div>

          {/* Admin Content Area (Right Columns) */}
          <div className="lg:col-span-9 space-y-6">

            {/* A. OVERVIEW STATS TAB */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                
                {/* Metrics Deck */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Revenue</span>
                    <span className="text-2xl font-black text-slate-800 block mt-1">₹{stats.totalRevenue || 0}</span>
                    <p className="text-[10px] text-green-600 font-bold mt-2">Delivered orders sum</p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Today's Orders</span>
                    <span className="text-2xl font-black text-slate-800 block mt-1">{stats.todayOrdersCount || 0}</span>
                    <p className="text-[10px] text-slate-500 font-bold mt-2">Placed since 12:00 AM</p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Customers</span>
                    <span className="text-2xl font-black text-slate-800 block mt-1">{stats.totalCustomers || 0}</span>
                    <p className="text-[10px] text-slate-500 font-bold mt-2">Registered directory count</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Top villages list */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                      Top Delivery Villages (Orders count)
                    </h3>
                    {stats.topVillages && Object.keys(stats.topVillages).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(stats.topVillages).map(([v, count]) => (
                          <div key={v} className="flex justify-between items-center text-xs text-slate-600 font-semibold border-b border-slate-50 pb-2">
                            <span>{v}</span>
                            <span className="font-bold text-slate-800">{count as any} orders</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-6">No delivery order statistics available.</p>
                    )}
                  </div>

                  {/* Popular Products list */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                      Popular Menu Products
                    </h3>
                    {stats.popularProducts && Object.keys(stats.popularProducts).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(stats.popularProducts).map(([name, count]) => (
                          <div key={name} className="flex justify-between items-center text-xs text-slate-600 font-semibold border-b border-slate-50 pb-2">
                            <span>{name}</span>
                            <span className="font-bold text-slate-800">{count as any} times</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-6">No ordering statistics available.</p>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* B. MANAGE ORDERS TAB */}
            {activeTab === "orders" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h2 className="text-base font-black text-slate-800">
                    Live Customer Orders
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => downloadCsv("/api/admin/orders/csv", "orders.csv")}
                      className="text-xs font-bold text-slate-600 hover:text-white flex items-center space-x-1.5 border border-slate-200 rounded-full px-3 py-1 cursor-pointer hover:bg-slate-700 bg-slate-50 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>
                    <button 
                      onClick={() => queryClient.invalidateQueries({ queryKey: ["adminOrders"] })}
                      className="text-xs font-bold text-slate-500 hover:text-primary flex items-center space-x-1 border border-slate-200 rounded-full px-3 py-1 cursor-pointer hover:bg-slate-50"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                {/* Search, Filter, Sort Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search Order ID, Phone, Name..."
                      value={orderSearch}
                      onChange={(e) => {
                        setOrderSearch(e.target.value);
                        setOrderPage(1);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-xs font-semibold text-slate-700 placeholder:text-slate-400 outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => {
                        setOrderStatusFilter(e.target.value);
                        setOrderPage(1);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-600 outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="PENDING">PENDING</option>
                      <option value="ACCEPTED">ACCEPTED</option>
                      <option value="PREPARING">PREPARING</option>
                      <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                  <div>
                    <select
                      value={orderTypeFilter}
                      onChange={(e) => {
                        setOrderTypeFilter(e.target.value);
                        setOrderPage(1);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-600 outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="ALL">All Order Types</option>
                      <option value="DELIVERY">DELIVERY</option>
                      <option value="PICKUP">PICKUP</option>
                    </select>
                  </div>
                  <div>
                    <select
                      value={orderSortBy}
                      onChange={(e) => {
                        setOrderSortBy(e.target.value);
                        setOrderPage(1);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-600 outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="newest">Sort by: Newest</option>
                      <option value="oldest">Sort by: Oldest</option>
                      <option value="total_desc">Sort by: Total (High to Low)</option>
                      <option value="total_asc">Sort by: Total (Low to High)</option>
                    </select>
                  </div>
                </div>

                {ordersLoading ? (
                  <div className="text-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-10">No orders found matching the filter criteria.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-400">
                            <th className="p-3">Order ID</th>
                            <th className="p-3">Customer</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Amount</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Payment</th>
                            <th className="p-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedOrders.map((o) => (
                            <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                              <td className="p-3 font-extrabold text-slate-800">#{o.id}</td>
                              <td className="p-3">
                                <span className="font-semibold block">{o.guestName || (o.user && o.user.phone) || "Guest"}</span>
                                <span className="text-[10px] text-slate-400 font-medium block">{o.guestPhone || (o.user && o.user.phone)}</span>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                                  o.orderType === "DELIVERY" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                                }`}>
                                  {o.orderType}
                                </span>
                              </td>
                              <td className="p-3 font-bold text-slate-900">₹{o.grandTotal}</td>
                              <td className="p-3">
                                <select
                                  value={o.status}
                                  onChange={(e) => {
                                    const nextStatus = e.target.value;
                                    if (nextStatus === "DELIVERED" || nextStatus === "CANCELLED") {
                                      setStatusTarget({ id: o.id, status: nextStatus, type: "order" });
                                    } else {
                                      updateStatusMutation.mutate({ id: o.id, status: nextStatus });
                                    }
                                  }}
                                  className={`font-bold rounded p-1 outline-none text-[10px] cursor-pointer ${
                                    o.status === "DELIVERED"
                                      ? "bg-green-100 text-green-700 border border-green-200"
                                      : o.status === "CANCELLED"
                                      ? "bg-red-100 text-red-700 border border-red-200"
                                      : "bg-amber-100 text-amber-700 border border-amber-200"
                                  }`}
                                >
                                  <option value="PENDING">PENDING</option>
                                  <option value="ACCEPTED">ACCEPTED</option>
                                  <option value="PREPARING">PREPARING</option>
                                  <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                                  <option value="DELIVERED">DELIVERED</option>
                                  <option value="CANCELLED">CANCELLED</option>
                                </select>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center space-x-1.5">
                                  <select
                                    value={o.paymentStatus}
                                    onChange={(e) => updatePaymentMutation.mutate({ id: o.id, payStatus: e.target.value })}
                                    className={`font-bold rounded p-1 outline-none text-[10px] cursor-pointer ${
                                      o.paymentStatus === "VERIFIED"
                                        ? "bg-green-100 text-green-700"
                                        : o.paymentStatus === "FAILED"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-slate-100 text-slate-500"
                                    }`}
                                  >
                                    <option value="PENDING">PENDING</option>
                                    <option value="VERIFIED">VERIFIED</option>
                                    <option value="FAILED">FAILED</option>
                                  </select>
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => setSelectedOrder(o)}
                                  className="bg-slate-100 hover:bg-slate-200 p-1.5 rounded text-slate-700 cursor-pointer"
                                  title="View Details"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-slate-100 text-xs text-slate-500 gap-3">
                      <div>
                        Showing {filteredOrders.length > 0 ? (orderPage - 1) * itemsPerPage + 1 : 0} to{" "}
                        {Math.min(orderPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => setOrderPage((p) => Math.max(p - 1, 1))}
                          disabled={orderPage === 1}
                          className="px-3 py-1.5 border border-slate-200 rounded-lg font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Previous
                        </button>
                        <span className="font-bold text-slate-700 px-2">
                          Page {orderPage} of {totalOrderPages}
                        </span>
                        <button
                          onClick={() => setOrderPage((p) => Math.min(p + 1, totalOrderPages))}
                          disabled={orderPage === totalOrderPages}
                          className="px-3 py-1.5 border border-slate-200 rounded-lg font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Order Detail Modal Pop-up */}
                {selectedOrder && (
                  <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto relative animate-fadeIn text-left">
                      <button
                        onClick={() => setSelectedOrder(null)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-primary cursor-pointer p-1 rounded-full hover:bg-slate-100"
                      >
                        <X className="w-5 h-5" />
                      </button>

                      <h3 className="font-extrabold text-slate-800 text-base mb-4 border-b border-slate-100 pb-2">
                        Details for Order #{selectedOrder.id}
                      </h3>

                      <div className="space-y-4 text-xs">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-bold text-slate-400 uppercase text-[9px] block">Customer</span>
                            <span className="font-bold text-slate-800 block mt-0.5">{selectedOrder.guestName || "Guest"}</span>
                            <span className="text-slate-500 font-semibold block">{selectedOrder.guestPhone}</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-400 uppercase text-[9px] block">Date</span>
                            <span className="font-semibold text-slate-700 block mt-0.5">
                              {new Date(selectedOrder.createdAt).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>

                        {selectedOrder.deliveryAddress && (
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                            <span className="font-black text-slate-700 block mb-1">Delivery Address:</span>
                            <p className="text-slate-600 font-medium">{selectedOrder.deliveryVillage}, {selectedOrder.deliveryAddress}</p>
                            {selectedOrder.deliveryLandmark && (
                              <p className="text-[10px] text-slate-400 mt-1">Landmark: {selectedOrder.deliveryLandmark}</p>
                            )}
                          </div>
                        )}

                        <div>
                          <span className="font-bold text-slate-400 uppercase text-[9px] block mb-2">Order Line Items</span>
                          <div className="space-y-2 border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                            {selectedOrder.orderItems.map((item) => (
                              <div key={item.id} className="flex justify-between items-center text-xs text-slate-700">
                                <div>
                                  <span className="font-extrabold">{item.productName}</span> 
                                  <span className="text-slate-400 ml-1.5">({item.quantityValue}{item.quantityUnit})</span>
                                  {item.cookingApplied && (
                                    <span className="text-[9px] bg-red-100 text-primary font-black px-1.5 py-0.5 rounded ml-2">
                                      Cooked Service
                                    </span>
                                  )}
                                </div>
                                <span className="font-bold text-slate-900">₹{item.subtotal}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5 border-t border-slate-100 pt-3">
                          <div className="flex justify-between">
                            <span>Item Total:</span>
                            <span>₹{selectedOrder.itemTotal}</span>
                          </div>
                          {selectedOrder.cookingCharge > 0 && (
                            <div className="flex justify-between">
                              <span>Cooking Charge:</span>
                              <span>₹{selectedOrder.cookingCharge}</span>
                            </div>
                          )}
                          {selectedOrder.deliveryCharge > 0 && (
                            <div className="flex justify-between">
                              <span>Delivery Fee:</span>
                              <span>₹{selectedOrder.deliveryCharge}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-black text-slate-800 text-sm border-t border-slate-100 pt-2 mt-2">
                            <span>Grand Total:</span>
                            <span className="text-primary">₹{selectedOrder.grandTotal}</span>
                          </div>
                        </div>

                        {selectedOrder.notes && (
                          <div className="border-t border-slate-100 pt-2">
                            <span className="font-bold text-slate-400 uppercase text-[9px] block">Customer Notes</span>
                            <p className="italic text-slate-600">"{selectedOrder.notes}"</p>
                          </div>
                        )}

                        {/* UPI Payment screenshot viewer */}
                        {selectedOrder.upiScreenshotUrl && (
                          <div className="border-t border-slate-100 pt-3 text-center">
                            <span className="font-bold text-slate-400 uppercase text-[9px] block text-left mb-2">UPI screenshot</span>
                            <div className="relative w-full h-[220px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                              <img
                                src={selectedOrder.upiScreenshotUrl}
                                alt="UPI Transaction Screenshot"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* C. PRODUCTS & PRICING TAB */}
            {activeTab === "products" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h2 className="text-base font-black text-slate-800">
                    Product Pricing & Inventory
                  </h2>
                  <button
                    onClick={() => setShowProductForm(!showProductForm)}
                    className="text-xs font-bold bg-primary hover:bg-primary-hover text-white py-1.5 px-3 rounded-full flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Product</span>
                  </button>
                </div>

                {/* Create Product Form */}
                {showProductForm && (
                  <form onSubmit={handleProductCreate} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Category *</label>
                        <select
                          value={prodCat}
                          onChange={(e) => setProdCat(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold outline-none focus:border-primary cursor-pointer"
                        >
                          <option value="1">Fresh Chicken</option>
                          <option value="2">Cooked Food Services</option>
                          <option value="3">Chapathis</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">English Name *</label>
                        <input
                          type="text"
                          required
                          value={prodName}
                          onChange={(e) => setProdName(e.target.value)}
                          placeholder="e.g. Whole Chicken"
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold outline-none focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Telugu Name *</label>
                        <input
                          type="text"
                          required
                          value={prodNameTe}
                          onChange={(e) => setProdNameTe(e.target.value)}
                          placeholder="e.g. పూర్తి చికెన్"
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Base Price (Per KG / Pack) *</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={prodPrice}
                          onChange={(e) => setProdPrice(e.target.value)}
                          placeholder="e.g. 240.00"
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold outline-none focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1 col-span-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Is Chicken Product? *</label>
                        <div className="flex items-center space-x-4 pt-2">
                          <label className="flex items-center space-x-2 text-xs font-bold text-slate-600 cursor-pointer">
                            <input
                              type="radio"
                              name="isChicken"
                              checked={prodIsChicken === true}
                              onChange={() => setProdIsChicken(true)}
                              className="w-4 h-4 accent-primary"
                            />
                            <span>Yes (Applies cooking charge option)</span>
                          </label>
                          <label className="flex items-center space-x-2 text-xs font-bold text-slate-600 cursor-pointer">
                            <input
                              type="radio"
                              name="isChicken"
                              checked={prodIsChicken === false}
                              onChange={() => setProdIsChicken(false)}
                              className="w-4 h-4 accent-primary"
                            />
                            <span>No (Raw non-chicken or plain foods)</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">English Description</label>
                        <textarea
                          value={prodDesc}
                          onChange={(e) => setProdDesc(e.target.value)}
                          placeholder="Describe the product..."
                          rows={2}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold outline-none focus:border-primary"
                        ></textarea>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Telugu Description</label>
                        <textarea
                          value={prodDescTe}
                          onChange={(e) => setProdDescTe(e.target.value)}
                          placeholder="తెలుగు వివరణ..."
                          rows={2}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold outline-none focus:border-primary"
                        ></textarea>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={createProductMutation.isPending}
                        className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs py-2 px-5 rounded-full flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {createProductMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        <span>Save Product</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Search & Category Filter Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search product name..."
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setProductPage(1);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-xs font-semibold text-slate-700 placeholder:text-slate-400 outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <select
                      value={productCategoryFilter}
                      onChange={(e) => {
                        setProductCategoryFilter(e.target.value);
                        setProductPage(1);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-600 outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="ALL">All Categories</option>
                      <option value="1">Fresh Chicken</option>
                      <option value="2">Cooked Food Services</option>
                      <option value="3">Chapathis</option>
                    </select>
                  </div>
                </div>

                {productsLoading ? (
                  <div className="text-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-10">No products found matching the criteria.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      {paginatedProducts.map((p) => (
                        <div 
                          key={p.id}
                          className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-slate-50/20 hover:border-slate-300 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                        >
                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-center space-x-2">
                              <span className="font-extrabold text-slate-800 text-sm">{p.name}</span>
                              <span className="text-slate-400 font-bold">({p.nameTelugu})</span>
                              <span className="text-[9px] bg-slate-100 text-slate-500 font-black px-2 py-0.5 rounded uppercase">
                                {p.category.name}
                              </span>
                            </div>
                            <p className="text-slate-500 font-medium">{p.description}</p>
                            <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-bold">
                              <span>Base Rate: <strong className="text-slate-700">₹{p.basePrice}</strong></span>
                              <span>•</span>
                              <span>Cooking applies: <strong className={p.isChicken ? "text-red-600" : "text-slate-500"}>{p.isChicken ? "Yes" : "No"}</strong></span>
                            </div>
                          </div>

                          {/* Price update + availability toggle actions */}
                          <div className="flex items-center space-x-3 w-full sm:w-auto shrink-0 justify-end">
                            <div className="flex items-center space-x-1">
                              <span className="text-xs font-bold text-slate-500">₹</span>
                              <input
                                type="number"
                                defaultValue={p.basePrice}
                                onBlur={(e) => {
                                  const newPrice = parseFloat(e.target.value);
                                  if (newPrice !== p.basePrice) {
                                    updatePriceMutation.mutate({ id: p.id, details: { ...p, basePrice: newPrice } });
                                  }
                                }}
                                className="w-16 bg-white border border-slate-200 rounded p-1.5 text-xs font-bold outline-none text-slate-800 focus:border-primary text-center"
                              />
                            </div>

                            <select
                              value={p.status}
                              onChange={(e) => updatePriceMutation.mutate({ id: p.id, details: { ...p, status: e.target.value } })}
                              className={`font-bold rounded p-1.5 outline-none text-[10px] cursor-pointer ${
                                p.status === "AVAILABLE" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                              }`}
                            >
                              <option value="AVAILABLE">AVAILABLE</option>
                              <option value="LIMITED_STOCK">LIMITED STOCK</option>
                              <option value="OUT_OF_STOCK">OUT OF STOCK</option>
                            </select>

                            <button
                              onClick={() => setDeleteTarget({ id: p.id, type: "product" })}
                              className="p-2 border border-slate-200 hover:border-red-200 rounded-lg hover:bg-red-50 text-slate-400 hover:text-primary transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-slate-100 text-xs text-slate-500 gap-3">
                      <div>
                        Showing {filteredProducts.length > 0 ? (productPage - 1) * itemsPerPage + 1 : 0} to{" "}
                        {Math.min(productPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => setProductPage((p) => Math.max(p - 1, 1))}
                          disabled={productPage === 1}
                          className="px-3 py-1.5 border border-slate-200 rounded-lg font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Previous
                        </button>
                        <span className="font-bold text-slate-700 px-2">
                          Page {productPage} of {totalProductPages}
                        </span>
                        <button
                          onClick={() => setProductPage((p) => Math.min(p + 1, totalProductPages))}
                          disabled={productPage === totalProductPages}
                          className="px-3 py-1.5 border border-slate-200 rounded-lg font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* D. SYSTEM SETTINGS TAB */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                
                {/* Shop availability and system settings form */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                  <h2 className="text-base font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center space-x-1.5">
                    <Settings className="w-5 h-5 text-primary" />
                    <span>Business Control Panel</span>
                  </h2>

                  <form onSubmit={handleConfigSubmit} className="space-y-4 max-w-md">
                    
                    {/* OPEN/CLOSED TOGGLE */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <div className="space-y-0.5">
                        <span className="text-xs font-black text-slate-800 block">Shop Open / Closed Status</span>
                        <p className="text-[10px] text-slate-500 font-medium">When closed, customers cannot place orders.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShopOpen(!shopOpen)}
                        className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${
                          shopOpen ? "bg-green-600" : "bg-slate-400"
                        }`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transition-transform ${
                          shopOpen ? "translate-x-6" : "translate-x-0"
                        }`} />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Base Cooking Charge rate (₹/KG) *</label>
                      <input
                        type="number"
                        required
                        value={cookingCharge}
                        onChange={(e) => setCookingCharge(e.target.value)}
                        placeholder="220"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Shop UPI ID for checkout *</label>
                      <input
                        type="text"
                        required
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="9705525829@axl"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Shop Customer Support Phone *</label>
                      <input
                        type="text"
                        required
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="8977677193"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none focus:border-primary"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={updateSettingsMutation.isPending}
                        className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs py-3 px-6 rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
                      >
                        {updateSettingsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        <span>Save Configuration</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Announcement Editor */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                  <h2 className="text-base font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center space-x-1.5">
                    <Volume2 className="w-5 h-5 text-primary" />
                    <span>Top Banner Announcement</span>
                  </h2>

                  <form onSubmit={handleAnnouncementPublish} className="space-y-4 max-w-lg">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Announcement text (English)</label>
                      <input
                        type="text"
                        required
                        value={announcementText}
                        onChange={(e) => setAnnouncementText(e.target.value)}
                        placeholder="e.g. Fresh Chicken available! Holiday Special discount."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Announcement text (Telugu)</label>
                      <input
                        type="text"
                        required
                        value={announcementTextTe}
                        onChange={(e) => setAnnouncementTextTe(e.target.value)}
                        placeholder="e.g. తాజా చికెన్ అందుబాటులో ఉంది!"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none focus:border-primary"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={saveAnnouncementMutation.isPending}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 px-6 rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
                      >
                        {saveAnnouncementMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        <span>Publish Announcement</span>
                      </button>
                    </div>
                  </form>
                </div>

              </div>
            )}

            {/* E. DELIVERY VILLAGES TAB */}
            {activeTab === "delivery" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h2 className="text-base font-black text-slate-800">
                    Delivery Zones & Charges
                  </h2>
                  <button
                    onClick={() => setShowAreaForm(!showAreaForm)}
                    className="text-xs font-bold bg-primary hover:bg-primary-hover text-white py-1.5 px-3 rounded-full flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Village</span>
                  </button>
                </div>

                {/* Add Village Form */}
                {showAreaForm && (
                  <form onSubmit={handleAreaCreate} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Village Name *</label>
                        <input
                          type="text"
                          required
                          value={areaVillage}
                          onChange={(e) => setAreaVillage(e.target.value)}
                          placeholder="e.g. Sunket"
                          className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Delivery Charge (₹) *</label>
                        <input
                          type="number"
                          required
                          value={areaCharge}
                          onChange={(e) => setAreaCharge(e.target.value)}
                          placeholder="e.g. 100"
                          className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAreaForm(false)}
                        className="text-xs font-bold text-slate-500 py-1.5 px-3 rounded-full cursor-pointer hover:bg-slate-200/50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={createAreaMutation.isPending}
                        className="text-xs font-bold bg-slate-900 text-white py-1.5 px-4 rounded-full flex items-center space-x-1 cursor-pointer hover:bg-slate-800"
                      >
                        {createAreaMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        <span>Save Village</span>
                      </button>
                    </div>
                  </form>
                )}

                {areasLoading ? (
                  <div className="text-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-400">
                          <th className="p-3">Village Name</th>
                          <th className="p-3">Delivery Fee</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deliveryAreas.map((area) => (
                          <tr key={area.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="p-3 font-extrabold text-slate-800">{area.villageName}</td>
                            <td className="p-3 font-bold text-slate-700">₹{area.chargeAmount}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${
                                area.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                              }`}>
                                {area.isActive ? "Active" : "Suspended"}
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-2">
                              <button
                                onClick={() => toggleAreaMutation.mutate({ 
                                  id: area.id, 
                                  details: { ...area, isActive: !area.isActive } 
                                })}
                                className="text-xs font-bold text-slate-500 hover:text-primary transition-colors cursor-pointer border border-slate-200 rounded px-2.5 py-1 hover:bg-slate-50"
                              >
                                Toggle State
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* F. BULK EVENT INQUIRIES TAB */}
            {activeTab === "bulk" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h2 className="text-base font-black text-slate-800">
                    Event Catering Inquiries
                  </h2>
                  <button 
                    onClick={() => downloadCsv("/api/admin/bulk-orders/csv", "bulk_inquiries.csv")}
                    className="text-xs font-bold text-slate-600 hover:text-white flex items-center space-x-1.5 border border-slate-200 rounded-full px-3 py-1 cursor-pointer hover:bg-slate-700 bg-slate-50 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>

                {/* Search & Status Filter Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search Name, Phone, Event..."
                      value={bulkSearch}
                      onChange={(e) => {
                        setBulkSearch(e.target.value);
                        setBulkPage(1);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-xs font-semibold text-slate-700 placeholder:text-slate-400 outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <select
                      value={bulkStatusFilter}
                      onChange={(e) => {
                        setBulkStatusFilter(e.target.value);
                        setBulkPage(1);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-600 outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="PENDING">PENDING</option>
                      <option value="CONTACTED">CONTACTED</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                </div>

                {bulkLoading ? (
                  <div className="text-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </div>
                ) : filteredBulkOrders.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-10">No catering inquiries found matching filters.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-4">
                      {paginatedBulkOrders.map((b) => (
                        <div 
                          key={b.id} 
                          className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-slate-50/15 flex flex-col sm:flex-row justify-between items-start gap-4 hover:border-slate-300 transition-all"
                        >
                          <div className="space-y-2 text-xs">
                            <div className="flex items-center space-x-2">
                              <span className="font-extrabold text-slate-800 text-sm">Catering #{b.id} - {b.name}</span>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                b.status === "COMPLETED"
                                  ? "bg-green-100 text-green-700"
                                  : b.status === "CONTACTED"
                                  ? "bg-blue-100 text-blue-700"
                                  : b.status === "CANCELLED"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}>
                                {b.status}
                              </span>
                            </div>
                            <p className="text-slate-600 font-semibold">
                              Phone: <a href={`tel:${b.phone}`} className="text-primary hover:underline">{b.phone}</a>
                            </p>
                            <p className="text-slate-600 font-semibold">
                              Event: <strong className="text-slate-800">{b.eventType}</strong> on {new Date(b.eventDate).toLocaleDateString("en-IN")}
                            </p>
                            <p className="text-slate-600 font-semibold">
                              Estimated weights: <strong className="text-slate-800">{b.expectedQuantity}</strong>
                            </p>
                            {b.notes && (
                              <p className="italic text-slate-400 text-[11px] leading-relaxed">"{b.notes}"</p>
                            )}
                          </div>

                          <div className="flex flex-row sm:flex-col gap-2 shrink-0 w-full sm:w-auto justify-end">
                            <select
                              value={b.status}
                              onChange={(e) => {
                                const nextStatus = e.target.value;
                                if (nextStatus === "COMPLETED" || nextStatus === "CANCELLED") {
                                  setStatusTarget({ id: b.id, status: nextStatus, type: "bulk" });
                                } else {
                                  updateBulkMutation.mutate({ id: b.id, status: nextStatus });
                                }
                              }}
                              className="bg-white border border-slate-200 rounded p-1.5 font-bold outline-none text-[10px] cursor-pointer"
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="CONTACTED">CONTACTED</option>
                              <option value="COMPLETED">COMPLETED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-slate-100 text-xs text-slate-500 gap-3">
                      <div>
                        Showing {filteredBulkOrders.length > 0 ? (bulkPage - 1) * itemsPerPage + 1 : 0} to{" "}
                        {Math.min(bulkPage * itemsPerPage, filteredBulkOrders.length)} of {filteredBulkOrders.length} inquiries
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => setBulkPage((p) => Math.max(p - 1, 1))}
                          disabled={bulkPage === 1}
                          className="px-3 py-1.5 border border-slate-200 rounded-lg font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Previous
                        </button>
                        <span className="font-bold text-slate-700 px-2">
                          Page {bulkPage} of {totalBulkPages}
                        </span>
                        <button
                          onClick={() => setBulkPage((p) => Math.min(p + 1, totalBulkPages))}
                          disabled={bulkPage === totalBulkPages}
                          className="px-3 py-1.5 border border-slate-200 rounded-lg font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* G. REVIEWS TAB */}
            {activeTab === "reviews" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <h2 className="text-base font-black text-slate-800 border-b border-slate-100 pb-2">
                  Reviews Moderation Queue
                </h2>

                {reviewsLoading ? (
                  <div className="text-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </div>
                ) : reviews.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-10">No customer reviews written yet.</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((r) => (
                      <div 
                        key={r.id}
                        className="border border-slate-200 rounded-xl p-4 flex justify-between items-start gap-4 hover:bg-slate-50/10"
                      >
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center space-x-1">
                            <span className="font-extrabold text-slate-800">{r.customerName}</span>
                            <span className="text-slate-400">({r.rating} stars)</span>
                            {r.isApproved && (
                              <span className="text-[9px] bg-green-100 text-green-700 font-extrabold px-1.5 py-0.5 rounded uppercase">
                                Approved
                              </span>
                            )}
                          </div>
                          <p className="text-slate-500 italic">"{r.comment}"</p>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          {!r.isApproved && (
                            <button
                              onClick={() => approveReviewMutation.mutate(r.id)}
                              className="text-xs font-bold bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-full cursor-pointer transition-colors"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteTarget({ id: r.id, type: "review" })}
                            className="p-1 border border-slate-200 hover:border-red-200 rounded hover:bg-red-50 text-slate-400 hover:text-primary transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* H. AUDIT LOGS TAB */}
            {activeTab === "audit" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h2 className="text-base font-black text-slate-800">
                    System Audit Logs
                  </h2>
                  <button 
                    onClick={() => downloadCsv("/api/admin/audit-logs/csv", "audit_logs.csv")}
                    className="text-xs font-bold text-slate-600 hover:text-white flex items-center space-x-1.5 border border-slate-200 rounded-full px-3 py-1 cursor-pointer hover:bg-slate-700 bg-slate-50 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>

                {/* Search Control */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search audit actions, details, IP address..."
                      value={auditSearch}
                      onChange={(e) => {
                        setAuditSearch(e.target.value);
                        setAuditPage(1);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-xs font-semibold text-slate-700 placeholder:text-slate-400 outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {logsLoading ? (
                  <div className="text-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </div>
                ) : filteredAuditLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-10">No audit logs found matching filters.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {paginatedAuditLogs.map((log) => (
                        <div key={log.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                            <span>Action: <strong className="text-primary">{log.action}</strong></span>
                            <span>{new Date(log.createdAt).toLocaleString("en-IN")}</span>
                          </div>
                          <p className="text-slate-600 font-semibold">{log.details}</p>
                          <p className="text-[10px] text-slate-400 font-medium">IP Address: {log.ipAddress}</p>
                        </div>
                      ))}
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-slate-100 text-xs text-slate-500 gap-3">
                      <div>
                        Showing {filteredAuditLogs.length > 0 ? (auditPage - 1) * itemsPerPage + 1 : 0} to{" "}
                        {Math.min(auditPage * itemsPerPage, filteredAuditLogs.length)} of {filteredAuditLogs.length} logs
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => setAuditPage((p) => Math.max(p - 1, 1))}
                          disabled={auditPage === 1}
                          className="px-3 py-1.5 border border-slate-200 rounded-lg font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Previous
                        </button>
                        <span className="font-bold text-slate-700 px-2">
                          Page {auditPage} of {totalAuditPages}
                        </span>
                        <button
                          onClick={() => setAuditPage((p) => Math.min(p + 1, totalAuditPages))}
                          disabled={auditPage === totalAuditPages}
                          className="px-3 py-1.5 border border-slate-200 rounded-lg font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Delete Confirmation Modal */}
          {deleteTarget && (
            <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-w-sm w-full relative animate-fadeIn text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-primary mx-auto animate-pulse" />
                <h3 className="text-base font-black text-slate-800">Confirm Critical Deletion</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to permanently delete this {deleteTarget.type}? This action is irreversible and will delete associated database records.
                </p>
                <div className="flex space-x-3 justify-center pt-2">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className="px-4 py-2 border border-slate-200 rounded-full font-bold text-xs hover:bg-slate-50 text-slate-500 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (deleteTarget.type === "product") {
                        deleteProductMutation.mutate(deleteTarget.id);
                      } else if (deleteTarget.type === "review") {
                        deleteReviewMutation.mutate(deleteTarget.id);
                      }
                      setDeleteTarget(null);
                    }}
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-full font-bold text-xs cursor-pointer"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Status Change Confirmation Modal */}
          {statusTarget && (
            <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-w-sm w-full relative animate-fadeIn text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
                <h3 className="text-base font-black text-slate-800">Confirm Status Shift</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to change the status to <strong className="text-slate-800">{statusTarget.status}</strong>? This is a critical status shift and will notify the customer.
                </p>
                <div className="flex space-x-3 justify-center pt-2">
                  <button
                    onClick={() => setStatusTarget(null)}
                    className="px-4 py-2 border border-slate-200 rounded-full font-bold text-xs hover:bg-slate-50 text-slate-500 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (statusTarget.type === "order") {
                        updateStatusMutation.mutate({ id: statusTarget.id, status: statusTarget.status });
                      } else if (statusTarget.type === "bulk") {
                        updateBulkMutation.mutate({ id: statusTarget.id, status: statusTarget.status });
                      }
                      setStatusTarget(null);
                    }}
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-full font-bold text-xs cursor-pointer"
                  >
                    Confirm Update
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
