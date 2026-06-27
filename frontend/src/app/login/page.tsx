import type { Metadata } from "next";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Customer Login - Amrutha Chicken Center, Morthad",
  description: "Log in to your Amrutha Chicken Center account to view order history, manage saved delivery addresses, and track active orders online.",
  keywords: ["Amrutha Chicken Login", "Chicken shop login Morthad", "track chicken order Morthad"],
  alternates: {
    canonical: "/login",
  },
};

export default function LoginPage() {
  return <LoginClient />;
}
