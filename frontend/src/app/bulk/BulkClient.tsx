"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useTranslation } from "@/context/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Calendar, CheckCircle2, ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function BulkClient() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    eventType: "Festival",
    eventDate: "",
    expectedQuantity: "",
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: api.submitBulkOrder,
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err: any) => {
      alert("Submission failed: " + err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.eventDate || !formData.expectedQuantity) {
      alert("Please fill out all required fields.");
      return;
    }
    mutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Header decoration */}
          <div className="bg-primary text-white p-6 sm:p-8 space-y-2">
            <Link href="/" className="inline-flex items-center text-xs font-bold text-red-200 hover:text-white transition-colors mb-2">
              <ChevronLeft className="w-4 h-4 mr-1" />
              <span>Back to Home</span>
            </Link>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Bulk Ordering & Catering Inquiry
            </h1>
            <p className="text-xs text-red-100">
              Planning a larger gathering? Tell us about your event and expected chicken weight or chapathi packages.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {submitted ? (
              <div className="text-center py-8 space-y-4">
                <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto animate-bounce" />
                <h2 className="text-lg font-black text-slate-800">
                  Inquiry Submitted Successfully!
                </h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Thank you for contacting Amrutha Chicken Center. We have received your inquiry. The owner will review details and contact you at <strong className="text-slate-700">{formData.phone}</strong> shortly.
                </p>
                <div className="pt-4">
                  <Link 
                    href="/" 
                    className="bg-primary hover:bg-primary-hover text-white font-extrabold text-xs py-3 px-6 rounded-full inline-block"
                  >
                    Return to Home
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">
                    Your Name <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">
                    Contact Phone Number <span className="text-primary">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="Enter phone number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">
                      Event Type <span className="text-primary">*</span>
                    </label>
                    <select
                      name="eventType"
                      value={formData.eventType}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-primary transition-colors cursor-pointer"
                    >
                      <option value="Festival">Village Festival</option>
                      <option value="Wedding">Wedding / Marriage</option>
                      <option value="Birthday">Birthday Party</option>
                      <option value="Function">Family Function</option>
                      <option value="Other">Other Event</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">
                      Event Date <span className="text-primary">*</span>
                    </label>
                    <input
                      type="date"
                      name="eventDate"
                      value={formData.eventDate}
                      onChange={handleChange}
                      required
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">
                    Expected Quantities <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    name="expectedQuantity"
                    value={formData.expectedQuantity}
                    onChange={handleChange}
                    required
                    placeholder="e.g. 50 KG Chicken Curry, 300 Chapathis"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">
                    Additional Instructions / Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe spice preferences, packing, timing, or delivery location details..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-primary transition-colors"
                  ></textarea>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="w-full bg-primary hover:bg-primary-hover text-white py-3.5 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>Submit Catering Request</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
