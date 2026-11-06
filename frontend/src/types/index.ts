export interface Customer {
  id: number;
  customerCode: string;
  name: string;
  phone?: string;
  address?: string;
  deliveryPerson?: string; // 'Ajay Morning', 'Rahul Evening', etc.
  sortOrder?: number;
  defaultMorningLitres?: number;
  defaultEveningLitres?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerRequest {
  name: string;
  phone?: string;
  address?: string;
  deliveryPerson?: string;
}

export interface MilkRate {
  id: number;
  ratePerLitre: number;
  effectiveFrom: string;
  note?: string;
  createdAt: string;
}

export interface MilkRateRequest {
  ratePerLitre: number;
  effectiveFrom: string;
  note?: string;
}

export interface ProductPrice {
  id: number;
  productId: number;
  productName: string;
  price: number;
  effectiveFrom: string;
  createdAt: string;
}

export interface Product {
  id: number;
  name: string;
  unit: string;
  active: boolean;
  currentPrice: number;
  currentPriceEffectiveFrom?: string;
  priceHistory: ProductPrice[];
  createdAt: string;
}

export interface CreateProductRequest {
  name: string;
  unit: string;
  initialPrice: number;
  effectiveFrom: string;
}

export interface AddProductPriceRequest {
  price: number;
  effectiveFrom: string;
}

export interface MilkEntry {
  id: number;
  customerId: number;
  customerCode: string;
  customerName: string;
  entryDate: string;
  morningLitres: number;
  eveningLitres: number;
  totalLitres: number;
  milkRate: number;
  morningAmount: number;
  eveningAmount: number;
  totalAmount: number;
  updatedAt: string;
}

export interface SingleMilkEntryItem {
  customerId: number;
  date: string;
  morningLitres: number;
  eveningLitres: number;
}

export interface BulkMilkEntryRequest {
  entries: SingleMilkEntryItem[];
}

export interface ProductEntry {
  id: number;
  customerId: number;
  customerCode: string;
  customerName: string;
  productId: number;
  productName: string;
  unit: string;
  purchaseDate: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  notes?: string;
  updatedAt: string;
}

export interface ProductEntryRequest {
  customerId: number;
  productId: number;
  purchaseDate: string;
  quantity: number;
  notes?: string;
}

export interface MonthlyBill {
  id: number;
  customerId: number;
  customerCode: string;
  customerName: string;
  customerPhone?: string;
  billingMonth: number;
  billingYear: number;
  milkMorningLitres: number;
  milkEveningLitres: number;
  milkTotalLitres: number;
  morningTotal: number;
  eveningTotal: number;
  milkTotalAmount: number;
  productTotal: number;
  grandTotal: number;
  billStatus: 'DRAFT' | 'FINALIZED';
  pdfPath?: string;
  generatedAt: string;
  finalizedAt?: string;
}

export interface DailyMilkDetail {
  date: string;
  morningLitres: number;
  eveningLitres: number;
  rate: number;
  morningAmount: number;
  eveningAmount: number;
  totalAmount: number;
}

export interface ProductPurchaseDetail {
  purchaseId: number;
  date: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

export interface BillCalculationResult {
  customerId: number;
  customerCode: string;
  customerName: string;
  phone?: string;
  address?: string;
  deliveryPerson?: string;
  month: number;
  year: number;
  morningLitres: number;
  eveningLitres: number;
  totalLitres: number;
  morningAmount: number;
  eveningAmount: number;
  milkTotalAmount: number;
  productTotalAmount: number;
  grandTotal: number;
  dailyMilkDetails: DailyMilkDetail[];
  productDetails: ProductPurchaseDetail[];
}

export interface BillPreviewResponse {
  month: number;
  year: number;
  totalBills: number;
  aggregateMilkLitres: number;
  aggregateMilkAmount: number;
  aggregateProductAmount: number;
  aggregateGrandTotal: number;
  bills: BillCalculationResult[];
}

export interface DashboardStats {
  totalActiveCustomers: number;
  todayMorningLitres: number;
  todayEveningLitres: number;
  todayTotalLitres: number;
  currentMilkRate: number;
  currentMonthMilkSales: number;
  currentMonthProductSales: number;
  currentMonthEstimatedBilling: number;
  recentActivity: Array<{
    type: string;
    description: string;
    timeAgo: string;
  }>;
}

export interface AppSettings {
  id: number;
  businessName: string;
  tagline?: string;
  ownerName?: string;
  contactPhone?: string;
  address?: string;
  gstOrLicense?: string;
  bankDetails?: string;
  upiId?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
