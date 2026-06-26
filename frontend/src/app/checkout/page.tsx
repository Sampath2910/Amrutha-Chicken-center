"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useTranslation } from "@/context/LanguageContext";
import { api, API_BASE_URL, getProductImage } from "@/lib/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { 
  Trash2, 
  MapPin, 
  CreditCard, 
  MessageCircle, 
  Upload, 
  Check, 
  Loader2, 
  AlertTriangle,
  QrCode,
  DollarSign
} from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  const { t, language } = useTranslation();
  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    getCartTotalWeight, 
    getCartItemTotal, 
    getCartCookingCharge, 
    isOrderEligibleForDelivery 
  } = useCart();

  const [isClient, setIsClient] = useState(false);
  const [orderType, setOrderType] = useState<"DELIVERY" | "PICKUP">("PICKUP");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "UPI">("COD");
  
  // Form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [village, setVillage] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pieceSize, setPieceSize] = useState("Medium");
  const [spicyLevel, setSpicyLevel] = useState("Medium");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  
  // Screenshot upload status
  const [uploading, setUploading] = useState(false);
  const [upiScreenshot, setUpiScreenshot] = useState<string | null>(null);

  // Submit status
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);

  // New States for Confirmation Modal & Idempotency
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [idempotencyToken, setIdempotencyToken] = useState("");

  const generateUUID = () => {
    if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
      try {
        return window.crypto.randomUUID();
      } catch (e) {
        // Fallback below
      }
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  // Resolve mounting issues for hydration
  useEffect(() => {
    setIsClient(true);
    setIdempotencyToken(generateUUID());
    const savedName = localStorage.getItem("app_name");
    const savedPhone = localStorage.getItem("app_phone");
    if (savedName) setName(savedName);
    if (savedPhone) setPhone(savedPhone);
  }, []);

  // Fetch Delivery areas & charges
  const { data: deliveryAreas = [] } = useQuery({
    queryKey: ["deliveryAreasCheckout"],
    queryFn: api.getDeliveryAreas,
  });

  // Fetch Settings (for cooking charge and upi_id)
  const { data: settings = {} } = useQuery({
    queryKey: ["checkoutSettings"],
    queryFn: api.getSettings,
  });

  const cookingRate = parseFloat(settings["cooking_charge_per_kg"] || "220");
  const upiId = settings["upi_id"] || "9705525829@axl";

  // Calculate fees
  const itemsTotal = getCartItemTotal();
  const cookingCharges = getCartCookingCharge(cookingRate);
  
  const selectedArea = deliveryAreas.find(a => a.villageName === village);
  const deliveryCharge = orderType === "DELIVERY" && selectedArea ? selectedArea.chargeAmount : 0;
  
  const grandTotal = itemsTotal + cookingCharges + deliveryCharge;

  // Weight check
  const totalWeight = getCartTotalWeight();
  const isWeightValid = orderType === "PICKUP" || totalWeight >= 1.0;

  // Handle UPI screenshot upload
  const handleScreenshotChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await api.uploadScreenshot(file);
      setUpiScreenshot(res.url);
    } catch (err: any) {
      alert("Image upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCheckoutClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert("Please fill out your name and phone number.");
      return;
    }
    if (orderType === "DELIVERY") {
      if (!isWeightValid) {
        alert("Home Delivery is only available for orders of 1 KG and above. Please choose Pickup or add more items.");
        return;
      }
      if (!village || !address) {
        alert("Please fill out delivery village and address details.");
        return;
      }
    }
    if (paymentMethod === "UPI" && !upiScreenshot) {
      alert("Please upload your UPI transaction screenshot to proceed.");
      return;
    }
    setShowConfirmModal(true);
  };

  const executeOrderSubmission = async () => {
    setSubmitting(true);
    
    // Combine notes
    const formattedNotes = [
      `Pieces: ${pieceSize}`,
      `Spiciness: ${spicyLevel}`,
      deliveryTime ? `Time: ${deliveryTime}` : "",
      additionalNotes ? `Extra: ${additionalNotes}` : ""
    ].filter(Boolean).join(" | ");

    // Prepare payload
    const orderPayload = {
      guestName: name,
      guestPhone: phone,
      orderType,
      paymentMethod,
      upiScreenshotUrl: upiScreenshot,
      deliveryVillage: orderType === "DELIVERY" ? village : null,
      deliveryAddress: orderType === "DELIVERY" ? address : null,
      deliveryLandmark: orderType === "DELIVERY" ? landmark : null,
      notes: formattedNotes,
      idempotencyToken: idempotencyToken,
      items: cartItems.map(item => ({
        productId: item.product.id,
        quantityValue: item.quantityValue,
        quantityUnit: item.quantityUnit,
        cookingApplied: item.cookingApplied
      }))
    };

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("app_token") : null;
      // Place order in DB
      const placedOrder = token 
        ? await api.placeCustomerOrder(orderPayload)
        : await api.placeGuestOrder(orderPayload);
      
      setOrderSuccess(placedOrder);
      setShowConfirmModal(false);
      
      // Clear Cart
      clearCart();

      // Trigger WhatsApp redirection
      const waMessage = formatWhatsAppMessage(placedOrder, formattedNotes);
      const waUrl = `https://wa.me/918977677193?text=${encodeURIComponent(waMessage)}`;
      
      // Open in new window/tab
      window.open(waUrl, "_blank");
    } catch (err: any) {
      alert("Checkout failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatWhatsAppMessage = (order: any, notesStr: string) => {
    const itemsList = order.orderItems.map((item: any) => 
      `- ${item.quantityValue}${item.quantityUnit} ${item.productName}${item.cookingApplied ? ' (Cooked)' : ' (Raw)'}`
    ).join("\n");

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
    const trackLink = `${siteUrl}/order-track?id=${order.id}&phone=${encodeURIComponent(order.guestPhone || (order.user && order.user.phone) || phone)}`;

    return `*NEW ORDER - AMRUTHA CHICKEN CENTER*
----------------------------------
*Order ID:* #${order.id}
*Order Type:* ${order.orderType}
*Customer Name:* ${order.guestName || name}
*Phone:* ${order.guestPhone || phone}

*Items:*
${itemsList}

*Charges:*
- Item Total: ₹${order.itemTotal}
${order.cookingCharge > 0 ? `- Cooking Charge: ₹${order.cookingCharge}\n` : ""}- Delivery Charge: ₹${order.deliveryCharge}
*Grand Total: ₹${order.grandTotal}*

*Payment Method:* ${order.paymentMethod}
${order.orderType === "DELIVERY" ? `*Delivery Village:* ${order.deliveryVillage}\n*Address:* ${order.deliveryAddress}\n` : ""}
*Instructions:* ${notesStr}

*Track Order Link:* ${trackLink}

Please verify my order details.`;
  };

  if (!isClient) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-8">
            {orderSuccess ? "Order Confirmed!" : t("checkout")}
          </h1>

          {orderSuccess ? (
            // Success Screen
            <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6 shadow-sm">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                <Check className="w-8 h-8" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                Your Order Has Been Received!
              </h2>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs max-w-sm mx-auto space-y-2">
                <p className="font-extrabold text-slate-700">Order ID: #{orderSuccess.id}</p>
                <p className="text-slate-500">Amount Due: ₹{orderSuccess.grandTotal}</p>
                <p className="text-slate-500">Method: {orderSuccess.paymentMethod}</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs max-w-md mx-auto space-y-1 text-left">
                <p className="font-black">What Happens Next?</p>
                <p className="text-amber-700 leading-relaxed">
                  1. We have opened WhatsApp on your device to send a copy of this order receipt to Krishna (owner). Please make sure to click "Send" in WhatsApp.
                  <br />
                  2. Krishna will review your order details and payment screenshot (if paid via UPI).
                  <br />
                  3. You can track your order status in real time here.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link
                  href={`/order-track?id=${orderSuccess.id}&phone=${encodeURIComponent(phone)}`}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 px-6 rounded-full inline-block"
                >
                  Track Live Status
                </Link>
                <Link
                  href="/"
                  className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs py-3 px-6 rounded-full inline-block"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          ) : cartItems.length === 0 ? (
            // Empty Cart State
            <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Trash2 className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-black text-slate-800">Your Cart is Empty</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Looks like you haven't added anything to your cart yet. Head back to our menu to select fresh chicken, curry, fries, or chapathis!
              </p>
              <div className="pt-2">
                <Link
                  href="/#menu"
                  className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs py-3 px-6 rounded-full inline-block"
                >
                  Go to Menu
                </Link>
              </div>
            </div>
          ) : (
            // Checkout Form + Cart Split Layout
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Form Input fields (Left Side) */}
              <form onSubmit={handleCheckoutClick} className="lg:col-span-7 space-y-6">
                
                {/* 1. Contact Info Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <h2 className="text-base font-black text-slate-800 border-b border-slate-100 pb-2">
                    1. Contact Details
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Name *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Mobile number"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Order Mode Selection Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <h2 className="text-base font-black text-slate-800 border-b border-slate-100 pb-2">
                    2. Delivery or Pickup
                  </h2>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setOrderType("PICKUP")}
                      className={`p-4 rounded-xl border-2 text-center transition-all cursor-pointer ${
                        orderType === "PICKUP"
                          ? "border-primary bg-red-50/10 text-primary font-extrabold"
                          : "border-slate-200 text-slate-600 font-medium"
                      }`}
                    >
                      Pickup at Shop
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType("DELIVERY")}
                      className={`p-4 rounded-xl border-2 text-center transition-all cursor-pointer ${
                        orderType === "DELIVERY"
                          ? "border-primary bg-red-50/10 text-primary font-extrabold"
                          : "border-slate-200 text-slate-600 font-medium"
                      }`}
                    >
                      Home Delivery
                    </button>
                  </div>

                  {/* Delivery Inputs conditionally rendered */}
                  {orderType === "DELIVERY" && (
                    <div className="space-y-4 pt-4 border-t border-slate-100 animate-fadeIn">
                      {!isWeightValid && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start space-x-2.5 text-xs">
                          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                          <div>
                            <p className="font-extrabold">{t("ruleDeliveryMin")}</p>
                            <p className="mt-0.5 text-amber-700">
                              Your current order weight is <strong>{totalWeight.toFixed(2)} KG</strong>. Add more items to reach 1 KG or switch order type to "Pickup at Shop".
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Village *</label>
                        <select
                          required
                          value={village}
                          onChange={(e) => setVillage(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none focus:border-primary cursor-pointer"
                        >
                          <option value="">-- Choose your village --</option>
                          {deliveryAreas.map((area) => (
                            <option key={area.id} value={area.villageName}>
                              {area.villageName} (+₹{area.chargeAmount} delivery)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Address Line *</label>
                          <input
                            type="text"
                            required
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="House number, street details"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none focus:border-primary transition-colors"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Landmark</label>
                          <input
                            type="text"
                            value={landmark}
                            onChange={(e) => setLandmark(e.target.value)}
                            placeholder="e.g. Near old water tank"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none focus:border-primary transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Notes / Options Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <h2 className="text-base font-black text-slate-800 border-b border-slate-100 pb-2">
                    3. Cooking & Spice Options
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Piece Size</label>
                      <select
                        value={pieceSize}
                        onChange={(e) => setPieceSize(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none cursor-pointer"
                      >
                        <option value="Small">Small Pieces (చాలా చిన్న ముక్కలు)</option>
                        <option value="Medium">Medium Pieces (మధ్యస్థ ముక్కలు)</option>
                        <option value="Large">Large Pieces (పెద్ద ముక్కలు)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Spice Level</label>
                      <select
                        value={spicyLevel}
                        onChange={(e) => setSpicyLevel(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none cursor-pointer"
                      >
                        <option value="Less Spicy">Less Spicy (తక్కువ కారం)</option>
                        <option value="Medium">Medium Spicy (మధ్యస్థ కారం)</option>
                        <option value="Extra Spicy">Extra Spicy (ఎక్కువ కారం)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Preferred Delivery/Pickup Time</label>
                    <input
                      type="text"
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      placeholder="e.g. deliver after 1:00 PM"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Other Instructions</label>
                    <textarea
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      rows={2}
                      placeholder="Specify if you have any other requests..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none focus:border-primary transition-colors"
                    ></textarea>
                  </div>
                </div>

                {/* 4. Payment Selection Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <h2 className="text-base font-black text-slate-800 border-b border-slate-100 pb-2">
                    4. Payment Method
                  </h2>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("COD")}
                      className={`p-4 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                        paymentMethod === "COD"
                          ? "border-primary bg-red-50/10 text-primary font-extrabold"
                          : "border-slate-200 text-slate-600 font-medium"
                      }`}
                    >
                      <DollarSign className="w-5 h-5" />
                      <span>Cash on Delivery</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("UPI")}
                      className={`p-4 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                        paymentMethod === "UPI"
                          ? "border-primary bg-red-50/10 text-primary font-extrabold"
                          : "border-slate-200 text-slate-600 font-medium"
                      }`}
                    >
                      <QrCode className="w-5 h-5" />
                      <span>UPI Online Payment</span>
                    </button>
                  </div>

                  {paymentMethod === "UPI" && (
                    <div className="space-y-4 pt-4 border-t border-slate-100 animate-fadeIn text-left">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 max-w-sm mx-auto text-center">
                        <span className="text-xs font-bold text-slate-700 block">Scan QR Code to Pay</span>
                        <div className="w-48 h-48 bg-white mx-auto rounded-lg flex items-center justify-center border border-slate-200 overflow-hidden relative">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=KRISHNA&am=${grandTotal}&cu=INR`)}`}
                            alt="UPI QR Code"
                            className="w-full h-full p-2 object-contain"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold">
                          Payable Amount: <span className="text-primary text-xs font-black">₹{grandTotal}</span>
                        </p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Upload Transaction Screenshot *
                        </label>
                        
                        <div className="relative border-2 border-dashed border-slate-200 hover:border-primary rounded-xl p-6 text-center cursor-pointer transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleScreenshotChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="space-y-1">
                            <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                            {uploading ? (
                              <p className="text-xs text-slate-500 font-semibold animate-pulse">Uploading file...</p>
                            ) : upiScreenshot ? (
                              <p className="text-xs text-green-600 font-extrabold flex items-center justify-center">
                                <Check className="w-4 h-4 mr-1 text-green-600" /> Screenshot Attached!
                              </p>
                            ) : (
                              <p className="text-xs text-slate-500 font-semibold">Click or drag screenshot file to upload</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Checkout Button */}
                <button
                  type="submit"
                  disabled={submitting || !isWeightValid}
                  className={`w-full py-4 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-md ${
                    !isWeightValid
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-primary hover:bg-primary-hover text-white"
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Placing Order & Opening WhatsApp...</span>
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4" />
                      <span>Confirm Order via WhatsApp</span>
                    </>
                  )}
                </button>

              </form>

              {/* Cart Summary Panel (Right Side) */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 sticky top-24">
                <h2 className="text-base font-black text-slate-800 border-b border-slate-100 pb-2">
                  Order Summary
                </h2>

                {/* Items List */}
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-start gap-4 text-xs border-b border-slate-50 pb-3">
                      <div className="flex items-start space-x-3">
                        {/* Realistic Product Image Thumbnail */}
                        <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                          <img 
                            src={getProductImage(item.product.name)} 
                            alt={item.product.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="font-extrabold text-slate-700 block">
                            {language === "en" ? item.product.name : item.product.nameTelugu}
                          </span>
                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantityValue - (item.quantityUnit === "PCS" ? 1 : 0.25))}
                              className="w-5 h-5 bg-slate-100 text-slate-600 font-extrabold rounded flex items-center justify-center cursor-pointer hover:bg-slate-200"
                            >
                              -
                            </button>
                            <span className="font-bold text-slate-800">
                              {item.quantityValue}{item.quantityUnit}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantityValue + (item.quantityUnit === "PCS" ? 1 : 0.25))}
                              className="w-5 h-5 bg-slate-100 text-slate-600 font-extrabold rounded flex items-center justify-center cursor-pointer hover:bg-slate-200"
                            >
                              +
                            </button>

                            {item.cookingApplied && (
                              <span className="text-[9px] bg-red-100 text-primary font-black px-1.5 py-0.5 rounded leading-none">
                                Cooked
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right space-y-1 shrink-0">
                        <span className="font-bold text-slate-800 block">
                          ₹{item.product.basePrice * item.quantityValue}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-400 hover:text-primary transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Warnings or notices if cooked items but no raw items are ordered */}
                {cartItems.some(item => item.product.category.slug === "cooked-food") && 
                 !cartItems.some(item => item.product.category.slug === "fresh-chicken") && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs font-bold leading-normal text-left space-y-1">
                    <p className="font-extrabold flex items-center">
                      <span>⚠️ Note on Cooked Items</span>
                    </p>
                    <p className="text-[10px] text-amber-700 font-semibold leading-relaxed">
                      {language === "en" 
                        ? "You ordered cooked chicken items, but no raw chicken. The listed cooked price covers the cooking service fee only. If you need us to supply the raw chicken meat, please go back to the menu and add the corresponding raw chicken (Whole or Boneless) to your cart." 
                        : "మీరు వండిన చికెన్ ఐటమ్స్ మాత్రమే కార్ట్ కు జోడించారు, పచ్చి చికెన్‌ను కాదు. ఇక్కడ ఉన్న ధరలు కేవలం వంట రుసుము మాత్రమే. ఒకవేళ చికెన్ ముక్కలను కూడా మేమే అందించవలసి ఉంటే, దయచేసి మెనూకు వెళ్లి పచ్చి చికెన్‌ను కూడా జోడించండి."}
                    </p>
                  </div>
                )}

                {/* Calculation breakdown */}
                <div className="space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600 font-semibold">
                  <div className="flex justify-between">
                    <span>Items Total:</span>
                    <span className="text-slate-800 font-bold">₹{itemsTotal}</span>
                  </div>
                  {cookingCharges > 0 && (
                    <div className="flex justify-between">
                      <span>Masala & Cooking:</span>
                      <span className="text-slate-800 font-bold">₹{cookingCharges}</span>
                    </div>
                  )}
                  {orderType === "DELIVERY" && (
                    <div className="flex justify-between">
                      <span>Delivery Fee ({village || "None"}):</span>
                      <span className="text-slate-800 font-bold">
                        {village ? `₹${deliveryCharge}` : "Select village"}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm font-black text-slate-800 border-t border-slate-100 pt-3 mt-3">
                    <span>Grand Total:</span>
                    <span className="text-primary text-base font-black">₹{grandTotal}</span>
                  </div>
                </div>

                {/* Order weight statistics */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[10px] text-slate-500 font-medium">
                  <span className="block font-bold text-slate-700">Order Weight statistics:</span>
                  <p className="mt-0.5">Total chicken weight in order: <strong>{totalWeight.toFixed(2)} KG</strong></p>
                  {orderType === "DELIVERY" && (
                    <p className="text-green-600 font-semibold mt-0.5">✓ Eligible for Home Delivery (min 1 KG met)</p>
                  )}
                </div>

              </div>

            </div>
          )}

        </div>
      </main>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-xl relative animate-scaleUp">
            <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              <span>Verify Order Details</span>
            </h3>
            
            <div className="space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-3">
                <div>
                  <span className="font-bold text-slate-400 block uppercase tracking-wider text-[9px]">Name</span>
                  <span className="font-extrabold text-slate-800">{name}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 block uppercase tracking-wider text-[9px]">Phone</span>
                  <span className="font-extrabold text-slate-800">{phone}</span>
                </div>
              </div>

              <div className="border-b border-slate-50 pb-3">
                <span className="font-bold text-slate-400 block uppercase tracking-wider text-[9px]">Order Type</span>
                <span className="font-extrabold text-slate-800">{orderType}</span>
                {orderType === "DELIVERY" && (
                  <span className="block mt-1 text-slate-600 font-medium">
                    Village: <strong>{village}</strong><br />
                    Address: {address} {landmark && `(Landmark: ${landmark})`}
                  </span>
                )}
              </div>

              <div className="border-b border-slate-50 pb-3">
                <span className="font-bold text-slate-400 block uppercase tracking-wider text-[9px]">Items summary</span>
                <div className="max-h-[120px] overflow-y-auto mt-1 space-y-1">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-slate-600">
                      <span>{item.quantityValue}{item.quantityUnit} x {language === "en" ? item.product.name : item.product.nameTelugu} {item.cookingApplied ? "(Cooked)" : ""}</span>
                      <span className="font-bold">₹{item.product.basePrice * item.quantityValue}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center text-sm font-black text-slate-800 pt-1">
                <span>Grand Total:</span>
                <span className="text-primary text-base font-black">₹{grandTotal}</span>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-full cursor-pointer transition-colors"
              >
                Back to Edit
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={executeOrderSubmission}
                className="w-1/2 py-3 bg-primary hover:bg-primary-hover text-white font-extrabold text-xs rounded-full cursor-pointer transition-colors flex items-center justify-center space-x-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Placing...</span>
                  </>
                ) : (
                  <span>Place Order</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
