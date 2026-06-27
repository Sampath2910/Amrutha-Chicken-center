import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Amrutha Chicken Center - Fresh Daily Chicken & Mess Services, Morthad",
  description: "Order fresh chicken cuts (Whole, Boneless, Wings, Drumsticks), home-style chicken curry, fries, dry roasts, and soft chapathis online. Quick delivery within 15 KM service radius in Morthad, Telangana.",
  keywords: ["Chicken Shop Morthad", "Fresh Chicken Morthad", "Chicken Delivery Morthad", "Chicken Curry Morthad", "Chicken Fry Morthad", "Chapathis Morthad", "Telangana Chicken Center"],
  authors: [{ name: "Amrutha Chicken Center" }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://amrutha-chicken-frontend.onrender.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Amrutha Chicken Center - Fresh Daily Chicken & Mess Services",
    description: "Order fresh chicken cuts, hot home-style curries, and chapathis online. Delivery in Morthad, Telangana.",
    url: "/",
    siteName: "Amrutha Chicken Center",
    images: [
      {
        url: "/shop_front.jpg",
        width: 800,
        height: 600,
        alt: "Amrutha Chicken Center Shop Front",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Amrutha Chicken Center - Fresh Daily Chicken",
    description: "Order fresh chicken cuts and mess food online in Morthad.",
    images: ["/shop_front.jpg"],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://amrutha-chicken-frontend.onrender.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Amrutha Chicken Center",
    "image": `${siteUrl}/shop_front.jpg`, 
    "@id": `${siteUrl}/#store`,
    "url": siteUrl,
    "telephone": "+918977677193",
    "priceRange": "₹₹",
    "category": "Chicken Shop",
    "description": "Amrutha Chicken Center in Morthad provides fresh daily chicken cuts (Whole, Boneless, Wings, Drumsticks) and premium mess services including chicken curry, chicken fry, dry roast, and chapathis with home delivery.",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Near Bus Stand",
      "addressLocality": "Morthad",
      "addressRegion": "Telangana",
      "postalCode": "503225",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "18.8257",
      "longitude": "78.4312"
    },
    "hasMap": "https://maps.google.com/?q=18.8257,78.4312",
    "areaServed": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "latitude": "18.8257",
        "longitude": "78.4312"
      },
      "geoRadius": "15000"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "06:00",
      "closes": "21:00"
    },
    "sameAs": [
      "https://www.facebook.com/AmruthaChickenMorthad",
      "https://www.instagram.com/AmruthaChickenMorthad",
      "https://www.youtube.com/@AmruthaChickenMorthad",
      "https://maps.google.com/?cid=1234567890123456789"
    ]
  };

  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
                `,
              }}
            />
          </>
        )}
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
