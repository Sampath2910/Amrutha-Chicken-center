"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { User, Phone, Lock, Mail, AlertCircle, Loader2, ArrowLeft, LogIn } from "lucide-react";
import Link from "next/link";

export default function RegisterClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !password || !confirmPassword) {
      setError("Please fill out all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      await api.register({
        name,
        phone,
        email: email || null,
        password,
      });

      // Redirect to login after successful register
      alert("Registration successful! Please login.");
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          <div className="bg-primary text-white p-6 text-center space-y-1">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">Create Account</h1>
            <p className="text-xs text-red-100">Unlock faster checkout and order history</p>
          </div>

          <div className="p-6 sm:p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center space-x-2.5 text-xs font-bold mb-4">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-xs font-semibold outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone Number *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-xs font-semibold outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address (Optional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-xs font-semibold outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Password *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-xs font-semibold outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Confirm Password *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-xs font-semibold outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-hover text-white py-3.5 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center space-y-2">
              <span className="text-xs text-slate-400 block">Already have an account?</span>
              <Link 
                href="/login" 
                className="inline-flex items-center space-x-1 text-xs font-bold text-slate-700 hover:text-primary transition-colors"
              >
                <LogIn className="w-4 h-4 text-secondary" />
                <span>Log In Here</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
