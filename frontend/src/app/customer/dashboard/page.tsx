"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, Address, Order, Product } from "@/lib/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCart } from "@/context/CartContext";
import { 
  User, 
  MapPin, 
  ShoppingBag, 
  LogOut, 
  Plus, 
  Trash2, 
  Check, 
  Loader2, 
  AlertCircle,
  Eye,
  RefreshCw
} from "lucide-react";
import Link from "next/link";

export default function CustomerDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"profile" | "addresses" | "orders">("orders");
  const [loading, setLoading] = useState(true);

  // Cart operations
  const { addToCart, clearCart } = useCart();

  const handleReorder = (order: Order) => {
    clearCart();
    order.orderItems.forEach((item) => {
      addToCart(item.product, item.quantityValue, item.quantityUnit, item.cookingApplied);
    });
    alert("Previous order copied to your cart! Redirecting to checkout...");
    router.push("/checkout");
  };

  // Address form states
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [villageName, setVillageName] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [landmark, setLandmark] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  // Profile edit states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("en");

  useEffect(() => {
    const token = localStorage.getItem("app_token");
    if (!token) {
      router.push("/login");
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch queries
  const { data: profile = {}, isLoading: profileLoading } = useQuery({
    queryKey: ["customerProfile"],
    queryFn: api.getProfile,
    enabled: !loading,
  });

  useEffect(() => {
    if (profile.name) {
      setName(profile.name);
      setEmail(profile.email || "");
      setPreferredLanguage(profile.preferredLanguage || "en");
    }
  }, [profile]);

  const { data: addresses = [], isLoading: addrLoading } = useQuery({
    queryKey: ["customerAddresses"],
    queryFn: api.getAddresses,
    enabled: !loading,
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["customerOrders"],
    queryFn: api.getCustomerOrders,
    enabled: !loading,
  });

  const { data: deliveryAreas = [] } = useQuery({
    queryKey: ["deliveryAreasDashboard"],
    queryFn: api.getDeliveryAreas,
    enabled: !loading,
  });

  // Profile Mutation
  const profileMutation = useMutation({
    mutationFn: api.updateProfile,
    onSuccess: (data) => {
      localStorage.setItem("app_name", data.name);
      queryClient.invalidateQueries({ queryKey: ["customerProfile"] });
      alert("Profile updated successfully!");
    },
    onError: (err: any) => {
      alert("Failed to update profile: " + err.message);
    }
  });

  // Address Mutations
  const addAddressMutation = useMutation({
    mutationFn: api.addAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customerAddresses"] });
      setShowAddressForm(false);
      setVillageName("");
      setAddressLine("");
      setLandmark("");
      setIsDefault(false);
      alert("Address added!");
    },
    onError: (err: any) => {
      alert("Failed to add address: " + err.message);
    }
  });

  const deleteAddressMutation = useMutation({
    mutationFn: api.deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customerAddresses"] });
      alert("Address deleted!");
    },
    onError: (err: any) => {
      alert("Failed to delete address: " + err.message);
    }
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    profileMutation.mutate({ name, email: email || null, preferredLanguage });
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!villageName || !addressLine) {
      alert("Please fill out required fields.");
      return;
    }
    addAddressMutation.mutate({ villageName, addressLine, landmark: landmark || null, isDefault });
  };

  const handleLogout = () => {
    localStorage.removeItem("app_token");
    localStorage.removeItem("app_userId");
    localStorage.removeItem("app_role");
    localStorage.removeItem("app_name");
    localStorage.removeItem("app_phone");
    router.push("/");
  };

  if (loading || profileLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Menu Navigation */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-6 h-max">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                {profile.name?.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <span className="font-extrabold text-slate-800 text-sm block truncate">{profile.name}</span>
                <span className="text-[10px] text-slate-400 font-bold block">{localStorage.getItem("app_phone")}</span>
              </div>
            </div>

            <nav className="flex flex-col space-y-1.5 text-xs font-bold text-slate-600">
              <button
                onClick={() => setActiveTab("orders")}
                className={`w-full text-left py-2.5 px-4 rounded-xl flex items-center space-x-2 transition-colors cursor-pointer ${
                  activeTab === "orders" ? "bg-primary text-white" : "hover:bg-slate-50"
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>My Orders</span>
              </button>
              <button
                onClick={() => setActiveTab("addresses")}
                className={`w-full text-left py-2.5 px-4 rounded-xl flex items-center space-x-2 transition-colors cursor-pointer ${
                  activeTab === "addresses" ? "bg-primary text-white" : "hover:bg-slate-50"
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Saved Addresses</span>
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full text-left py-2.5 px-4 rounded-xl flex items-center space-x-2 transition-colors cursor-pointer ${
                  activeTab === "profile" ? "bg-primary text-white" : "hover:bg-slate-50"
                }`}
              >
                <User className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left py-2.5 px-4 rounded-xl flex items-center space-x-2 text-red-600 hover:bg-red-50 transition-colors cursor-pointer mt-4"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </nav>
          </div>

          {/* Active Tab Panel Details (Right Side) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* A. ORDERS TAB PANEL */}
            {activeTab === "orders" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <h2 className="text-base font-black text-slate-800 border-b border-slate-100 pb-2">
                  Your Order History
                </h2>

                {ordersLoading ? (
                  <div className="text-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500 font-semibold">No orders placed yet.</p>
                    <Link href="/#menu" className="text-xs text-primary font-bold hover:underline inline-block">
                      Browse our delicious chicken menu
                    </Link>
                  </div>
                ) : (() => {
                  const recentlyOrderedProducts = Array.from(
                    new Map(
                      orders
                        .flatMap((o) => o.orderItems)
                        .map((item) => [item.product.id, item.product])
                    ).values()
                  ).slice(0, 4);

                  return (
                    <div className="space-y-6">
                      {recentlyOrderedProducts.length > 0 && (
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 sm:p-5 space-y-3">
                          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest text-left">
                            Recently Ordered Items
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {recentlyOrderedProducts.map((p) => (
                              <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between hover:border-slate-300 transition-all text-center">
                                <span className="font-extrabold text-slate-800 text-xs truncate block">{p.name}</span>
                                <span className="text-[10px] text-slate-400 font-bold block mb-2">₹{p.basePrice} / {p.isChicken ? "KG" : "PCS"}</span>
                                <button
                                  onClick={() => {
                                    addToCart(p, p.isChicken ? 1.0 : 1, p.isChicken ? "KG" : "PCS", p.isChicken);
                                    alert(`${p.name} added to cart!`);
                                  }}
                                  className="bg-primary hover:bg-primary-hover text-white py-1.5 px-3 rounded-full text-[10px] font-extrabold cursor-pointer transition-colors"
                                >
                                  Buy Again
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        {orders.map((o) => (
                          <div 
                            key={o.id}
                            className="border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/50 transition-colors"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-extrabold text-slate-800 text-sm">Order #{o.id}</span>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                  o.status === "DELIVERED"
                                    ? "bg-green-100 text-green-700"
                                    : o.status === "CANCELLED"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}>
                                  {o.status}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-semibold block">
                                Placed on: {new Date(o.createdAt).toLocaleDateString("en-IN")} at {new Date(o.createdAt).toLocaleTimeString("en-IN", {hour: '2-digit', minute:'2-digit'})}
                              </span>
                              <span className="text-xs text-slate-500 font-semibold block">
                                {o.orderItems.length} {o.orderItems.length === 1 ? 'item' : 'items'} • ₹{o.grandTotal} ({o.paymentMethod})
                              </span>
                            </div>

                            <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0 justify-end">
                              <button
                                onClick={() => handleReorder(o)}
                                className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs py-2.5 px-4 rounded-lg inline-flex items-center space-x-1.5 shadow-sm cursor-pointer transition-colors"
                              >
                                <RefreshCw className="w-3.5 h-3.5 text-white" />
                                <span>Reorder</span>
                              </button>
                              <Link
                                href={`/order-track?id=${o.id}&phone=${encodeURIComponent(localStorage.getItem("app_phone") || "")}`}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 px-4 rounded-lg inline-flex items-center space-x-1.5 shadow-sm"
                              >
                                <Eye className="w-3.5 h-3.5 text-secondary" />
                                <span>Track Live</span>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* B. ADDRESSES TAB PANEL */}
            {activeTab === "addresses" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h2 className="text-base font-black text-slate-800">
                    Saved Delivery Addresses
                  </h2>
                  <button
                    onClick={() => setShowAddressForm(!showAddressForm)}
                    className="text-xs font-bold bg-primary hover:bg-primary-hover text-white py-1.5 px-3 rounded-full flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Address</span>
                  </button>
                </div>

                {/* Add Address Form */}
                {showAddressForm && (
                  <form onSubmit={handleAddressSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 animate-fadeIn">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Select Village *</label>
                      <select
                        required
                        value={villageName}
                        onChange={(e) => setVillageName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold outline-none focus:border-primary cursor-pointer"
                      >
                        <option value="">-- Choose village --</option>
                        {deliveryAreas.map((area) => (
                          <option key={area.id} value={area.villageName}>
                            {area.villageName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Address Line *</label>
                        <input
                          type="text"
                          required
                          value={addressLine}
                          onChange={(e) => setAddressLine(e.target.value)}
                          placeholder="House number, street details"
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Landmark</label>
                        <input
                          type="text"
                          value={landmark}
                          onChange={(e) => setLandmark(e.target.value)}
                          placeholder="e.g. Near bus stand"
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                      <input
                        type="checkbox"
                        id="default_addr"
                        checked={isDefault}
                        onChange={() => setIsDefault(!isDefault)}
                        className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                      />
                      <label htmlFor="default_addr" className="text-xs text-slate-600 font-bold cursor-pointer select-none">
                        Set as default address
                      </label>
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="text-xs font-bold text-slate-500 py-1.5 px-3 rounded-full cursor-pointer hover:bg-slate-200/50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={addAddressMutation.isPending}
                        className="text-xs font-bold bg-slate-900 text-white py-1.5 px-4 rounded-full flex items-center space-x-1 cursor-pointer hover:bg-slate-800"
                      >
                        {addAddressMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        <span>Save Address</span>
                      </button>
                    </div>
                  </form>
                )}

                {addrLoading ? (
                  <div className="text-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-10 space-y-1.5 text-slate-500 text-xs">
                    <MapPin className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="font-semibold">No addresses saved yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div 
                        key={addr.id}
                        className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 transition-all bg-slate-50/20"
                      >
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-slate-800">{addr.villageName}</span>
                            {addr.isDefault && (
                              <span className="text-[9px] bg-green-100 text-green-700 font-extrabold px-2 py-0.5 rounded uppercase leading-none">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-slate-500 leading-relaxed font-semibold">{addr.addressLine}</p>
                          {addr.landmark && (
                            <p className="text-[10px] text-slate-400 font-medium">Landmark: {addr.landmark}</p>
                          )}
                        </div>

                        <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
                          <button
                            onClick={() => deleteAddressMutation.mutate(addr.id)}
                            className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center space-x-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* C. EDIT PROFILE TAB PANEL */}
            {activeTab === "profile" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <h2 className="text-base font-black text-slate-800 border-b border-slate-100 pb-2">
                  Edit Profile Details
                </h2>

                <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-md">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Name"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Preferred Language</label>
                    <select
                      value={preferredLanguage}
                      onChange={(e) => setPreferredLanguage(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none cursor-pointer"
                    >
                      <option value="en">English</option>
                      <option value="te">తెలుగు (Telugu)</option>
                    </select>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={profileMutation.isPending}
                      className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs py-3 px-6 rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
                    >
                      {profileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
