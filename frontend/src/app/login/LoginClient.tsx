"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Lock, Phone, AlertCircle, Loader2, ChevronRight, UserPlus, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function LoginClient() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      setError("Please fill out both phone and password.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const response = await api.login({ phone, password });
      
      // Save details to LocalStorage
      localStorage.setItem("app_token", response.token);
      localStorage.setItem("app_userId", String(response.id));
      localStorage.setItem("app_role", response.role);
      localStorage.setItem("app_name", response.name || "Customer");
      localStorage.setItem("app_phone", response.phone);

      // Redirect based on role
      if (response.role === "ROLE_ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/customer/dashboard");
      }
    } catch (err: any) {
      let errMsg = "Login failed. Please check your credentials.";
      if (err.message) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.message === "Bad credentials" || parsed.status === 401 || parsed.error === "Unauthorized") {
            errMsg = "Invalid credentials";
          } else {
            errMsg = parsed.message || errMsg;
          }
        } catch (e) {
          if (err.message.includes("Bad credentials") || err.message.includes("401") || err.message.includes("Unauthorized")) {
            errMsg = "Invalid credentials";
          } else {
            errMsg = err.message;
          }
        }
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          <div className="bg-primary text-white p-6 text-center space-y-1">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">Welcome Back</h1>
            <p className="text-xs text-red-100">Sign in to your Amrutha Chicken account</p>
          </div>

          <div className="p-6 sm:p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center space-x-2.5 text-xs font-bold mb-4">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone Number</label>
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
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-10 text-xs font-semibold outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center space-y-2">
              <span className="text-xs text-slate-400 block">Don't have an account?</span>
              <Link 
                href="/register" 
                className="inline-flex items-center space-x-1 text-xs font-bold text-slate-700 hover:text-primary transition-colors"
              >
                <UserPlus className="w-4 h-4 text-secondary" />
                <span>Create an Account</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
