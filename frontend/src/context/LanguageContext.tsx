"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "te";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // App Header & Branding
    brand: "Amrutha Chicken Center",
    tagline: "Fresh Every Day, Delicious Every Time",
    heroTitle: "Fresh Quality Chicken & Home-Style Mess Services",
    heroDesc: "Direct from farm raw cuts, slow-cooked traditional chicken curries, deep fries, and soft hand-made chapathis. Delivered piping hot in Morthad and surrounding areas.",
    
    // Actions & Navigation
    orderNow: "Order Now",
    callNow: "Call Now",
    whatsappNow: "WhatsApp Now",
    trackOrder: "Track Order",
    navHome: "Home",
    navProducts: "Menu",
    navAbout: "About Us",
    navContact: "Contact",
    navFAQ: "FAQs",
    navGallery: "Gallery",
    navOffers: "Offers",
    navBulk: "Bulk Orders",
    
    // Shop status & settings
    shopClosed: "Orders are currently unavailable. Please call 8977677193.",
    todayRates: "Today's Chicken Rates",
    lastUpdated: "Last updated",
    perKg: "per KG",
    
    // Categories
    catFresh: "Fresh Chicken",
    catCooked: "Cooked Food Services",
    catChapathi: "Fresh Chapathis",
    
    // Business rules
    ruleDeliveryMin: "Home Delivery is available ONLY for orders of 1 KG and above.",
    rulePickupOnly: "250g & 500g orders are available for Pickup Only.",
    cookingChargeInclude: "Cooking charges include cleaning, cutting, masala, packaging, and home cooking.",
    cookingChargeTitle: "Cooking Charges",
    cookingChargeRate: "₹220 per KG (Chicken cost extra)",
    
    // Why Choose Us
    wcuTitle: "Why Choose Amrutha Chicken?",
    wcuFresh: "Fresh Daily Stock",
    wcuFreshDesc: "We dress and clean chicken multiple times throughout the day, guaranteeing absolute freshness.",
    wcuHomeStyle: "Home-Style Spices",
    wcuHomeStyleDesc: "No preservatives, artificial colors, or chemicals. Prepared using hand-pounded village masala.",
    wcuTrusted: "Trusted Local Business",
    wcuTrustedDesc: "Proudly serving Morthad and neighbouring villages with hygiene and taste for years.",
    wcuQuick: "Fast Doorstep Delivery",
    wcuQuickDesc: "We deliver within a 15 KM radius quickly to keep your chicken curry hot and fresh.",
    
    // Footer / Contact Info
    addressTitle: "Shop Location",
    hoursTitle: "Business Hours",
    contactTitle: "Call or WhatsApp",
    allRightsReserved: "All rights reserved.",
  },
  te: {
    // App Header & Branding
    brand: "అమృత చికెన్ సెంటర్",
    tagline: "ప్రతిరోజూ తాజా, ప్రతిసారీ రుచికరమైనది",
    heroTitle: "తాజా నాణ్యమైన చికెన్ & హోమ్-స్టైల్ మెస్ సర్వీసెస్",
    heroDesc: "నేరుగా ఫారమ్ నుండి తెచ్చిన చికెన్ ముక్కలు, సాంప్రదాయ పద్ధతిలో వండిన చికెన్ కర్రీలు, ఫ్రైలు మరియు సాఫ్ట్ చపాతీలు. మోర్తాడు మరియు చుట్టుపక్కల గ్రామాలలో వేడివేడిగా డెలివరీ చేయబడును.",
    
    // Actions & Navigation
    orderNow: "ఇప్పుడే ఆర్డర్ చేయండి",
    callNow: "కాల్ చేయండి",
    whatsappNow: "వాట్సాప్ చేయండి",
    trackOrder: "ఆర్డర్ ట్రాక్",
    navHome: "హోమ్",
    navProducts: "మెనూ",
    navAbout: "మా గురించి",
    navContact: "సంప్రదించండి",
    navFAQ: "FAQs",
    navGallery: "గ్యాలరీ",
    navOffers: "ఆఫర్లు",
    navBulk: "బల్క్ ఆర్డర్లు",
    
    // Shop status & settings
    shopClosed: "ఆర్డర్లు తాత్కాలికంగా నిలిపివేయబడ్డాయి. దయచేసి 8977677193 కి కాల్ చేయండి.",
    todayRates: "ఈరోజు చికెన్ ధరలు",
    lastUpdated: "చివరి అప్‌డేట్",
    perKg: "కేజీకి",
    
    // Categories
    catFresh: "తాజా చికెన్",
    catCooked: "వండిన ఆహారాలు",
    catChapathi: "తాజా చపాతీలు",
    
    // Business rules
    ruleDeliveryMin: "హోమ్ డెలివరీ కేవలం 1 KG మరియు అంతకంటే ఎక్కువ బరువు ఉన్న ఆర్డర్లకే అందుబాటులో ఉంటుంది.",
    rulePickupOnly: "250g & 500g ఆర్డర్లు కేవలం పికప్ (షాప్ వద్ద తీసుకోవడం) కొరకే అందుబాటులో ఉంటాయి.",
    cookingChargeInclude: "వంట ఛార్జీలలో శుభ్రపరచడం, కటింగ్, మసాలా మరియు ప్యాకేజింగ్ మరియు వంట ఉన్నాయి.",
    cookingChargeTitle: "వంట ఛార్జీలు",
    cookingChargeRate: "కేజీకి ₹220 (చికెన్ ధర విడిగా ఉంటుంది)",
    
    // Why Choose Us
    wcuTitle: "అమృత చికెన్ ఎందుకు ఎంచుకోవాలి?",
    wcuFresh: "ప్రతిరోజూ తాజా స్టాక్",
    wcuFreshDesc: "మేము రోజంతా చికెన్‌ను కట్ చేసి శుభ్రపరుస్తాము, దీనివల్ల సంపూర్ణ తాజాదనం లభిస్తుంది.",
    wcuHomeStyle: "ఇంటి మసాలాలు",
    wcuHomeStyleDesc: "ఎటువంటి రసాయనాలు లేకుండా, ఇంట్లో దంచిన మసాలాలతో మాత్రమే వంట వండబడును.",
    wcuTrusted: "నమ్మకమైన స్థానిక వ్యాపారం",
    wcuTrustedDesc: "మోర్తాడు మరియు చుట్టుపక్కల గ్రామాల్లో ఎన్నో సంవత్సరాలుగా నాణ్యతతో కూడిన సేవలు అందిస్తున్నాము.",
    wcuQuick: "త్వరిత డెలివరీ",
    wcuQuickDesc: "వేడి వేడి చికెన్ కర్రీ మీ వద్దకు చేరేలా 15 కిలోమీటర్ల వ్యాసార్థంలో త్వరిత డెలివరీ సదుపాయం.",
    
    // Footer / Contact Info
    addressTitle: "షాప్ చిరునామా",
    hoursTitle: "వ్యాపార సమయం",
    contactTitle: "ఫోన్ లేదా వాట్సాప్",
    allRightsReserved: "అన్ని హక్కులు ప్రత్యేకించబడ్డాయి.",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("app_lang") as Language;
    if (savedLang === "en" || savedLang === "te") {
      setLanguage(savedLang);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("app_lang", lang);
  };

  const t = (key: string): string => {
    const langDict = translations[language] as any;
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to English
    const fallbackDict = translations["en"] as any;
    return fallbackDict[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
