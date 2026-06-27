import type { Metadata } from "next";
import BulkClient from "./BulkClient";

export const metadata: Metadata = {
  title: "Bulk Ordering & Event Catering - Amrutha Chicken Center, Morthad",
  description: "Plan weddings, village festivals, parties, or functions in Morthad, Telangana. Submit a bulk chicken catering inquiry for custom orders of fresh chicken, chicken curry, fry, dry roast, and chapathis.",
  keywords: ["Bulk Chicken Morthad", "Chicken Catering Morthad", "Wedding Chicken Morthad", "Village Festival Catering Telangana"],
  alternates: {
    canonical: "/bulk",
  },
};

export default function BulkPage() {
  return <BulkClient />;
}
