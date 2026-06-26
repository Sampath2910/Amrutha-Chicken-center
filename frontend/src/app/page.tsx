"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, Product, Category, getProductImage } from "@/lib/api";
import { useTranslation } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  Phone, 
  MessageCircle, 
  Plus, 
  Check, 
  Clock, 
  TrendingUp, 
  MapPin, 
  Utensils, 
  Calendar, 
  Star, 
  HelpCircle,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { t, language } = useTranslation();
  const { addToCart } = useCart();

  // Selected Category tab for the menu
  const [selectedTab, setSelectedTab] = useState<string>("all");
  
  // Custom states for items (quantity selector, custom inputs, cooking applied)
  const [itemQuantities, setItemQuantities] = useState<Record<number, number>>({});
  const [itemUnits, setItemUnits] = useState<Record<number, string>>({});
  const [cookingChoices, setCookingChoices] = useState<Record<number, boolean>>({});
  const [addedMessage, setAddedMessage] = useState<Record<number, boolean>>({});

  // Selected village for delivery charge estimation
  const [selectedVillage, setSelectedVillage] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("selected_village") || "";
    }
    return "";
  });

  // 1. Fetch data from backend
  const { data: categories = [], isLoading: catLoading } = useQuery({
    queryKey: ["publicCategories"],
    queryFn: api.getCategories,
  });

  const { data: products = [], isLoading: prodLoading } = useQuery({
    queryKey: ["publicProducts"],
    queryFn: api.getProducts,
  });

  const { data: settings = {}, isLoading: settingsLoading } = useQuery({
    queryKey: ["publicSettings"],
    queryFn: api.getSettings,
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ["publicAnnouncements"],
    queryFn: api.getAnnouncements,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["publicReviews"],
    queryFn: api.getReviews,
  });

  const { data: deliveryAreas = [] } = useQuery({
    queryKey: ["publicDeliveryAreas"],
    queryFn: api.getDeliveryAreas,
  });

  // Find raw chicken prices for cooked cost breakdown
  const wholeChickenProduct = products.find(
    (p) => p.id === 1 || p.name.toLowerCase().includes("whole")
  );
  const bonelessChickenProduct = products.find(
    (p) => p.id === 2 || p.name.toLowerCase().includes("boneless")
  );
  const wholePrice = wholeChickenProduct?.basePrice || 0;
  const bonelessPrice = bonelessChickenProduct?.basePrice || 0;

  // Filter raw products for some checks
  const freshChickenProducts = products.filter(
    (p) => p.category.slug === "fresh-chicken"
  );

  // Active announcement text
  const activeAnnouncement = announcements.find((a) => a.isActive);
  const announcementText = activeAnnouncement
    ? (language === "en" ? activeAnnouncement.text : activeAnnouncement.textTelugu)
    : (settings["announcement_text"] || "");

  // Shop status
  const isShopOpen = settings["shop_status"] !== "CLOSED";

  // Helper to handle add to cart from grid
  const handleAddToCartClick = (product: Product) => {
    const qty = itemQuantities[product.id] || (product.category.slug === "chapathis" ? 5 : 1);
    const unit = itemUnits[product.id] || (product.category.slug === "chapathis" ? "PCS" : "KG");
    const cooking = !!cookingChoices[product.id];

    addToCart(product, qty, unit, cooking);

    // Show visual confirmation toast/message on item
    setAddedMessage((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedMessage((prev) => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  // Helper to change values of quantity/units on UI
  const setQuantity = (productId: number, val: number) => {
    setItemQuantities((prev) => ({ ...prev, [productId]: val }));
  };

  const setUnit = (productId: number, unit: string) => {
    setItemUnits((prev) => ({ ...prev, [productId]: unit }));
  };

  const toggleCooking = (productId: number) => {
    setCookingChoices((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* 1. ANNOUNCEMENT BAR */}
      {announcementText && (
        <div className="w-full bg-primary text-white py-2 px-4 text-center text-xs font-bold tracking-wide animate-pulse">
          📢 {announcementText}
        </div>
      )}

      {/* 2. HEADER */}
      <Header />

      {/* 3. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-red-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6 text-left">
            <div className="inline-flex items-center space-x-2 bg-red-500/20 text-secondary border border-red-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 mr-1" />
              <span>{settings["business_hours"] || "6:00 AM - 9:00 PM"}</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              {t("heroTitle")}
            </h1>
            
            <p className="text-slate-300 text-sm sm:text-base max-w-lg leading-relaxed">
              {t("heroDesc")}
            </p>

            {!isShopOpen && (
              <div className="bg-amber-500/20 border border-amber-500/30 text-amber-200 p-4 rounded-lg flex items-start space-x-2.5 max-w-md">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="text-xs font-bold leading-relaxed">
                  {t("shopClosed")}
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a
                href="#menu"
                className="bg-primary hover:bg-primary-hover text-white text-center py-3.5 px-8 rounded-full font-bold text-sm hover-lift transition-all shadow-md shadow-red-900/30"
              >
                {t("orderNow")}
              </a>
              <a
                href="tel:8977677193"
                className="bg-slate-800 hover:bg-slate-700 text-slate-100 text-center py-3.5 px-8 rounded-full font-bold text-sm border border-slate-700 hover-lift transition-all flex items-center justify-center space-x-2"
              >
                <Phone className="w-4 h-4 text-secondary" />
                <span>{t("callNow")}</span>
              </a>
              <a
                href="https://wa.me/918977677193"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 hover:bg-green-700 text-white text-center py-3.5 px-8 rounded-full font-bold text-sm hover-lift transition-all flex items-center justify-center space-x-2"
              >
                <MessageCircle className="w-4 h-4 text-white" />
                <span>{t("whatsappNow")}</span>
              </a>
            </div>
          </div>

          <div className="relative w-full h-[300px] sm:h-[400px] rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800 hover-lift-gold transition-all duration-300">
            <img
              src="/shop_front.jpg"
              alt="Amrutha Chicken Center shop front"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/10 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <div className="bg-slate-900/90 backdrop-blur-sm p-4 rounded-xl border border-slate-700">
                <span className="text-[10px] font-bold text-secondary uppercase tracking-widest block">
                  Trusted Local Shop
                </span>
                <span className="text-sm sm:text-base font-bold text-white block mt-0.5">
                  Visit us near Bus Stand, Morthad
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. TODAY'S CHICKEN RATES */}
      <section className="bg-white py-12 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-1.5 bg-red-50 text-primary py-1.5 px-3.5 rounded-full text-xs font-bold mb-3 border border-red-100">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Market Rates</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t("todayRates")}
          </h2>
          <p className="text-xs text-slate-500 mt-1.5">
            {t("lastUpdated")}: {new Date().toLocaleDateString("en-IN")}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-8">
            {catLoading || prodLoading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse bg-slate-100 h-32 rounded-xl"></div>
              ))
            ) : (
              freshChickenProducts.map((p) => (
                <div 
                  key={p.id} 
                  className="bg-slate-50 border border-slate-200 rounded-xl p-5 hover-lift transition-all hover:bg-slate-100 flex flex-col justify-between"
                >
                  <div className="text-left">
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                      {language === "en" ? "Fresh" : "తాజాది"}
                    </span>
                    <span className="text-base font-extrabold text-slate-800 block mt-0.5 leading-tight">
                      {language === "en" ? p.name : p.nameTelugu}
                    </span>
                  </div>
                  <div className="text-right mt-4">
                    <span className="text-xl sm:text-2xl font-black text-primary block leading-none">
                      {p.basePrice !== null && p.basePrice !== undefined ? `₹${p.basePrice}` : "--"}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold tracking-wide">
                      {t("perKg")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 5. PRODUCT MENU BROWSER */}
      <section id="menu" className="py-16 bg-slate-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-secondary uppercase tracking-widest block">
              Menu & Ordering
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {language === "en" ? "Browse Our Products" : "మా ఉత్పత్తులను చూడండి"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
              Select products to order. Add masala cooking services to fresh chicken as desired.
            </p>
          </div>

          {/* Tab Selection */}
          <div className="flex justify-center space-x-2 sm:space-x-4 mt-8 overflow-x-auto py-2">
            <button
              onClick={() => setSelectedTab("all")}
              className={`text-xs sm:text-sm font-bold px-4 py-2 rounded-full cursor-pointer transition-colors shrink-0 ${
                selectedTab === "all" ? "bg-primary text-white" : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              {language === "en" ? "All Items" : "అన్నీ"}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedTab(c.slug)}
                className={`text-xs sm:text-sm font-bold px-4 py-2 rounded-full cursor-pointer transition-colors shrink-0 ${
                  selectedTab === c.slug ? "bg-primary text-white" : "bg-white text-slate-600 border border-slate-200"
                }`}
              >
                {language === "en" ? c.name : c.nameTelugu}
              </button>
            ))}
          </div>

          {/* Shipping / Delivery Estimator */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 mt-4 max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center space-x-2.5">
              <MapPin className="w-5 h-5 text-primary shrink-0" />
              <div className="text-left">
                <span className="text-xs font-black text-slate-800 block">Estimate Delivery Fees</span>
                <span className="text-[10px] text-slate-400 font-semibold block">Select your village to see shipping charges in the menu</span>
              </div>
            </div>
            <select
              value={selectedVillage}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedVillage(val);
                localStorage.setItem("selected_village", val);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none w-full sm:w-64 cursor-pointer"
            >
              <option value="">-- Select Village --</option>
              {deliveryAreas.map((area) => (
                <option key={area.id} value={area.villageName}>
                  {area.villageName}
                </option>
              ))}
            </select>
          </div>

          {/* Reusable Product Card Component */}
          {(() => {
            const renderProductCard = (p: Product) => {
              const qty = itemQuantities[p.id] || (p.category.slug === "chapathis" ? 5 : 1);
              const unit = itemUnits[p.id] || (p.category.slug === "chapathis" ? "PCS" : "KG");
              const cookingApplied = !!cookingChoices[p.id];
              const hasAdded = !!addedMessage[p.id];

              const isFreshChicken = p.category.slug === "fresh-chicken";
              const isChapathi = p.category.slug === "chapathis";
              const isCookedFood = p.category.slug === "cooked-food";

              return (
                <div 
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-200 hover-lift overflow-hidden shadow-sm flex flex-col justify-between text-left"
                >
                  {/* Product Image */}
                  <div className="relative w-full h-48 bg-slate-100 overflow-hidden group/img border-b border-slate-100">
                    <img 
                      src={getProductImage(p.name)} 
                      alt={language === "en" ? p.name : p.nameTelugu} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                    />
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                        p.status === "AVAILABLE" 
                          ? "bg-green-600 text-white shadow-sm" 
                          : p.status === "LIMITED_STOCK"
                          ? "bg-amber-500 text-white shadow-sm"
                          : "bg-slate-600 text-white shadow-sm"
                      }`}>
                        {p.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  {/* Product Header */}
                  <div className="p-6 space-y-3 flex-grow flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded uppercase block tracking-wider w-max mb-1">
                            {language === "en" ? p.category.name : p.category.nameTelugu}
                          </span>
                          <h3 className="text-lg font-black text-slate-800 leading-tight">
                            {language === "en" ? p.name : p.nameTelugu}
                          </h3>
                        </div>
                        <span className="text-lg font-black text-primary leading-none text-right shrink-0">
                          {p.basePrice !== null && p.basePrice !== undefined ? `₹${p.basePrice}` : (language === "en" ? "TBD" : "త్వరలో")}
                          <span className="text-[10px] text-slate-500 font-semibold block mt-0.5 text-right">
                            {isChapathi 
                              ? "each" 
                              : isCookedFood 
                              ? (language === "en" ? "cooking fee / KG" : "వంట రుసుము / కేజీ") 
                              : t("perKg")
                            }
                          </span>
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-500 leading-relaxed min-h-[40px]">
                        {language === "en" ? p.description : p.descriptionTelugu}
                      </p>

                      {/* Cooked Cost Calculator (Raw + Cooking) */}
                      {isCookedFood && (
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-[11px] font-bold text-slate-700">
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-black">
                            {language === "en" ? "Total Price (Raw + Cooking)" : "మొత్తం ధర (పచ్చి చికెన్ + వంట రుసుము)"}
                          </span>
                          
                          <div className="flex justify-between items-center border-b border-dashed border-slate-200 pb-1.5">
                            <span>{language === "en" ? "Cooking & Spices:" : "మసాలాలు & వంట రుసుము:"}</span>
                            <span>₹{p.basePrice} / KG</span>
                          </div>
                          
                          {wholePrice > 0 && (
                            <div className="flex justify-between items-center text-slate-800">
                              <div className="flex flex-col">
                                <span>{language === "en" ? "With Whole Chicken:" : "హోల్ చికెన్ తో:"}</span>
                                <span className="text-[9px] text-slate-400 font-semibold">(Raw ₹{wholePrice} + Cooking ₹{p.basePrice})</span>
                              </div>
                              <span className="text-xs font-black text-primary">₹{wholePrice + p.basePrice} / KG</span>
                            </div>
                          )}
                          
                          {bonelessPrice > 0 && (
                            <div className="flex justify-between items-center text-slate-800 pt-0.5">
                              <div className="flex flex-col">
                                <span>{language === "en" ? "With Boneless Chicken:" : "బోన్‌లెస్ చికెన్ తో:"}</span>
                                <span className="text-[9px] text-slate-400 font-semibold">(Raw ₹{bonelessPrice} + Cooking ₹{p.basePrice})</span>
                              </div>
                              <span className="text-xs font-black text-primary">₹{bonelessPrice + p.basePrice} / KG</span>
                            </div>
                          )}
                        </div>
                      )}

                      {selectedVillage && (
                        <div className="flex items-center space-x-1 bg-slate-50 p-2 rounded-lg border border-slate-200/60 w-max text-[10px] text-slate-600 font-bold select-none">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0 animate-bounce" />
                          <span>+₹{deliveryAreas.find(a => a.villageName === selectedVillage)?.chargeAmount || 0} delivery to {selectedVillage}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 pt-3">
                      {/* Quantity controls */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Select Quantity
                        </label>

                        <div className="flex items-center space-x-2">
                          {isChapathi ? (
                            // Chapathi pack shortcuts
                            <select
                              value={qty}
                              onChange={(e) => setQuantity(p.id, parseInt(e.target.value))}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none"
                            >
                              <option value={1}>Single (₹15)</option>
                              <option value={5}>5 Pack (₹70)</option>
                              <option value={10}>10 Family Pack (₹140)</option>
                            </select>
                          ) : (
                            // Weight selector (250g, 500g, 1kg, 2kg, etc)
                            <div className="grid grid-cols-2 gap-2 w-full">
                              <select
                                value={qty >= 1 ? qty : (qty === 0.25 ? "250g" : "500g")}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === "250g") {
                                    setQuantity(p.id, 0.25);
                                    setUnit(p.id, "G");
                                  } else if (val === "500g") {
                                    setQuantity(p.id, 0.50);
                                    setUnit(p.id, "G");
                                  } else {
                                    setQuantity(p.id, parseFloat(val));
                                    setUnit(p.id, "KG");
                                  }
                                }}
                                className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                              >
                                <option value="250g">250 G (Pickup)</option>
                                <option value="500g">500 G (Pickup)</option>
                                <option value={1}>1.0 KG</option>
                                <option value={2}>2.0 KG</option>
                                <option value={3}>3.0 KG</option>
                                <option value={5}>5.0 KG</option>
                              </select>
                              <div className="bg-slate-100 border border-slate-200 rounded-lg p-2 text-center text-xs font-bold text-slate-600">
                                {qty < 1 ? "Pickup Only" : "Delivery Ok"}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Cooking Charge Checkbox (Only for Fresh Chicken) */}
                      {isFreshChicken && (
                        <div className="flex items-center space-x-2 bg-red-50/50 p-2 rounded-lg border border-red-100/50">
                          <input
                            type="checkbox"
                            id={`cooking_${p.id}`}
                            checked={cookingApplied}
                            onChange={() => toggleCooking(p.id)}
                            className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                          />
                          <label 
                            htmlFor={`cooking_${p.id}`}
                            className="text-xs text-slate-700 font-semibold cursor-pointer select-none leading-tight"
                          >
                            Add cooking & spices (₹220/KG)
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add button footer */}
                  <div className="p-6 pt-0">
                    <button
                      disabled={!isShopOpen || p.status === "OUT_OF_STOCK" || p.basePrice === null || p.basePrice === undefined}
                      onClick={() => handleAddToCartClick(p)}
                      className={`w-full py-3 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-all ${
                        (!isShopOpen || p.status === "OUT_OF_STOCK" || p.basePrice === null || p.basePrice === undefined)
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                          : hasAdded 
                          ? "bg-green-600 text-white cursor-pointer" 
                          : "bg-primary hover:bg-primary-hover text-white shadow-md hover:scale-[1.01] cursor-pointer"
                      }`}
                    >
                      {!isShopOpen ? (
                        <span>{language === "en" ? "Shop Closed" : "షాప్ మూసివేయబడింది"}</span>
                      ) : p.status === "OUT_OF_STOCK" ? (
                        <span>{language === "en" ? "Out of Stock" : "స్టాక్ లేదు"}</span>
                      ) : (p.basePrice === null || p.basePrice === undefined) ? (
                        <span>{language === "en" ? "Price Not Set" : "ధర సెట్ చేయబడలేదు"}</span>
                      ) : hasAdded ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>{language === "en" ? "Added to Cart" : "కార్ట్‌కి జోడించబడింది"}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>{language === "en" ? "Add to Order" : "ఆర్డర్ జోడించు"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            };

            return (
              <div className="mt-8 space-y-16 w-full">
                {prodLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse bg-white h-80 rounded-2xl border border-slate-200"></div>
                    ))}
                  </div>
                ) : selectedTab !== "all" ? (
                  // Single Category Grid View
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {products
                      .filter((p) => p.category.slug === selectedTab)
                      .map((p) => renderProductCard(p))}
                  </div>
                ) : (
                  // All Categories Grouped in Separate Sections
                  categories.map((c) => {
                    const categoryProducts = products.filter((p) => p.category.slug === c.slug);
                    if (categoryProducts.length === 0) return null;
                    return (
                      <div key={c.id} className="space-y-6 scroll-mt-24 text-left">
                        <div className="border-l-4 border-primary pl-4 py-0.5">
                          <h3 className="text-xl sm:text-2xl font-black text-slate-800 uppercase tracking-tight">
                            {language === "en" ? c.name : c.nameTelugu}
                          </h3>
                          <p className="text-xs text-slate-500 font-semibold mt-1">
                            {language === "en" ? c.description : (c.slug === "fresh-chicken" ? "తాజా చికెన్ ముక్కలు రోజువారీగా సిద్ధం చేయబడుతాయి." : c.slug === "cooked-food" ? "రుచికరమైన సాంప్రదాయ చికెన్ కర్రీలు మరియు ఫ్రైలు." : "మెత్తటి వేడి వేడి చపాతీలు.")}
                          </p>
                        </div>

                        {c.slug === "cooked-food" && (
                          <div className="bg-red-50 border border-red-200 text-primary p-4 rounded-xl text-xs font-bold leading-relaxed max-w-4xl">
                            📢 {language === "en" 
                              ? "NOTE: The price listed for cooked items is ONLY for the cooking service & spices. The raw chicken meat cost is charged extra based on today's raw chicken rates." 
                              : "గమనిక: ఇక్కడ చూపించిన వండిన వంటకాల ధరలు కేవలం వంట రుసుము (మసాలాలు & వంట ఖర్చులు) మాత్రమే. పచ్చి చికెన్ మాంసం ధర ఈరోజు రేట్లను బట్టి విడిగా లెక్కించబడుతుంది."}
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                          {categoryProducts.map((p) => renderProductCard(p))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })()}
        </div>
      </section>

      {/* 6. COMFORT FOOD / BEST SELLERS */}
      <section className="py-16 bg-white border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold text-secondary uppercase tracking-widest block">
            Popular Choices
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Best Sellers Combos
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 select-none">
            Our customers' favorite village mess combos.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mt-8">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl text-left hover-lift transition-all overflow-hidden flex flex-col justify-between">
              <div>
                <div className="w-full h-40 bg-slate-100 overflow-hidden">
                  <img 
                    src="/products/cooked_chicken_curry.png" 
                    alt="Chicken Curry + 5 Chapathis Combo" 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <span className="text-[10px] bg-secondary/20 text-secondary-hover font-bold px-2 py-0.5 rounded uppercase block w-max mb-2">
                    Curry Combo
                  </span>
                  <h3 className="text-base font-extrabold text-slate-800">Chicken Curry + 5 Chapathis</h3>
                  <p className="text-xs text-slate-500 mt-2">
                    Home-style cooked chicken gravy served with 5 soft fresh chapathis.
                  </p>
                </div>
              </div>
              <div className="p-6 pt-0 flex justify-between items-center">
                <span className="text-lg font-black text-primary">₹320</span>
                <a href="#menu" className="text-xs font-extrabold text-slate-600 hover:text-primary underline">
                  Select Menu
                </a>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl text-left hover-lift transition-all overflow-hidden flex flex-col justify-between">
              <div>
                <div className="w-full h-40 bg-slate-100 overflow-hidden">
                  <img 
                    src="/products/cooked_chicken_fry.png" 
                    alt="Chicken Fry + 5 Chapathis Combo" 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <span className="text-[10px] bg-secondary/20 text-secondary-hover font-bold px-2 py-0.5 rounded uppercase block w-max mb-2">
                    Fry Combo
                  </span>
                  <h3 className="text-base font-extrabold text-slate-800">Chicken Fry + 5 Chapathis</h3>
                  <p className="text-xs text-slate-500 mt-2">
                    Deep fried crispy local spiced chicken served with 5 soft chapathis.
                  </p>
                </div>
              </div>
              <div className="p-6 pt-0 flex justify-between items-center">
                <span className="text-lg font-black text-primary">₹350</span>
                <a href="#menu" className="text-xs font-extrabold text-slate-600 hover:text-primary underline">
                  Select Menu
                </a>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl text-left hover-lift transition-all overflow-hidden flex flex-col justify-between">
              <div>
                <div className="w-full h-40 bg-slate-100 overflow-hidden">
                  <img 
                    src="/products/cooked_chicken_dry_roast.png" 
                    alt="Chicken Dry Roast + 10 Chapathis Combo" 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <span className="text-[10px] bg-secondary/20 text-secondary-hover font-bold px-2 py-0.5 rounded uppercase block w-max mb-2">
                    Dry Roast Pack
                  </span>
                  <h3 className="text-base font-extrabold text-slate-800">Chicken Dry Roast + 10 Chapathis</h3>
                  <p className="text-xs text-slate-500 mt-2">
                    High-spice masala dry roast chicken packed with 10 soft family chapathis.
                  </p>
                </div>
              </div>
              <div className="p-6 pt-0 flex justify-between items-center">
                <span className="text-lg font-black text-primary">₹440</span>
                <a href="#menu" className="text-xs font-extrabold text-slate-600 hover:text-primary underline">
                  Select Menu
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. WHY CHOOSE US */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {t("wcuTitle")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-12">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center hover-lift transition-all">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-extrabold text-slate-800">{t("wcuFresh")}</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {t("wcuFreshDesc")}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center hover-lift transition-all">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-extrabold text-slate-800">{t("wcuHomeStyle")}</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {t("wcuHomeStyleDesc")}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center hover-lift transition-all">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-extrabold text-slate-800">{t("wcuQuick")}</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {t("wcuQuickDesc")}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center hover-lift transition-all">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-extrabold text-slate-800">{t("wcuTrusted")}</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {t("wcuTrustedDesc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. DELIVERY COVERAGE AREAS */}
      <section id="delivery" className="py-16 bg-white border-b border-border scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6 text-left">
              <span className="text-xs font-bold text-secondary uppercase tracking-widest block">
                Coverage
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                Village-Based Delivery Charges
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                We deliver fresh and cooked food to villages within a 15 KM radius of Morthad. Charges are fixed by location. Delivery is available on orders of 1 KG and above.
              </p>
              
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <span className="text-xs font-extrabold text-slate-700 block mb-3">
                  Summary Rates:
                </span>
                <ul className="space-y-2.5 text-xs text-slate-600 font-semibold">
                  <li className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span>Morthad (Local)</span>
                    <span className="text-primary font-bold">₹50</span>
                  </li>
                  <li className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span>Donkal, Shetpalle, Sunket, Palem, Wadiat, Donpal, Ramannapet</span>
                    <span className="text-primary font-bold">₹100</span>
                  </li>
                  <li className="flex justify-between items-center pb-1">
                    <span>Gandlapet, Dharmora</span>
                    <span className="text-primary font-bold">₹150</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* List dynamically loaded villages */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8">
              <span className="text-xs font-black uppercase text-slate-400 block tracking-wider mb-4">
                Serviceable Villages Checklist:
              </span>
              
              <div className="grid grid-cols-2 gap-4">
                {deliveryAreas.length > 0 ? (
                  deliveryAreas.map((area) => (
                    <div key={area.id} className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                      <div className="text-xs font-bold text-slate-700">
                        {area.villageName} <span className="text-slate-400 block font-normal">₹{area.chargeAmount} delivery</span>
                      </div>
                    </div>
                  ))
                ) : (
                  ["Morthad", "Donkal", "Sunket", "Shetpalle", "Ramannapet", "Palem", "Donpal", "Wadiat", "Gandlapet", "Dharmora"].map((v) => (
                    <div key={v} className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                      <div className="text-xs font-bold text-slate-700">{v}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 9. REAL SHOP GALLERY */}
      <section id="gallery" className="py-16 bg-slate-50 border-b border-border scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold text-secondary uppercase tracking-widest block">
            Visit Us
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Our Physical Store
          </h2>
          <p className="text-xs text-slate-500 mt-1 select-none">
            Real photos of our premises located in Morthad.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 max-w-4xl mx-auto">
            <div className="relative w-full h-[250px] sm:h-[350px] rounded-2xl overflow-hidden shadow-md border-4 border-white hover-lift transition-all duration-300">
              <img
                src="/shop_front.jpg"
                alt="Amrutha Chicken Center Front"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-sm px-3.5 py-1.5 rounded-lg border border-slate-700 text-xs font-bold text-white">
                Shop Facade
              </div>
            </div>

            <div className="relative w-full h-[250px] sm:h-[350px] rounded-2xl overflow-hidden shadow-md border-4 border-white hover-lift transition-all duration-300">
              <img
                src="/shop_angle.jpg"
                alt="Amrutha Chicken Center Side Facade"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-sm px-3.5 py-1.5 rounded-lg border border-slate-700 text-xs font-bold text-white">
                Side View & Mess Banner
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. BULK ORDERS */}
      <section className="py-16 bg-gradient-to-br from-red-950 to-slate-900 text-white text-center border-b border-red-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="w-12 h-12 bg-secondary/20 text-secondary rounded-full flex items-center justify-center mx-auto mb-4 border border-secondary/30">
            <Calendar className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Event Catering & Bulk Orders
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            Planning a wedding, festival, birthday party, or village event? Submit an inquiry, and we will clean, prepare, cook, and pack chicken in bulk at discount rates.
          </p>
          <div className="pt-2">
            <Link 
              href="/bulk" 
              className="bg-secondary hover:bg-secondary-hover text-slate-900 font-extrabold text-sm py-3.5 px-8 rounded-full shadow-md hover-lift transition-all inline-block"
            >
              Submit Bulk Inquiry
            </Link>
          </div>
        </div>
      </section>

      {/* 11. FAQ SECTION */}
      <section id="faq" className="py-16 bg-white scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 mb-10">
            <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <HelpCircle className="w-5.5 h-5.5" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                What is the minimum order weight for home delivery?
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Home delivery is only available for orders with a total weight of 1 KG and above. For orders below 1 KG (250g or 500g), you can place a Pickup order and collect it directly at our Morthad shop.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                How do cooking charges work?
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                We charge a flat cooking fee of ₹220 per KG. If you order raw chicken and opt for our cooking service, we clean it, cut it to size, add our home-made masala mix, cook it, and pack it hot. The chicken cost itself is charged separately based on today's market rates.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                What payment methods do you support?
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                We support Cash on Delivery (COD) and UPI Payments. For UPI payments, you will see our UPI QR code and ID (9705525829@axl) at checkout. Please scan and pay, then upload a screenshot of the transaction. The admin will verify the payment before dispatching your order.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Do you deliver to nearby villages?
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Yes! We deliver to Donkal, Sunket, Shetpalle, Ramannapet, Palem, Donpal, Wadiat, Gandlapet, Dharmora, and other nearby villages within a 15 KM radius. Delivery charges range from ₹50 to ₹150 based on the village.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 12. REVIEWS */}
      <section className="py-16 bg-slate-50 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold text-secondary uppercase tracking-widest block">
            Testimonials
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            What Customers Say
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-10">
            {reviews.length > 0 ? (
              reviews.map((r) => (
                <div key={r.id} className="bg-white border border-slate-200 p-6 rounded-2xl text-left shadow-sm">
                  <div className="flex items-center space-x-1 text-secondary mb-3">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "{r.comment}"
                  </p>
                  <span className="block mt-4 text-xs font-bold text-slate-800">
                    - {r.customerName}
                  </span>
                </div>
              ))
            ) : (
              // Default reviews fallback
              [
                { name: "Raju Yadav", rating: 5, text: "Best chicken shop in Morthad. The chicken is always fresh, and their chicken fry is absolutely delicious! Very fast home delivery too." },
                { name: "Swapna G.", rating: 5, text: "Highly recommend their chapathis and chicken curry. Tastes like home-cooked food. It has become our Sunday family meal standard." },
                { name: "Krishna Reddy", rating: 4, text: "Very hygienic store and reasonable prices. Order on WhatsApp is very convenient." }
              ].map((r, idx) => (
                <div key={idx} className="bg-white border border-slate-200 p-6 rounded-2xl text-left shadow-sm hover-lift transition-all">
                  <div className="flex items-center space-x-1 text-secondary mb-3">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "{r.text}"
                  </p>
                  <span className="block mt-4 text-xs font-bold text-slate-800">
                    - {r.name}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 13. FOOTER */}
      <Footer />
      
    </div>
  );
}
