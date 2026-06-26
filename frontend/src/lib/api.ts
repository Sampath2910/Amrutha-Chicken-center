export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function getProductImage(productName: string): string {
  const name = productName.toLowerCase();
  if (name.includes("whole")) return "/products/raw_whole_chicken.png";
  if (name.includes("boneless")) return "/products/raw_boneless_chicken.png";
  if (name.includes("wing")) return "/products/raw_chicken_wings.png";
  if (name.includes("drumstick") || name.includes("leg")) return "/products/raw_chicken_drumsticks.png";
  if (name.includes("curry")) return "/products/cooked_chicken_curry.png";
  if (name.includes("fry")) return "/products/cooked_chicken_fry.png";
  if (name.includes("dry roast") || name.includes("roast")) return "/products/cooked_chicken_dry_roast.png";
  if (name.includes("chapathi") || name.includes("chapati")) return "/products/fresh_chapathis.png";
  return "/shop_angle.jpg"; // fallback
}

export interface Category {
  id: number;
  name: string;
  nameTelugu: string;
  slug: string;
  description: string;
}

export interface Product {
  id: number;
  category: Category;
  name: string;
  nameTelugu: string;
  description: string;
  descriptionTelugu: string;
  basePrice: number;
  isChicken: boolean;
  status: "AVAILABLE" | "LIMITED_STOCK" | "OUT_OF_STOCK";
}

export interface OrderItem {
  id: number;
  product: Product;
  productName: string;
  quantityValue: number;
  quantityUnit: string;
  pricePerUnit: number;
  cookingApplied: boolean;
  cookingChargeRate: number;
  subtotal: number;
}

export interface Order {
  id: number;
  guestName: string | null;
  guestPhone: string | null;
  user: { id: number; phone: string; role: string } | null;
  orderType: "DELIVERY" | "PICKUP";
  status: "PENDING" | "ACCEPTED" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
  itemTotal: number;
  cookingCharge: number;
  deliveryCharge: number;
  grandTotal: number;
  paymentMethod: "COD" | "UPI";
  upiScreenshotUrl: string | null;
  paymentStatus: "PENDING" | "VERIFIED" | "FAILED";
  deliveryVillage: string | null;
  deliveryAddress: string | null;
  deliveryLandmark: string | null;
  notes: string | null;
  orderItems: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Offer {
  id: number;
  title: string;
  titleTelugu: string;
  description: string;
  descriptionTelugu: string;
  discountPercentage: number;
  promoCode: string | null;
  bannerUrl: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Gallery {
  id: number;
  imageUrl: string;
  caption: string | null;
  captionTelugu: string | null;
  isActive: boolean;
}

export interface Announcement {
  id: number;
  text: string;
  textTelugu: string;
  isActive: boolean;
}

export interface Review {
  id: number;
  customerName: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

export interface Address {
  id: number;
  villageName: string;
  addressLine: string;
  landmark: string | null;
  isDefault: boolean;
}

export interface DeliveryArea {
  id: number;
  villageName: string;
  chargeAmount: number;
  isActive: boolean;
}

export interface BulkOrder {
  id: number;
  name: string;
  phone: string;
  eventType: string;
  eventDate: string;
  expectedQuantity: string;
  notes: string | null;
  status: "PENDING" | "CONTACTED" | "COMPLETED" | "CANCELLED";
  createdAt: string;
}

export interface AuditLog {
  id: number;
  action: string;
  details: string;
  ipAddress: string;
  createdAt: string;
  user?: { phone: string };
}

// Helper to make API requests with Auth headers
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("app_token") : null;
  
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `API error: ${response.statusText}`);
  }

  // Handle empty or text responses
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

export const api = {
  // PUBLIC APIS
  getCategories: (): Promise<Category[]> => apiRequest("/api/public/categories"),
  getProducts: (): Promise<Product[]> => apiRequest("/api/public/products"),
  getSettings: (): Promise<Record<string, string>> => apiRequest("/api/public/settings"),
  getDeliveryAreas: (): Promise<DeliveryArea[]> => apiRequest("/api/public/delivery-areas"),
  getOffers: (): Promise<Offer[]> => apiRequest("/api/public/offers"),
  getGallery: (): Promise<Gallery[]> => apiRequest("/api/public/gallery"),
  getAnnouncements: (): Promise<Announcement[]> => apiRequest("/api/public/announcements"),
  getReviews: (): Promise<Review[]> => apiRequest("/api/public/reviews"),
  placeGuestOrder: (order: any): Promise<Order> => apiRequest("/api/public/orders", {
    method: "POST",
    body: JSON.stringify(order),
  }),
  trackOrder: (orderId: number, phone: string): Promise<Order> => 
    apiRequest(`/api/public/orders/track?orderId=${orderId}&phone=${encodeURIComponent(phone)}`),
  submitBulkOrder: (inquiry: any): Promise<BulkOrder> => apiRequest("/api/public/bulk-orders", {
    method: "POST",
    body: JSON.stringify(inquiry),
  }),
  uploadScreenshot: (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    return apiRequest("/api/public/upload-screenshot", {
      method: "POST",
      body: formData,
    });
  },

  // AUTH APIS
  login: (credentials: any): Promise<any> => apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  }),
  register: (userDetails: any): Promise<any> => apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(userDetails),
  }),

  // CUSTOMER APIS
  getProfile: (): Promise<any> => apiRequest("/api/customer/profile"),
  updateProfile: (profile: any): Promise<any> => apiRequest("/api/customer/profile", {
    method: "PUT",
    body: JSON.stringify(profile),
  }),
  getAddresses: (): Promise<Address[]> => apiRequest("/api/customer/addresses"),
  addAddress: (address: any): Promise<Address> => apiRequest("/api/customer/addresses", {
    method: "POST",
    body: JSON.stringify(address),
  }),
  deleteAddress: (id: number): Promise<any> => apiRequest(`/api/customer/addresses/${id}`, {
    method: "DELETE",
  }),
  getCustomerOrders: (): Promise<Order[]> => apiRequest("/api/customer/orders"),
  placeCustomerOrder: (order: any): Promise<Order> => apiRequest("/api/customer/orders", {
    method: "POST",
    body: JSON.stringify(order),
  }),
  getNotifications: (): Promise<any[]> => apiRequest("/api/customer/notifications"),
  markNotificationRead: (id: number): Promise<any> => apiRequest(`/api/customer/notifications/${id}/read`, {
    method: "PUT",
  }),
  markAllNotificationsRead: (): Promise<any> => apiRequest("/api/customer/notifications/read-all", {
    method: "PUT",
  }),

  // ADMIN APIS
  getAdminStats: (): Promise<any> => apiRequest("/api/admin/stats"),
  getAdminOrders: (): Promise<Order[]> => apiRequest("/api/admin/orders"),
  updateOrderStatus: (id: number, status: string): Promise<Order> => 
    apiRequest(`/api/admin/orders/${id}/status?status=${status}`, { method: "PUT" }),
  updateOrderPayment: (id: number, paymentStatus: string): Promise<Order> => 
    apiRequest(`/api/admin/orders/${id}/payment?paymentStatus=${paymentStatus}`, { method: "PUT" }),
  createProduct: (product: any): Promise<Product> => apiRequest("/api/admin/products", {
    method: "POST",
    body: JSON.stringify(product),
  }),
  updateProduct: (id: number, product: any): Promise<Product> => apiRequest(`/api/admin/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(product),
  }),
  deleteProduct: (id: number): Promise<any> => apiRequest(`/api/admin/products/${id}`, {
    method: "DELETE",
  }),
  updateSettings: (settings: Record<string, string>): Promise<any> => apiRequest("/api/admin/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  }),
  getAdminDeliveryAreas: (): Promise<DeliveryArea[]> => apiRequest("/api/admin/delivery-areas"),
  createDeliveryArea: (area: any): Promise<DeliveryArea> => apiRequest("/api/admin/delivery-areas", {
    method: "POST",
    body: JSON.stringify(area),
  }),
  updateDeliveryArea: (id: number, area: any): Promise<DeliveryArea> => apiRequest(`/api/admin/delivery-areas/${id}`, {
    method: "PUT",
    body: JSON.stringify(area),
  }),
  getAdminOffers: (): Promise<Offer[]> => apiRequest("/api/admin/offers"),
  createOffer: (offer: any): Promise<Offer> => apiRequest("/api/admin/offers", {
    method: "POST",
    body: JSON.stringify(offer),
  }),
  updateOffer: (id: number, offer: any): Promise<Offer> => apiRequest(`/api/admin/offers/${id}`, {
    method: "PUT",
    body: JSON.stringify(offer),
  }),
  deleteOffer: (id: number): Promise<any> => apiRequest(`/api/admin/offers/${id}`, {
    method: "DELETE",
  }),
  getAdminGallery: (): Promise<Gallery[]> => apiRequest("/api/admin/gallery"),
  addGalleryImage: (gallery: any): Promise<Gallery> => apiRequest("/api/admin/gallery", {
    method: "POST",
    body: JSON.stringify(gallery),
  }),
  deleteGalleryImage: (id: number): Promise<any> => apiRequest(`/api/admin/gallery/${id}`, {
    method: "DELETE",
  }),
  getAdminAnnouncements: (): Promise<Announcement[]> => apiRequest("/api/admin/announcements"),
  createAnnouncement: (announcement: any): Promise<Announcement> => apiRequest("/api/admin/announcements", {
    method: "POST",
    body: JSON.stringify(announcement),
  }),
  updateAnnouncement: (id: number, announcement: any): Promise<Announcement> => apiRequest(`/api/admin/announcements/${id}`, {
    method: "PUT",
    body: JSON.stringify(announcement),
  }),
  getAdminBulkOrders: (): Promise<BulkOrder[]> => apiRequest("/api/admin/bulk-orders"),
  updateBulkOrderStatus: (id: number, status: string): Promise<BulkOrder> => 
    apiRequest(`/api/admin/bulk-orders/${id}/status?status=${status}`, { method: "PUT" }),
  getAdminReviews: (): Promise<Review[]> => apiRequest("/api/admin/reviews"),
  approveReview: (id: number): Promise<Review> => apiRequest(`/api/admin/reviews/${id}/approve`, { method: "PUT" }),
  deleteReview: (id: number): Promise<any> => apiRequest(`/api/admin/reviews/${id}`, { method: "DELETE" }),
  getAdminCustomers: (): Promise<any[]> => apiRequest("/api/admin/customers"),
  getAuditLogs: (): Promise<AuditLog[]> => apiRequest("/api/admin/audit-logs"),
  uploadImage: (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    return apiRequest("/api/admin/upload-image", {
      method: "POST",
      body: formData,
    });
  },
};
