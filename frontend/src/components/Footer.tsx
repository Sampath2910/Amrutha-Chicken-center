"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";
import { Phone, MapPin, Clock, MessageCircle } from "lucide-react";

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-slate-900 text-slate-300 border-t-4 border-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand section */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-display text-xl font-black text-white tracking-wide">
                AMRUTHA <span className="text-secondary">CHICKEN</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              {t("tagline")}
            </p>
            <div className="flex space-x-3 pt-2">
              <a
                href="https://wa.me/918977677193"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center transition-colors"
                title="Chat on WhatsApp"
              >
                <MessageCircle className="w-4.5 h-4.5" />
              </a>
              <a
                href="tel:8977677193"
                className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary-hover text-white flex items-center justify-center transition-colors"
                title="Call Us"
              >
                <Phone className="w-4.5 h-4.5" />
              </a>
            </div>
          </div>

          {/* Quick Contacts */}
          <div className="space-y-4">
            <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">
              {t("contactTitle")}
            </h3>
            <ul className="space-y-3 text-xs">
              <li className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-secondary shrink-0" />
                <a href="tel:8977677193" className="hover:text-white transition-colors font-semibold">
                  8977677193
                </a>
              </li>
              <li className="flex items-center space-x-2.5">
                <MessageCircle className="w-4 h-4 text-green-500 shrink-0" />
                <a href="https://wa.me/918977677193" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors font-semibold">
                  WhatsApp Support
                </a>
              </li>
              <li className="flex items-center space-x-2.5">
                <span className="w-4 h-4 text-secondary shrink-0 flex items-center justify-center font-black">✓</span>
                <Link href="/order-track" className="hover:text-white transition-colors font-semibold">
                  {t("trackOrder")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Operations Hours */}
          <div className="space-y-4">
            <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">
              {t("hoursTitle")}
            </h3>
            <ul className="space-y-3 text-xs">
              <li className="flex items-center space-x-2.5">
                <Clock className="w-4 h-4 text-secondary shrink-0" />
                <span>6:00 AM - 9:00 PM</span>
              </li>
              <li className="text-slate-400">
                Open all days of the week, including Sundays and public festivals.
              </li>
            </ul>
          </div>

          {/* Address Location */}
          <div className="space-y-4">
            <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">
              {t("addressTitle")}
            </h3>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Near Bus Stand,<br />
                  Morthad, Telangana - 503225
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
          <p>© {currentYear} Amrutha Chicken Center. {t("allRightsReserved")}</p>
        </div>
      </div>
    </footer>
  );
}
