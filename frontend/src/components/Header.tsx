"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, Menu, X, Phone, User as UserIcon, Globe, Bell } from "lucide-react";
import { api, API_BASE_URL } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export default function Header() {
  const { language, setLanguage, t } = useTranslation();
  const { cartItems, getCartTotalWeight } = useCart();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  const cartCount = cartItems.reduce((acc, item) => acc + (item.quantityUnit === "PCS" ? item.quantityValue : 1), 0);

  useEffect(() => {
    const token = localStorage.getItem("app_token");
    const role = localStorage.getItem("app_role");
    const name = localStorage.getItem("app_name");
    
    if (token) {
      setIsLoggedIn(true);
      setAdminLoggedIn(role === "ROLE_ADMIN" || role === "ROLE_SUPER_ADMIN");
      if (name) {
        setUserName(name);
      }
    } else {
      setIsLoggedIn(false);
      setAdminLoggedIn(false);
      setUserName("");
    }
  }, [pathname]);

  // Fetch Notifications
  const { data: notifications = [], refetch: refetchNotifications } = useQuery({
    queryKey: ["notifications", isLoggedIn],
    queryFn: api.getNotifications,
    enabled: isLoggedIn,
    refetchInterval: 15000,
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const navLinks = [
    { href: "/", label: t("navHome") },
    { href: "/#menu", label: t("navProducts") },
    { href: "/#gallery", label: t("navGallery") },
    { href: "/#delivery", label: t("navDeliveryAreas") },
    { href: "/bulk", label: t("navBulk") },
    { href: "/order-track", label: t("trackOrder") },
    { href: "/#faq", label: t("navFAQ") },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo Branding */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
              {/* Premium Chicken & Bowl SVG silhouette */}
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C10.5 4 8 5.5 5 5.5C5 8.5 7 12 12 12C17 12 19 8.5 19 5.5C16 5.5 13.5 4 12 2Z" fill="currentColor" />
                <path d="M4 14C4 18.5 7.5 22 12 22C16.5 22 20 18.5 20 14H4Z" fill="#e5a912" />
              </svg>
            </div>
            <div>
              <span className="font-display text-lg sm:text-xl font-extrabold text-primary leading-tight tracking-tight block">
                AMRUTHA
              </span>
              <span className="font-sans text-[10px] sm:text-xs font-bold text-secondary uppercase tracking-widest block -mt-1">
                CHICKEN CENTER
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-semibold transition-colors duration-200 hover:text-primary ${
                  pathname === link.href ? "text-primary border-b-2 border-primary" : "text-slate-600"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {adminLoggedIn && (
              <Link href="/admin/dashboard" className="text-sm font-bold text-red-600 hover:text-red-700">
                Admin Panel
              </Link>
            )}
          </nav>

          {/* Language Toggle & Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Language Selector */}
            <button
              onClick={() => setLanguage(language === "en" ? "te" : "en")}
              className="flex items-center space-x-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 py-1.5 px-3 rounded-full transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === "en" ? "తెలుగు" : "English"}</span>
            </button>

            {/* Phone Hotlink */}
            <a
              href="tel:8977677193"
              className="flex items-center space-x-1.5 text-xs font-bold text-white bg-secondary hover:bg-secondary-hover py-1.5 px-3.5 rounded-full transition-colors shadow-sm"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>8977677193</span>
            </a>

            {/* Dashboard Link */}
            {isLoggedIn ? (
              <Link
                href="/customer/dashboard"
                className="flex items-center space-x-1 text-sm font-bold text-slate-700 hover:text-primary transition-colors"
              >
                <UserIcon className="w-4 h-4" />
                <span className="max-w-[100px] truncate">{userName || "Account"}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-sm font-bold text-slate-700 hover:text-primary transition-colors"
              >
                Login
              </Link>
            )}

            {/* Notification Bell (Only if Logged In) */}
            {isLoggedIn && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-all flex items-center justify-center cursor-pointer"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Popup */}
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden text-xs">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                      <span className="font-extrabold text-slate-800">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await api.markAllNotificationsRead();
                              refetchNotifications();
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className="text-[10px] text-primary font-bold hover:underline cursor-pointer"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 font-semibold select-none">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((n: any) => (
                          <div
                            key={n.id}
                            onClick={async () => {
                              if (!n.read) {
                                try {
                                  await api.markNotificationRead(n.id);
                                  refetchNotifications();
                                } catch (e) {
                                  console.error(e);
                                }
                              }
                            }}
                            className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer text-left ${
                              !n.read ? "bg-red-50/10 font-bold" : "text-slate-500"
                            }`}
                          >
                            <p className="leading-relaxed text-slate-800">{n.message}</p>
                            <span className="text-[9px] text-slate-400 block mt-1">
                              {new Date(n.createdAt).toLocaleString("en-IN")}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cart Link */}
            <Link
              href="/checkout"
              className="relative p-2.5 bg-primary hover:bg-primary-hover text-white rounded-full transition-all duration-300 hover:scale-105 shadow-md flex items-center justify-center"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-secondary text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Menu Buttons */}
          <div className="flex items-center space-x-3 lg:hidden">
            {/* Mobile Notification bell */}
            {isLoggedIn && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center cursor-pointer"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden text-xs">
                    <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                      <span className="font-bold text-slate-800">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await api.markAllNotificationsRead();
                              refetchNotifications();
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className="text-[9px] text-primary font-bold hover:underline cursor-pointer"
                        >
                          Read all
                        </button>
                      )}
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-slate-400 font-semibold">No new alerts</div>
                      ) : (
                        notifications.map((n: any) => (
                          <div
                            key={n.id}
                            onClick={async () => {
                              if (!n.read) {
                                try {
                                  await api.markNotificationRead(n.id);
                                  refetchNotifications();
                                } catch (e) {
                                  console.error(e);
                                }
                              }
                            }}
                            className={`p-3 text-left ${!n.read ? "bg-red-50/10 font-bold" : "text-slate-500"}`}
                          >
                            <p className="text-slate-800 leading-snug">{n.message}</p>
                            <span className="text-[8px] text-slate-400 block mt-0.5">
                              {new Date(n.createdAt).toLocaleTimeString("en-IN")}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cart shortcut */}
            <Link
              href="/checkout"
              className="relative p-2 bg-primary text-white rounded-full"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-secondary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-md text-slate-600 hover:text-primary hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-white px-4 pt-2 pb-6 space-y-3 shadow-lg">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
          {adminLoggedIn && (
            <Link
              href="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-bold text-red-600 hover:bg-slate-50"
            >
              Admin Panel
            </Link>
          )}

          <div className="pt-4 border-t border-slate-100 flex flex-col space-y-3 px-3">
            <button
              onClick={() => {
                setLanguage(language === "en" ? "te" : "en");
                setMobileMenuOpen(false);
              }}
              className="flex items-center space-x-2 text-sm font-semibold text-slate-700"
            >
              <Globe className="w-4 h-4 text-primary" />
              <span>{language === "en" ? "తెలుగు భాషను ఎంచుకోండి" : "Switch to English"}</span>
            </button>

            <a
              href="tel:8977677193"
              className="flex items-center space-x-2 text-sm font-semibold text-slate-700"
            >
              <Phone className="w-4 h-4 text-secondary" />
              <span>Call: 8977677193</span>
            </a>

            {isLoggedIn ? (
              <Link
                href="/customer/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 text-sm font-semibold text-slate-700 hover:text-primary"
              >
                <UserIcon className="w-4 h-4 text-primary" />
                <span>My Account ({userName})</span>
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 bg-slate-100 rounded-md text-sm font-semibold text-slate-700"
              >
                Login / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
