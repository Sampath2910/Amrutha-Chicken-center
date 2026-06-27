import type { Metadata } from "next";
import RegisterClient from "./RegisterClient";

export const metadata: Metadata = {
  title: "Register Account - Amrutha Chicken Center, Morthad",
  description: "Create your Amrutha Chicken Center account online. Unlock faster home delivery or pickup checkout, save your favorite addresses, and view order history.",
  keywords: ["Amrutha Chicken Register", "Chicken shop account Morthad", "order fresh chicken Telangana"],
  alternates: {
    canonical: "/register",
  },
};

export default function RegisterPage() {
  return <RegisterClient />;
}
