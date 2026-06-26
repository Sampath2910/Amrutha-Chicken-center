"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api, Order } from "@/lib/api";
import { useTranslation } from "@/context/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Search, Loader2, CheckCircle2, ShoppingBag, Truck, Gift, ClipboardCheck, AlertCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";

function OrderTrackContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const idParam = searchParams.get("id");
    const phoneParam = searchParams.get("phone");
    if (idParam && phoneParam) {
      setOrderId(idParam);
      setPhone(phoneParam);
      handleTrack(parseInt(idParam), phoneParam);
    }
  }, [searchParams]);

  const handleTrack = async (idVal: number, phoneVal: string) => {
    setLoading(true);
    setError("");
    try {
      const data = await api.trackOrder(idVal, phoneVal);
      setOrder(data);
    } catch (err: any) {
      setError(err.message || "Order not found. Please verify the ID and phone number.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !phone) {
      setError("Please fill out both order ID and phone number.");
      return;
    }
    handleTrack(parseInt(orderId), phone);
  };

  // Status mapping
  const statuses = ["PENDING", "ACCEPTED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];
  
  const getStatusIndex = (currentStatus: string) => {
    return statuses.indexOf(currentStatus.toUpperCase());
  };

  const currentStep = order ? getStatusIndex(order.status) : -1;
  const isCancelled = order?.status === "CANCELLED";

  const steps = [
    { name: "Order Placed", labelTelugu: "ఆర్డర్ చేసారు", desc: "Awaiting confirmation", icon: ClipboardCheck },
    { name: "Accepted", labelTelugu: "అంగీకరించారు", desc: "Confirmed by admin", icon: CheckCircle2 },
    { name: "Preparing", labelTelugu: "తయారు చేస్తున్నారు", desc: "Cleaning, cutting, and spices", icon: ShoppingBag },
    { name: order?.orderType === "PICKUP" ? "Ready for Pickup" : "Out for Delivery", labelTelugu: order?.orderType === "PICKUP" ? "పికప్ సిద్ధం" : "డెలివరీలో ఉంది", desc: "Dispatched or prepared", icon: Truck },
    { name: "Delivered", labelTelugu: "డెలివరీ అయింది", desc: "Completed successfully", icon: Gift },
  ];

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden my-12">
      
      {/* Header Banner */}
      <div className="bg-primary text-white p-6 sm:p-8">
        <Link href="/" className="inline-flex items-center text-xs font-bold text-red-200 hover:text-white transition-colors mb-2">
          <ChevronLeft className="w-4 h-4 mr-1" />
          <span>Back to Home</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight">
          Track Your Order
        </h1>
        <p className="text-xs text-red-100">
          Enter your unique order ID and phone number to monitor cooking and delivery progress in real time.
        </p>
      </div>

      <div className="p-6 sm:p-8">
        
        {/* Track Inputs Form */}
        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-100 pb-6 mb-8">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Order ID</label>
            <input
              type="number"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g. 1004"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 8977677193"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4 text-secondary" />
                  <span>Search Order</span>
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center space-x-2.5 text-xs font-bold mb-4">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Visual Progress Steps Tracker */}
        {order && (
          <div className="space-y-8">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Order Reference</span>
                <span className="text-base font-extrabold text-slate-800">Order #{order.id}</span>
                <span className="text-[10px] bg-secondary/20 text-secondary-hover font-bold px-2 py-0.5 rounded ml-2 uppercase">
                  {order.orderType}
                </span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Grand Total</span>
                <span className="text-lg font-black text-primary">₹{order.grandTotal}</span>
                <span className="text-[10px] text-slate-500 font-medium block">
                  {order.paymentMethod} • {order.paymentStatus === "VERIFIED" ? "Paid" : "Cash on Hand"}
                </span>
              </div>
            </div>

            {/* Cancelled Alert Banner */}
            {isCancelled ? (
              <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-xl text-center space-y-2">
                <AlertCircle className="w-12 h-12 text-primary mx-auto animate-pulse" />
                <h3 className="text-base font-black">This Order Has Been Cancelled</h3>
                <p className="text-xs text-red-600 max-w-sm mx-auto leading-relaxed">
                  We are sorry, but this order has been marked as cancelled by the store administrator. Please contact Krishna at 8977677193 for further assistance.
                </p>
              </div>
            ) : (
              /* Steps bar */
              <div className="space-y-6 pt-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider text-center">
                  Live Preparation Progress:
                </h3>

                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute left-6 md:left-1/2 top-4 bottom-4 md:-translate-x-1/2 w-1 bg-slate-100 -z-10">
                    <div 
                      className="w-full bg-primary transition-all duration-500 ease-in-out"
                      style={{ 
                        height: `${Math.max(0, currentStep) * (100 / (steps.length - 1))}%`,
                        maxHeight: "100%"
                      }}
                    ></div>
                  </div>

                  {/* Steps Grid */}
                  <div className="space-y-8 md:space-y-12">
                    {steps.map((step, idx) => {
                      const IconComponent = step.icon;
                      const active = idx <= currentStep;
                      const isCurrent = idx === currentStep;

                      return (
                        <div key={idx} className="flex md:grid md:grid-cols-2 items-center gap-4">
                          
                          {/* Label left side on desktop */}
                          <div className={`hidden md:block text-right pr-6 ${active ? "text-slate-800 font-extrabold" : "text-slate-400 font-medium"}`}>
                            {idx % 2 === 0 ? (
                              <div>
                                <h4 className="text-sm font-black">{step.name}</h4>
                                <p className="text-[10px] text-slate-500 font-medium mt-0.5">{step.desc}</p>
                              </div>
                            ) : null}
                          </div>

                          {/* Node Icon Indicator */}
                          <div className="flex md:justify-center relative">
                            <div 
                              className={`w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all duration-300 shadow-md ${
                                isCurrent 
                                  ? "bg-primary border-secondary text-white scale-110"
                                  : active 
                                  ? "bg-slate-900 border-slate-900 text-white" 
                                  : "bg-white border-slate-200 text-slate-300"
                              }`}
                            >
                              <IconComponent className="w-5 h-5" />
                            </div>
                          </div>

                          {/* Label right side on desktop & always on mobile */}
                          <div className={`pl-2 md:pl-6 ${active ? "text-slate-800 font-extrabold" : "text-slate-400 font-medium"}`}>
                            <div className="md:hidden">
                              <h4 className="text-sm font-black">{step.name}</h4>
                              <p className="text-[10px] text-slate-500 font-medium mt-0.5">{step.desc}</p>
                            </div>
                            <div className="hidden md:block">
                              {idx % 2 !== 0 ? (
                                <div>
                                  <h4 className="text-sm font-black">{step.name}</h4>
                                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">{step.desc}</p>
                                </div>
                              ) : null}
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Order Items detail listing */}
            <div className="border-t border-slate-100 pt-6 mt-8">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">Order Summary:</h4>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-xs text-slate-700">
                    <div className="font-semibold">
                      {item.productName} 
                      <span className="text-slate-400 font-medium ml-1.5">
                        ({item.quantityValue}{item.quantityUnit})
                      </span>
                      {item.cookingApplied && (
                        <span className="text-[9px] bg-red-100 text-primary px-1.5 py-0.5 rounded ml-2 font-extrabold">
                          Cooked Service
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-slate-900">₹{item.subtotal}</span>
                  </div>
                ))}
                
                <div className="border-t border-slate-200/60 pt-2.5 mt-2.5 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Items Total:</span>
                    <span>₹{order.itemTotal}</span>
                  </div>
                  {order.cookingCharge > 0 && (
                    <div className="flex justify-between">
                      <span>Total Cooking Fee:</span>
                      <span>₹{order.cookingCharge}</span>
                    </div>
                  )}
                  {order.deliveryCharge > 0 && (
                    <div className="flex justify-between">
                      <span>Delivery Fee:</span>
                      <span>₹{order.deliveryCharge}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-slate-900 text-sm border-t border-slate-200/60 pt-2.5 mt-2.5">
                    <span>Grand Total:</span>
                    <span>₹{order.grandTotal}</span>
                  </div>
                </div>

                {order.deliveryAddress && (
                  <div className="border-t border-slate-200/60 pt-2.5 mt-2 text-xs text-slate-500 space-y-0.5">
                    <span className="font-bold text-slate-700 block">Delivery Address:</span>
                    <p>{order.deliveryVillage}, {order.deliveryAddress}</p>
                    {order.deliveryLandmark && <p>Landmark: {order.deliveryLandmark}</p>}
                  </div>
                )}

                {order.notes && (
                  <div className="border-t border-slate-200/60 pt-2 mt-2 text-xs text-slate-500">
                    <span className="font-bold text-slate-700 block">Instructions:</span>
                    <p className="italic">"{order.notes}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function OrderTrackPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <Suspense fallback={
          <div className="max-w-3xl mx-auto bg-white rounded-2xl p-12 text-center shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            <p className="text-slate-500 mt-2 text-xs font-semibold">Loading tracker...</p>
          </div>
        }>
          <OrderTrackContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
